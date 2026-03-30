const { Audit, Dataset } = require('../models');
const { asyncHandler, apiResponse } = require('../utils');
const { AppError } = require('../middleware/errorHandler');
const { parseDatasetFile } = require('../utils/parseDataset');
const storage = require('../services/storage');
const { metricsService, shapService, slicerService, summaryService, explainerService, mitigationService, reportService } = require('../services/fairness');

const triggerAudit = asyncHandler(async (req, res) => {
  const { datasetId } = req.body;
  if (!datasetId) throw new AppError('datasetId is required', 400);

  const dataset = await Dataset.findOne({ _id: datasetId, owner: req.user.id });
  if (!dataset) throw new AppError('Dataset not found', 404);

  if (!dataset.analysis?.confirmed && dataset.status !== 'confirmed') {
    throw new AppError('Dataset configuration must be confirmed before auditing', 400);
  }

  const targetCol = dataset.analysis?.targetColumn?.column;
  if (!targetCol) throw new AppError('No target column configured — run auto-detect first', 400);

  const protectedCols = (dataset.schemaInfo?.columns || [])
    .filter((c) => c.isProtected)
    .map((c) => c.name);

  if (!protectedCols.length) {
    throw new AppError('No protected attributes configured — run auto-detect first', 400);
  }

  const audit = await Audit.create({
    owner: req.user.id,
    dataset: dataset._id,
    datasetName: dataset.name,
    status: 'analyzing',
    config: {
      targetColumn: targetCol,
      protectedAttributes: protectedCols,
      useCase: dataset.analysis?.useCase?.domain || 'general',
    },
  });

  apiResponse.created(res, { audit }, 'Audit started');

  // Run the heavy computation async (fire-and-forget after responding)
  runAuditPipeline(audit._id, dataset).catch((err) => {
    console.error('[Audit Pipeline] Error:', err.message);
  });
});

async function runAuditPipeline(auditId, dataset) {
  const audit = await Audit.findById(auditId);
  if (!audit) return;

  try {
    let allRows = [];
    const columns = dataset.schemaInfo?.columns || [];

    if (dataset.format !== 'google_sheets' && storage.fileExists(dataset.filePath)) {
      const parsed = await parseDatasetFile(dataset.filePath);
      allRows = parsed.rows;

      // parseDatasetFile only returns 20 rows for preview — re-parse fully
      const fs = require('fs');
      const content = await fs.promises.readFile(dataset.filePath, 'utf-8');
      const ext = require('path').extname(dataset.filePath).toLowerCase();
      if (ext === '.csv') {
        allRows = parseAllCSVRows(content);
      } else if (ext === '.json') {
        allRows = parseAllJSONRows(content, columns);
      }
    }

    if (!allRows.length) {
      throw new Error('No data rows available for analysis');
    }

    const targetCol = audit.config.targetColumn;
    const protectedCols = audit.config.protectedAttributes;
    const useCase = audit.config.useCase;

    // 1. Compute fairness metrics for each protected attribute
    const fairnessMetrics = {};
    for (const attr of protectedCols) {
      fairnessMetrics[attr] = metricsService.computeAllMetrics(allRows, columns, attr, targetCol);
    }

    // 2. Compute overall fairness score
    const fairnessScore = metricsService.computeFairnessScore(fairnessMetrics);
    const severity = metricsService.deriveSeverity(fairnessScore.score);

    // 3. Compute SHAP-like feature attribution
    const shapResult = await shapService.computeFeatureAttribution(
      allRows, columns, targetCol, protectedCols, useCase
    );

    // 4. Compute slice-based evaluation
    const sliceResults = slicerService.computeSliceEvaluation(
      allRows, columns, protectedCols, targetCol
    );

    // 5. Generate plain-language summary
    const biasSummary = await summaryService.generateBiasSummary(
      fairnessMetrics,
      shapResult,
      sliceResults,
      dataset.analysis?.useCase,
      { name: dataset.name, rowCount: allRows.length, columnCount: columns.length }
    );

    // 6. Persist results + sample rows for explainer
    audit.fairnessMetrics = fairnessMetrics;
    audit.fairnessScore = fairnessScore;
    audit.shapValues = shapResult;
    audit.sliceResults = sliceResults;
    audit.biasSummary = biasSummary;
    audit.severityScore = severity;
    audit.sampleRows = allRows.slice(0, 50);
    audit.columnNames = columns.map((c) => c.name);
    audit.status = 'completed';
    audit.completedAt = new Date();
    await audit.save();

  } catch (err) {
    audit.status = 'failed';
    audit.error = err.message;
    await audit.save();
    console.error(`[Audit ${auditId}] Pipeline failed:`, err.message);
  }
}

/**
 * Parse ALL CSV rows (not just 20 for preview).
 */
function parseAllCSVRows(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"' && (c === 0 || line[c - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    rows.push(values);
  }
  return rows;
}

/**
 * Parse ALL JSON rows.
 */
function parseAllJSONRows(content, columns) {
  const data = JSON.parse(content);
  const arr = Array.isArray(data) ? data : data.data || data.records || data.rows || [data];
  const keys = columns.map((c) => c.name);
  return arr.map((row) => keys.map((k) => row[k] ?? ''));
}

