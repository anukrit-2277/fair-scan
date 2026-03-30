/**
 * Per-decision explainer — generates a human-readable explanation
 * for any individual prediction/row in the dataset.
 * "Why was this loan denied?" / "Why was this applicant rejected?"
 */

const { generateJSON } = require('../ai/gemini.service');

const buildExplainerPrompt = (row, columns, targetCol, protectedCols, shapValues, useCase) => {
  const rowData = columns.map((col, i) => `  "${col.name}": ${JSON.stringify(row[i] ?? '')}`).join('\n');
  const targetIdx = columns.findIndex((c) => c.name === targetCol);
  const outcome = row[targetIdx] ?? 'unknown';

  const topFeatures = (shapValues || []).slice(0, 8).map(
    (f) => `  - "${f.feature}" (importance: ${f.importance}, bias risk: ${f.biasRisk || 'none'})`
  ).join('\n');

  const protectedVals = protectedCols.map((attr) => {
    const idx = columns.findIndex((c) => c.name === attr);
    return `  - ${attr}: ${row[idx] ?? 'N/A'}`;
  }).join('\n');

  return `Generate a per-decision explanation for this individual record in a ${useCase || 'general'} fairness audit.

INDIVIDUAL RECORD:
${rowData}

DECISION OUTCOME: "${targetCol}" = ${JSON.stringify(outcome)}

PROTECTED ATTRIBUTES FOR THIS INDIVIDUAL:
${protectedVals}

TOP FEATURES BY MODEL IMPORTANCE:
${topFeatures || 'Not available'}

Respond with JSON:
{
  "outcome": "<positive|negative>",
  "outcomeLabel": "<human-readable outcome, e.g. 'Loan Approved' or 'Application Denied'>",
  "explanation": "<3-5 sentence plain-English explanation of why this individual received this outcome. Reference specific feature values from the record. Written for a non-technical person who received this decision.>",
  "keyFactors": [
    {
      "feature": "<feature name>",
      "value": "<this individual's value>",
      "influence": "<positive|negative|neutral>",
      "explanation": "<1 sentence explaining how this feature influenced the outcome>"
    }
  ],
  "fairnessFlags": [
    "<any concern about protected attributes or proxies influencing this decision>"
  ],
  "appealGuidance": "<1-2 sentences of actionable guidance if the individual wanted to appeal or understand what could change the outcome>"
}

Rules:
- Write as if explaining directly to the affected individual
- Be specific — reference actual values from the record
- Flag any protected attribute that appears to influence the outcome
- Be honest but empathetic in tone
- If the outcome seems fair, say so`;
};

const SYSTEM = 'You are FairScan, explaining AI decisions to affected individuals in clear, empathetic, specific language. You produce only valid JSON.';

const explainDecision = async (row, columns, targetCol, protectedCols, shapValues, useCase) => {
  try {
    const prompt = buildExplainerPrompt(row, columns, targetCol, protectedCols, shapValues, useCase);
    return await generateJSON(prompt, SYSTEM);
  } catch (err) {
    console.error('[Explainer] Gemini explanation failed:', err.message);

    const targetIdx = columns.findIndex((c) => c.name === targetCol);
    const outcome = row[targetIdx] ?? 'unknown';
    return {
      outcome: String(outcome).toLowerCase() === '0' || outcome === 'no' || outcome === 'denied' ? 'negative' : 'positive',
      outcomeLabel: String(outcome),
      explanation: 'Automated explanation is currently unavailable. Please review the feature values and fairness metrics for this record.',
      keyFactors: [],
      fairnessFlags: [],
      appealGuidance: 'Contact the responsible team for a manual review of this decision.',
    };
  }
};

module.exports = { explainDecision };
