/**
 * Slice-based model/dataset evaluation.
 * Breaks down performance metrics by demographic slices — individual
 * groups and intersectional combinations.
 */

const { groupBy, isPositive } = require('./metrics.service');

/**
 * Compute per-slice metrics for a single protected attribute.
 */
const sliceMetrics = (rows, columns, protectedCol, targetCol) => {
  const groups = groupBy(rows, columns, protectedCol);
  const targetIdx = columns.findIndex((c) => c.name === targetCol);
  if (targetIdx === -1) return [];

  const overallPosRate = rows.filter((r) => isPositive(r[targetIdx])).length / Math.max(rows.length, 1);

  return Object.entries(groups).map(([groupName, groupRows]) => {
    const total = groupRows.length;
    const positives = groupRows.filter((r) => isPositive(r[targetIdx]));
    const negatives = groupRows.filter((r) => !isPositive(r[targetIdx]));

    const tp = positives.length;
    const fn = 0; // dataset-only: all positive outcomes are "detected"
    const fp = 0;
    const tn = negatives.length;

    const posRate = total > 0 ? tp / total : 0;
    const accuracy = total > 0 ? (tp + tn) / total : 0;
    const fpr = negatives.length > 0 ? fp / negatives.length : 0;
    const fnr = positives.length > 0 ? fn / (tp + fn || 1) : 0;
    const precision = tp > 0 ? tp / (tp + fp || 1) : 0;
    const recall = tp > 0 ? tp / (tp + fn || 1) : 0;

    return {
      group: groupName,
      attribute: protectedCol,
      count: total,
      percentage: round2((total / rows.length) * 100),
      positiveRate: round4(posRate),
      accuracy: round4(accuracy),
      fpr: round4(fpr),
      fnr: round4(fnr),
      precision: round4(precision),
      recall: round4(recall),
      deviationFromOverall: round4(posRate - overallPosRate),
    };
  }).sort((a, b) => b.count - a.count);
};

/**
 * Compute intersectional slices (e.g. gender=female AND race=black).
 * Only produces 2-attribute intersections to keep output manageable.
 */
const intersectionalSlices = (rows, columns, protectedCols, targetCol) => {
  if (protectedCols.length < 2) return [];
  const targetIdx = columns.findIndex((c) => c.name === targetCol);
  if (targetIdx === -1) return [];

  const results = [];

  for (let i = 0; i < protectedCols.length; i++) {
    for (let j = i + 1; j < protectedCols.length; j++) {
      const colA = protectedCols[i];
      const colB = protectedCols[j];
      const idxA = columns.findIndex((c) => c.name === colA);
      const idxB = columns.findIndex((c) => c.name === colB);
      if (idxA === -1 || idxB === -1) continue;

      const combos = {};
      for (const row of rows) {
        const keyA = String(row[idxA] ?? 'unknown').trim();
        const keyB = String(row[idxB] ?? 'unknown').trim();
        const key = `${colA}=${keyA} & ${colB}=${keyB}`;
        if (!combos[key]) combos[key] = [];
        combos[key].push(row);
      }

      for (const [combo, comboRows] of Object.entries(combos)) {
        if (comboRows.length < 5) continue; // skip tiny slices
        const pos = comboRows.filter((r) => isPositive(r[targetIdx]));
        results.push({
          slice: combo,
          attributes: [colA, colB],
          count: comboRows.length,
          positiveRate: round4(pos.length / comboRows.length),
          positiveCount: pos.length,
        });
      }
    }
  }

  return results.sort((a, b) => a.positiveRate - b.positiveRate);
};

/**
 * Full slice-based evaluation pipeline.
 */
const computeSliceEvaluation = (rows, columns, protectedCols, targetCol) => {
  const perAttribute = {};
  for (const col of protectedCols) {
    perAttribute[col] = sliceMetrics(rows, columns, col, targetCol);
  }

  const intersectional = intersectionalSlices(rows, columns, protectedCols, targetCol);

  const worstSlice = intersectional[0] || null;
  const bestSlice = intersectional[intersectional.length - 1] || null;

  return {
    perAttribute,
    intersectional: intersectional.slice(0, 30),
    worstSlice,
    bestSlice,
    totalSlicesComputed: Object.values(perAttribute).reduce((s, arr) => s + arr.length, 0) + intersectional.length,
  };
};

const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;

module.exports = { computeSliceEvaluation, sliceMetrics, intersectionalSlices };