const getAudits = asyncHandler(async (req, res) => {
  const audits = await Audit.find({ owner: req.user.id })
    .select('dataset datasetName status severityScore fairnessScore config completedAt createdAt biasSummary.overallRiskLevel')
    .sort({ createdAt: -1 })
    .lean();

  apiResponse.success(res, { audits });
});

const getAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id }).lean();
  if (!audit) throw new AppError('Audit not found', 404);

  apiResponse.success(res, { audit });
});

const getAuditReport = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id }).lean();
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit not yet completed', 400);

  apiResponse.success(res, {
    report: {
      datasetName: audit.datasetName,
      config: audit.config,
      fairnessScore: audit.fairnessScore,
      severity: audit.severityScore,
      biasSummary: audit.biasSummary,
      fairnessMetrics: audit.fairnessMetrics,
      completedAt: audit.completedAt,
    },
  });
});

const explainRow = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id }).lean();
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit not yet completed', 400);

  const { rowIndex } = req.body;
  if (rowIndex == null || rowIndex < 0) throw new AppError('Valid rowIndex is required', 400);

  const rows = audit.sampleRows || [];
  if (rowIndex >= rows.length) throw new AppError(`Row ${rowIndex} not available (${rows.length} rows stored)`, 400);

  const row = rows[rowIndex];
  const dataset = await Dataset.findById(audit.dataset).lean();
  const columns = dataset?.schemaInfo?.columns || [];
  const protectedCols = audit.config?.protectedAttributes || [];
  const targetCol = audit.config?.targetColumn;
  const shapValues = audit.shapValues?.shapValues || [];
  const useCase = audit.config?.useCase;

  const explanation = await explainerService.explainDecision(
    row, columns, targetCol, protectedCols, shapValues, useCase
  );

  apiResponse.success(res, { explanation, row, rowIndex });
});

const previewMitigation = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id });
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit not yet completed', 400);

  const { strategy, params } = req.body;
  if (!strategy) throw new AppError('strategy is required', 400);

  const dataset = await Dataset.findById(audit.dataset);
  if (!dataset) throw new AppError('Dataset not found', 404);

  const allRows = await loadAuditRows(audit, dataset);
  const columns = dataset.schemaInfo?.columns || [];
  const protectedCols = audit.config?.protectedAttributes || [];
  const targetCol = audit.config?.targetColumn;

  const preview = mitigationService.previewMitigation(
    allRows, columns, protectedCols, targetCol, strategy, params || {}
  );

  apiResponse.success(res, { preview });
});

const applyMitigation = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id });
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit not yet completed', 400);

  const { strategy, params } = req.body;
  if (!strategy) throw new AppError('strategy is required', 400);

  const dataset = await Dataset.findById(audit.dataset);
  if (!dataset) throw new AppError('Dataset not found', 404);

  const allRows = await loadAuditRows(audit, dataset);
  const columns = dataset.schemaInfo?.columns || [];
  const protectedCols = audit.config?.protectedAttributes || [];
  const targetCol = audit.config?.targetColumn;

  const preview = mitigationService.previewMitigation(
    allRows, columns, protectedCols, targetCol, strategy, params || {}
  );

  if (!audit.mitigations) audit.mitigations = [];
  audit.mitigations.push({
    strategy,
    params: params || {},
    appliedAt: new Date(),
    before: { score: preview.before.fairnessScore.score, severity: preview.before.severity },
    after: { score: preview.after.fairnessScore.score, severity: preview.after.severity },
    details: preview.strategyDetails,
  });
  await audit.save();

  apiResponse.success(res, {
    mitigation: audit.mitigations[audit.mitigations.length - 1],
    preview,
  });
});

async function loadAuditRows(audit, dataset) {
  if (audit.sampleRows?.length) return audit.sampleRows;

  const columns = dataset.schemaInfo?.columns || [];
  if (dataset.format !== 'google_sheets' && storage.fileExists(dataset.filePath)) {
    const fs = require('fs');
    const content = await fs.promises.readFile(dataset.filePath, 'utf-8');
    const ext = require('path').extname(dataset.filePath).toLowerCase();
    if (ext === '.csv') return parseAllCSVRows(content);
    if (ext === '.json') return parseAllJSONRows(content, columns);
  }
  return [];
}

const generateReport = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id }).lean();
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit not yet completed', 400);

  const dataset = await Dataset.findById(audit.dataset).lean();
  const report = await reportService.generateFullReport(audit, dataset);

  apiResponse.success(res, { report });
});

const generateModelCard = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id }).lean();
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit not yet completed', 400);

  const dataset = await Dataset.findById(audit.dataset).lean();
  const modelCard = await reportService.generateModelCard(audit, dataset);

  apiResponse.success(res, { modelCard });
});

const deleteAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findOne({ _id: req.params.id, owner: req.user.id });
  if (!audit) throw new AppError('Audit not found', 404);

  await Audit.deleteOne({ _id: audit._id });
  apiResponse.success(res, null, 'Audit deleted');
});

module.exports = { triggerAudit, getAudits, getAudit, getAuditReport, explainRow, previewMitigation, applyMitigation, generateReport, generateModelCard, deleteAudit };
