/**
 * Feature attribution analysis.
 * Combines statistical correlation computation with Gemini-powered
 * interpretation to produce SHAP-like explanations.
 */

const { generateJSON } = require('../ai/gemini.service');
const { isPositive } = require('./metrics.service');
const { round4 } = require('../../utils/math');

/**
 * Compute point-biserial-style correlation between each feature and
 * the binary target column. For numeric features, use mean difference;
 * for categorical, use Cramér's V approximation.
 */
const computeFeatureCorrelations = (rows, columns, targetCol, protectedCols) => {
  const targetIdx = columns.findIndex((c) => c.name === targetCol);
  if (targetIdx === -1) return [];

  const posRows = rows.filter((r) => isPositive(r[targetIdx]));
  const negRows = rows.filter((r) => !isPositive(r[targetIdx]));

  return columns
    .map((col, colIdx) => {
      if (col.name === targetCol) return null;

      const isNumeric = col.dtype === 'number';
      const isProtectedCol = protectedCols.includes(col.name);

      if (isNumeric) {
        const posMean = mean(posRows.map((r) => Number(r[colIdx]) || 0));
        const negMean = mean(negRows.map((r) => Number(r[colIdx]) || 0));
        const allStd = stddev(rows.map((r) => Number(r[colIdx]) || 0));
        const effect = allStd > 0 ? (posMean - negMean) / allStd : 0;

        return {
          feature: col.name,
          dtype: col.dtype,
          importance: Math.abs(effect),
          direction: effect > 0 ? 'positive' : 'negative',
          isProtected: isProtectedCol,
          posMean: round4(posMean),
          negMean: round4(negMean),
        };
      }

      const posValues = posRows.map((r) => String(r[colIdx] ?? ''));
      const negValues = negRows.map((r) => String(r[colIdx] ?? ''));
      const posDist = distribution(posValues);
      const negDist = distribution(negValues);
      const chiSq = chiSquareApprox(posDist, negDist, posRows.length, negRows.length);

      return {
        feature: col.name,
        dtype: col.dtype,
        importance: chiSq,
        direction: 'categorical',
        isProtected: isProtectedCol,
        topValues: Object.entries(posDist).sort((a, b) => b[1] - a[1]).slice(0, 5),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.importance - a.importance);
};

/**
 * Use Gemini to generate human-readable SHAP-like interpretation.
 */
const generateShapExplanation = async (correlations, protectedCols, useCase) => {
  const top12 = correlations.slice(0, 12);

  const prompt = `Analyze these feature attributions for a fairness audit of a ${useCase || 'general'} AI model.

FEATURE IMPORTANCE (sorted by importance):
${top12.map((f, i) => `${i + 1}. "${f.feature}" (${f.dtype}) — importance: ${round4(f.importance)}, direction: ${f.direction}${f.isProtected ? ' [PROTECTED ATTRIBUTE]' : ''}`).join('\n')}

PROTECTED ATTRIBUTES: ${protectedCols.join(', ') || 'None flagged'}

Respond with JSON:
{
  "shapValues": [
    {
      "feature": "<name>",
      "importance": <0.0-1.0 normalized>,
      "direction": "<positive|negative|mixed>",
      "biasRisk": "<none|low|medium|high>",
      "explanation": "<1 sentence explaining this feature's role in predictions and any bias risk>"
    }
  ],
  "keyFindings": [
    "<finding about which features most drive predictions>",
    "<finding about protected/proxy attribute influence>",
    "<finding about potential hidden bias patterns>"
  ]
}

Rules:
- Normalize importance scores so the highest is 1.0
- Flag high biasRisk for protected attributes or their close proxies that have high importance
- Be specific and actionable in explanations`;

  const system = 'You are FairScan, an expert in AI fairness and SHAP-based feature attribution. Output only valid JSON.';

  return generateJSON(prompt, system);
};

/**
 * Full feature attribution pipeline.
 */
const computeFeatureAttribution = async (rows, columns, targetCol, protectedCols, useCase) => {
  const correlations = computeFeatureCorrelations(rows, columns, targetCol, protectedCols);

  const maxImp = Math.max(...correlations.map((c) => c.importance), 0.001);
  const normalized = correlations.map((c) => ({
    ...c,
    importance: round4(c.importance / maxImp),
  }));

  let geminiShap = { shapValues: [], keyFindings: [] };
  try {
    geminiShap = await generateShapExplanation(normalized, protectedCols, useCase);
  } catch (err) {
    console.error('[SHAP] Gemini interpretation failed:', err.message);
    geminiShap.shapValues = normalized.slice(0, 12).map((c) => ({
      feature: c.feature,
      importance: c.importance,
      direction: c.direction,
      biasRisk: c.isProtected ? 'high' : 'none',
      explanation: `${c.feature} has ${c.importance > 0.5 ? 'high' : 'moderate'} influence on predictions.`,
    }));
    geminiShap.keyFindings = ['Gemini analysis unavailable — showing statistical correlations only.'];
  }

  return {
    shapValues: geminiShap.shapValues || [],
    keyFindings: geminiShap.keyFindings || [],
    rawCorrelations: normalized.slice(0, 20),
  };
};

// ─── Helpers ───

const mean = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

const stddev = (arr) => {
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(arr.length - 1, 1);
  return Math.sqrt(variance);
};

const distribution = (arr) => {
  const dist = {};
  for (const v of arr) { dist[v] = (dist[v] || 0) + 1; }
  return dist;
};

const chiSquareApprox = (distA, distB, nA, nB) => {
  const allKeys = [...new Set([...Object.keys(distA), ...Object.keys(distB)])];
  let chi = 0;
  for (const key of allKeys) {
    const oA = distA[key] || 0;
    const oB = distB[key] || 0;
    const total = oA + oB;
    const eA = (total * nA) / (nA + nB);
    const eB = (total * nB) / (nA + nB);
    if (eA > 0) chi += ((oA - eA) ** 2) / eA;
    if (eB > 0) chi += ((oB - eB) ** 2) / eB;
  }
  const df = Math.max(allKeys.length - 1, 1);
  return Math.min(Math.sqrt(chi / (chi + nA + nB)), 1);
};

// round4 imported from shared utils at top of file

module.exports = { computeFeatureAttribution, computeFeatureCorrelations };
