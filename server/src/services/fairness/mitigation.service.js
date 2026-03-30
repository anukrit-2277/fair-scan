/**
 * Mitigation engine — 4 pre/post-processing debiasing strategies.
 *
 * 1. Resampling   — balance group representation by over/undersampling
 * 2. Reweighting  — compute per-row sample weights to equalise group impact
 * 3. Proxy removal — drop proxy columns that encode protected attributes
 * 4. Threshold adjustment — per-group decision thresholds to equalise outcomes
 *
 * Each strategy returns the mitigated rows/weights/thresholds plus a
 * before/after metric snapshot so the UI can show the comparison.
 */

const metricsService = require('./metrics.service');
const { groupBy, isPositive } = metricsService;
const { round4 } = require('../../utils/math');

/* ═══════════════════════════════════════════
   1. RESAMPLING
   ═══════════════════════════════════════════ */

const resample = (rows, columns, protectedCol, targetCol, mode = 'oversample') => {
  const groups = groupBy(rows, columns, protectedCol);
  const counts = Object.entries(groups).map(([g, r]) => ({ group: g, count: r.length, rows: r }));

  if (!counts.length) return { rows, changes: {} };

  const targetCount = mode === 'oversample'
    ? Math.max(...counts.map((c) => c.count))
    : Math.min(...counts.map((c) => c.count));

  const mitigated = [];
  const changes = {};

  for (const { group, count, rows: gRows } of counts) {
    if (mode === 'oversample') {
      const result = [...gRows];
      while (result.length < targetCount) {
        result.push(gRows[Math.floor(Math.random() * gRows.length)]);
      }
      changes[group] = { before: count, after: result.length };
      mitigated.push(...result);
    } else {
      const shuffled = [...gRows].sort(() => Math.random() - 0.5);
      const result = shuffled.slice(0, targetCount);
      changes[group] = { before: count, after: result.length };
      mitigated.push(...result);
    }
  }

  return { rows: mitigated, changes };
};

/* ═══════════════════════════════════════════
   2. REWEIGHTING
   ═══════════════════════════════════════════ */

const reweight = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const total = rows.length;
  const targetIdx = columns.findIndex((c) => c.name === targetCol);
  const numGroups = Object.keys(groups).length;
  const expectedGroupSize = total / Math.max(numGroups, 1);

  const overallPosRate = rows.filter((r) => isPositive(r[targetIdx])).length / Math.max(total, 1);
  const colIdx = columns.findIndex((c) => c.name === protectedCol);

  const groupWeights = {};
  for (const [group, gRows] of Object.entries(groups)) {
    const groupPosRate = gRows.filter((r) => isPositive(r[targetIdx])).length / Math.max(gRows.length, 1);
    const sizeWeight = expectedGroupSize / Math.max(gRows.length, 1);
    const rateWeight = overallPosRate > 0 ? overallPosRate / Math.max(groupPosRate, 0.001) : 1;
    const combined = round4(sizeWeight * 0.5 + rateWeight * 0.5);
    groupWeights[group] = {
      weight: round4(Math.min(Math.max(combined, 0.1), 10)),
      sizeWeight: round4(sizeWeight),
      rateWeight: round4(rateWeight),
      count: gRows.length,
      positiveRate: round4(groupPosRate),
    };
  }

  const rowWeights = rows.map((row) => {
    const group = String(row[colIdx] ?? 'unknown').trim() || 'unknown';
    return groupWeights[group]?.weight ?? 1;
  });

  return { weights: rowWeights, groupWeights };
};

/**
 * Apply sample weights by converting them to resampled rows.
 * Weight > 1 means duplicate; weight < 1 means probabilistic inclusion.
 */
const applyWeightsAsResampling = (rows, weights) => {
  const resampled = [];
  for (let i = 0; i < rows.length; i++) {
    const copies = Math.max(1, Math.round(weights[i]));
    for (let c = 0; c < copies; c++) {
      resampled.push(rows[i]);
    }
  }
  return resampled;
};

/* ═══════════════════════════════════════════
   3. PROXY REMOVAL
   ═══════════════════════════════════════════ */

const removeProxies = (rows, columns, proxyCols) => {
  const proxyIndices = new Set(
    proxyCols.map((name) => columns.findIndex((c) => c.name === name)).filter((i) => i >= 0)
  );

  if (!proxyIndices.size) return { rows, columns, removedColumns: [] };

  const newColumns = columns.filter((_, i) => !proxyIndices.has(i));
  const newRows = rows.map((row) => row.filter((_, i) => !proxyIndices.has(i)));

  return {
    rows: newRows,
    columns: newColumns,
    removedColumns: proxyCols.filter((name) => columns.some((c) => c.name === name)),
  };
};

