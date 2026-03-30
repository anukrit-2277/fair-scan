/**
 * Core fairness metrics computation engine.
 * All metrics operate on tabular data with a binary target column
 * and one or more protected attribute columns.
 */

const groupBy = (rows, columns, protectedCol) => {
  const colIdx = columns.findIndex((c) => c.name === protectedCol);
  if (colIdx === -1) return {};

  const groups = {};
  for (const row of rows) {
    const key = String(row[colIdx] ?? 'unknown').trim() || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }
  return groups;
};

const getTargetIdx = (columns, targetCol) => {
  return columns.findIndex((c) => c.name === targetCol);
};

const isPositive = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const s = String(val).toLowerCase().trim();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'approved' || s === 'accepted' || s === 'pass') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'denied' || s === 'rejected' || s === 'fail') return false;
  return Number(val) > 0;
};

const positiveRate = (rows, targetIdx) => {
  if (!rows.length) return 0;
  const pos = rows.filter((r) => isPositive(r[targetIdx])).length;
  return pos / rows.length;
};

/**
 * Demographic Parity: P(Y=1 | group=A) should equal P(Y=1 | group=B)
 * Returns per-group positive rates and the max disparity.
 */
const demographicParity = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = getTargetIdx(columns, targetCol);
  if (targetIdx === -1) return null;

  const rates = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    rates[group] = {
      positiveRate: positiveRate(groupRows, targetIdx),
      count: groupRows.length,
      positiveCount: groupRows.filter((r) => isPositive(r[targetIdx])).length,
    };
  }

  const rateValues = Object.values(rates).map((r) => r.positiveRate);
  const maxRate = Math.max(...rateValues);
  const minRate = Math.min(...rateValues);
  const disparity = maxRate - minRate;

  return {
    metric: 'demographic_parity',
    groups: rates,
    disparity: Math.round(disparity * 10000) / 10000,
    maxRate: Math.round(maxRate * 10000) / 10000,
    minRate: Math.round(minRate * 10000) / 10000,
    pass: disparity < 0.1,
    threshold: 0.1,
  };
};

/**
 * Disparate Impact: min(rate) / max(rate) should be >= 0.8 (the 80% rule)
 */
const disparateImpact = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = getTargetIdx(columns, targetCol);
  if (targetIdx === -1) return null;

  const rates = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    rates[group] = {
      positiveRate: positiveRate(groupRows, targetIdx),
      count: groupRows.length,
    };
  }

  const rateValues = Object.values(rates).map((r) => r.positiveRate).filter((r) => r > 0);
  const maxRate = Math.max(...rateValues, 0.001);
  const minRate = Math.min(...rateValues);
  const ratio = maxRate > 0 ? minRate / maxRate : 1;

  return {
    metric: 'disparate_impact',
    groups: rates,
    ratio: Math.round(ratio * 10000) / 10000,
    pass: ratio >= 0.8,
    threshold: 0.8,
  };
};

/**
 * Equal Opportunity: TPR should be equal across groups.
 * For dataset-only audit, we approximate using positive outcome rate within
 * each group as TPR-proxy (treating the target column as ground truth).
 */
const equalOpportunity = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = getTargetIdx(columns, targetCol);
  if (targetIdx === -1) return null;

  const rates = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    const posRows = groupRows.filter((r) => isPositive(r[targetIdx]));
    const tpr = groupRows.length > 0 ? posRows.length / groupRows.length : 0;
    rates[group] = { tpr, count: groupRows.length, positiveCount: posRows.length };
  }

  const tprValues = Object.values(rates).map((r) => r.tpr);
  const maxTPR = Math.max(...tprValues);
  const minTPR = Math.min(...tprValues);
  const disparity = maxTPR - minTPR;

  return {
    metric: 'equal_opportunity',
    groups: rates,
    disparity: Math.round(disparity * 10000) / 10000,
    pass: disparity < 0.1,
    threshold: 0.1,
  };
};

/**
 * Predictive Parity: precision should be equal across groups.
 * Dataset-only approximation — within each group, what fraction of
 * "positive" outcomes are in the majority outcome? (calibration proxy)
 */
const predictiveParity = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = getTargetIdx(columns, targetCol);
  if (targetIdx === -1) return null;

  const rates = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    const posRows = groupRows.filter((r) => isPositive(r[targetIdx]));
    const precision = groupRows.length > 0 ? posRows.length / groupRows.length : 0;
    rates[group] = { precision, count: groupRows.length, positiveCount: posRows.length };
  }

  const precValues = Object.values(rates).map((r) => r.precision);
  const maxPrec = Math.max(...precValues);
  const minPrec = Math.min(...precValues);
  const disparity = maxPrec - minPrec;

  return {
    metric: 'predictive_parity',
    groups: rates,
    disparity: Math.round(disparity * 10000) / 10000,
    pass: disparity < 0.1,
    threshold: 0.1,
  };
};

/**
 * Statistical parity difference — measures representation.
 * How over/under-represented is each group vs expected uniform distribution?
 */
const representationGap = (rows, columns, protectedCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const total = rows.length;
  const numGroups = Object.keys(groups).length;
  const expected = total / Math.max(numGroups, 1);

  const gaps = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    gaps[group] = {
      count: groupRows.length,
      percentage: Math.round((groupRows.length / total) * 10000) / 100,
      deviation: Math.round(((groupRows.length - expected) / expected) * 10000) / 100,
    };
  }

  return { metric: 'representation_gap', groups: gaps, total };
};

/**
 * Run all fairness metrics for one protected attribute.
 */
const computeAllMetrics = (rows, columns, protectedCol, targetCol) => {
  return {
    demographicParity: demographicParity(rows, columns, protectedCol, targetCol),
    equalOpportunity: equalOpportunity(rows, columns, protectedCol, targetCol),
    predictiveParity: predictiveParity(rows, columns, protectedCol, targetCol),
    disparateImpact: disparateImpact(rows, columns, protectedCol, targetCol),
    representation: representationGap(rows, columns, protectedCol),
  };
};

/**
 * Compute an overall fairness score (0-100) from all metrics.
 */
const computeFairnessScore = (metricsMap) => {
  let passed = 0;
  let total = 0;
  const penalties = [];

  for (const [_attr, metrics] of Object.entries(metricsMap)) {
    for (const [_name, m] of Object.entries(metrics)) {
      if (m && typeof m.pass === 'boolean') {
        total++;
        if (m.pass) passed++;
        else penalties.push(m.metric);
      }
    }
  }

  if (total === 0) return { score: 100, penalties: [] };
  const score = Math.round((passed / total) * 100);
  return { score, penalties };
};

/**
 * Derive severity from fairness score.
 */
const deriveSeverity = (score) => {
  if (score >= 85) return 'low';
  if (score >= 65) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
};

module.exports = {
  computeAllMetrics,
  computeFairnessScore,
  deriveSeverity,
  demographicParity,
  equalOpportunity,
  predictiveParity,
  disparateImpact,
  representationGap,
  groupBy,
  isPositive,
};
