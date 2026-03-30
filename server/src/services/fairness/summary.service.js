/**
 * Gemini-powered plain-language bias summary.
 * Converts raw metric outputs into readable reports for non-technical stakeholders.
 */

const { generateJSON } = require('../ai/gemini.service');

const buildSummaryPrompt = (fairnessMetrics, shapResult, sliceResult, useCase, datasetInfo) => {
  const metricSummary = Object.entries(fairnessMetrics).map(([attr, metrics]) => {
    const lines = Object.entries(metrics)
      .filter(([, m]) => m && m.metric)
      .map(([, m]) => `  - ${m.metric}: ${m.pass ? 'PASS' : 'FAIL'}${m.disparity != null ? ` (disparity: ${m.disparity})` : ''}${m.ratio != null ? ` (ratio: ${m.ratio})` : ''}`);
    return `Protected attribute "${attr}":\n${lines.join('\n')}`;
  }).join('\n\n');

  const topFeatures = (shapResult.shapValues || []).slice(0, 6).map(
    (f) => `  - "${f.feature}" (importance: ${f.importance}, bias risk: ${f.biasRisk})`
  ).join('\n');

  const worstSlices = (sliceResult.intersectional || []).slice(0, 3).map(
    (s) => `  - ${s.slice}: positive rate ${(s.positiveRate * 100).toFixed(1)}% (n=${s.count})`
  ).join('\n');

  return `Generate a comprehensive fairness audit summary for a ${useCase?.domain || 'general'} dataset.

DATASET: "${datasetInfo.name}" — ${datasetInfo.rowCount} rows, ${datasetInfo.columnCount} columns

FAIRNESS METRICS:
${metricSummary}

TOP FEATURES BY IMPORTANCE:
${topFeatures || 'No feature attribution available'}

WORST-PERFORMING INTERSECTIONAL SLICES:
${worstSlices || 'No intersectional data available'}

Respond with JSON:
{
  "executiveSummary": "<3-4 sentence plain-English overview of the fairness audit. Written for executives, legal, compliance teams — no jargon>",
  "findings": [
    {
      "title": "<short title>",
      "description": "<1-2 sentence clear description>",
      "severity": "<low|medium|high|critical>",
      "affectedGroups": ["<group names>"],
      "recommendation": "<what to do about it>"
    }
  ],
  "overallRiskLevel": "<low|medium|high|critical>",
  "complianceNotes": [
    {
      "regulation": "<GDPR|EU AI Act|EEOC>",
      "relevance": "<1 sentence on why this regulation applies>",
      "riskLevel": "<low|medium|high>"
    }
  ]
}

Rules:
- Write for non-technical readers — no mathematical notation
- Be specific about which groups are affected and how
- If no significant bias found, say so clearly
- Limit findings to the most impactful 3-5 issues
- Compliance notes only for genuinely relevant regulations`;
};

const SYSTEM = 'You are FairScan, a world-class AI fairness auditor writing reports for legal and compliance teams. Your language is clear, specific, and actionable. Output only valid JSON.';

const generateBiasSummary = async (fairnessMetrics, shapResult, sliceResult, useCase, datasetInfo) => {
  try {
    const prompt = buildSummaryPrompt(fairnessMetrics, shapResult, sliceResult, useCase, datasetInfo);
    return await generateJSON(prompt, SYSTEM);
  } catch (err) {
    console.error('[Summary] Gemini summary generation failed:', err.message);
    return {
      executiveSummary: 'Automated summary generation failed. Please review the raw metrics below.',
      findings: [],
      overallRiskLevel: 'medium',
      complianceNotes: [],
    };
  }
};

module.exports = { generateBiasSummary };