/* ═══════════════════════════════════════════
   4. THRESHOLD ADJUSTMENT
   ═══════════════════════════════════════════ */

const adjustThresholds = (rows, columns, protectedCol, targetCol, thresholds) => {
  const colIdx = columns.findIndex((c) => c.name === protectedCol);
  const targetIdx = columns.findIndex((c) => c.name === targetCol);
  if (colIdx === -1 || targetIdx === -1) return { rows, adjustedCount: 0 };

  let adjustedCount = 0;
  const adjustedRows = rows.map((row) => {
    const group = String(row[colIdx] ?? 'unknown').trim() || 'unknown';
    const threshold = thresholds[group];
    if (threshold == null) return row;

    const val = row[targetIdx];
    const numVal = Number(val);
    if (isNaN(numVal)) return row;

    const newOutcome = numVal >= threshold ? '1' : '0';
    const oldOutcome = isPositive(val) ? '1' : '0';
    if (newOutcome !== oldOutcome) adjustedCount++;

    const newRow = [...row];
    newRow[targetIdx] = newOutcome;
    return newRow;
  });

  return { rows: adjustedRows, adjustedCount };
};

/* ═══════════════════════════════════════════
   PREVIEW — compute before/after for any strategy
   ═══════════════════════════════════════════ */

const previewMitigation = (rows, columns, protectedCols, targetCol, strategy, params = {}) => {
  const beforeMetrics = {};
  for (const attr of protectedCols) {
    beforeMetrics[attr] = metricsService.computeAllMetrics(rows, columns, attr, targetCol);
  }
  const beforeScore = metricsService.computeFairnessScore(beforeMetrics);

  let mitigatedRows = rows;
  let mitigatedColumns = columns;
  let strategyDetails = {};

  switch (strategy) {
    case 'resample': {
      const mode = params.mode || 'oversample';
      const attr = params.attribute || protectedCols[0];
      const result = resample(rows, columns, attr, targetCol, mode);
      mitigatedRows = result.rows;
      strategyDetails = { mode, attribute: attr, changes: result.changes };
      break;
    }
    case 'reweight': {
      const attr = params.attribute || protectedCols[0];
      const result = reweight(rows, columns, attr, targetCol);
      // Apply weights as resampling so after-metrics reflect the effect
      mitigatedRows = applyWeightsAsResampling(rows, result.weights);
      strategyDetails = { attribute: attr, groupWeights: result.groupWeights };
      break;
    }
    case 'proxy_removal': {
      const proxyCols = params.proxyCols || [];
      const result = removeProxies(rows, columns, proxyCols);
      mitigatedRows = result.rows;
      mitigatedColumns = result.columns;
      strategyDetails = { removedColumns: result.removedColumns };
      break;
    }
    case 'threshold': {
      const attr = params.attribute || protectedCols[0];
      const thresholds = params.thresholds || {};
      const result = adjustThresholds(rows, columns, attr, targetCol, thresholds);
      mitigatedRows = result.rows;
      strategyDetails = { attribute: attr, thresholds, adjustedCount: result.adjustedCount };
      break;
    }
    default:
      throw new Error(`Unknown mitigation strategy: ${strategy}`);
  }

  const afterProtectedCols = protectedCols.filter((attr) =>
    mitigatedColumns.some((c) => c.name === attr)
  );
  const afterMetrics = {};
  for (const attr of afterProtectedCols) {
    afterMetrics[attr] = metricsService.computeAllMetrics(mitigatedRows, mitigatedColumns, attr, targetCol);
  }
  const afterScore = metricsService.computeFairnessScore(afterMetrics);

  return {
    strategy,
    params,
    strategyDetails,
    before: {
      fairnessScore: beforeScore,
      severity: metricsService.deriveSeverity(beforeScore.score),
      metrics: beforeMetrics,
      rowCount: rows.length,
      columnCount: columns.length,
    },
    after: {
      fairnessScore: afterScore,
      severity: metricsService.deriveSeverity(afterScore.score),
      metrics: afterMetrics,
      rowCount: mitigatedRows.length,
      columnCount: mitigatedColumns.length,
    },
  };
};

module.exports = {
  resample,
  reweight,
  removeProxies,
  adjustThresholds,
  previewMitigation,
};
