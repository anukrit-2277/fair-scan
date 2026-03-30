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
 * Dataset-only proxy: Among rows where non-protected numeric features
 * suggest qualification (above-median), is the positive outcome rate
 * equal across groups? This approximates "are qualified people from
 * all groups treated equally?"
 */
const equalOpportunity = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = getTargetIdx(columns, targetCol);
  if (targetIdx === -1) return null;

  // Identify numeric, non-protected, non-target columns for qualification proxy
  const numericCols = columns
    .map((c, i) => ({ ...c, idx: i }))
    .filter((c) => c.dtype === 'number' && c.name !== targetCol && c.name !== protectedCol && !c.isProtected && !c.isProxy);

  // If no numeric features, fall back to positive rate (equivalent to DP)
  if (!numericCols.length) {
    const rates = {};
    for (const [group, groupRows] of Object.entries(groups)) {
      const posRows = groupRows.filter((r) => isPositive(r[targetIdx]));
      rates[group] = { tpr: groupRows.length > 0 ? posRows.length / groupRows.length : 0, count: groupRows.length, positiveCount: posRows.length };
    }
    const tprValues = Object.values(rates).map((r) => r.tpr);
    const disparity = Math.max(...tprValues) - Math.min(...tprValues);
    return {
      metric: 'equal_opportunity',
      groups: rates,
      disparity: Math.round(disparity * 10000) / 10000,
      pass: disparity < 0.1,
      threshold: 0.1,
      note: 'No numeric features available — using positive rate as fallback',
    };
  }

  // Compute median for each numeric column
  const medians = numericCols.map((col) => {
    const values = rows.map((r) => Number(r[col.idx]) || 0).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  });

  // A row is "likely qualified" if majority of numeric features are at or above median
  const isQualified = (row) => {
    let aboveCount = 0;
    for (let i = 0; i < numericCols.length; i++) {
      if ((Number(row[numericCols[i].idx]) || 0) >= medians[i]) aboveCount++;
    }
    return aboveCount > numericCols.length / 2;
  };

  const rates = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    const qualifiedRows = groupRows.filter(isQualified);
    const qualifiedPositive = qualifiedRows.filter((r) => isPositive(r[targetIdx]));
    const tpr = qualifiedRows.length > 0 ? qualifiedPositive.length / qualifiedRows.length : 0;
    rates[group] = {
      tpr,
      count: groupRows.length,
      qualifiedCount: qualifiedRows.length,
      positiveCount: qualifiedPositive.length,
    };
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
 * Dataset-only proxy: Measures outcome concentration — are positive
 * outcomes proportionally distributed across groups?
 * concentration = (group's share of positives) / (group's share of total)
 * A concentration of 1.0 means perfectly proportional.
 */
const predictiveParity = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = getTargetIdx(columns, targetCol);
  if (targetIdx === -1) return null;

  const totalCount = rows.length;
  const totalPositives = rows.filter((r) => isPositive(r[targetIdx])).length;

  if (totalPositives === 0 || totalCount === 0) {
    const rates = {};
    for (const [group, groupRows] of Object.entries(groups)) {
      rates[group] = { precision: 0, count: groupRows.length, positiveCount: 0, concentration: 0 };
    }
    return { metric: 'predictive_parity', groups: rates, disparity: 0, pass: true, threshold: 0.25 };
  }

  const rates = {};
  for (const [group, groupRows] of Object.entries(groups)) {
    const posCount = groupRows.filter((r) => isPositive(r[targetIdx])).length;
    const groupShare = groupRows.length / totalCount;
    const positiveShare = posCount / totalPositives;
    const concentration = groupShare > 0 ? positiveShare / groupShare : 0;
    const precision = groupRows.length > 0 ? posCount / groupRows.length : 0;
    rates[group] = {
      precision,
      count: groupRows.length,
      positiveCount: posCount,
      concentration: Math.round(concentration * 10000) / 10000,
    };
  }

  const concentrations = Object.values(rates).map((r) => r.concentration);
  const maxConc = Math.max(...concentrations);
  const minConc = Math.min(...concentrations);
  const disparity = maxConc - minConc;

  return {
    metric: 'predictive_parity',
    groups: rates,
    disparity: Math.round(disparity * 10000) / 10000,
    pass: disparity < 0.25,
    threshold: 0.25,
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
