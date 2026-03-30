/**
 * Report generation service — builds structured report data and
 * model cards using Gemini, consumable by the frontend for
 * preview rendering and PDF export (via browser print).
 */

const { generateJSON } = require('../ai/gemini.service');

/* ═══════════════════════════════════════════
   FULL AUDIT REPORT
   ═══════════════════════════════════════════ */

const buildReportPrompt = (audit, dataset) => {
  const metrics = audit.fairnessMetrics || {};
  const attrs = Object.keys(metrics);
  const metricsSummary = attrs.map((attr) => {
    const m = metrics[attr];
    return `  Attribute "${attr}":
    - Demographic Parity disparity: ${m.demographicParity?.disparity} (${m.demographicParity?.pass ? 'PASS' : 'FAIL'})
    - Equal Opportunity disparity: ${m.equalOpportunity?.disparity} (${m.equalOpportunity?.pass ? 'PASS' : 'FAIL'})
    - Predictive Parity disparity: ${m.predictiveParity?.disparity} (${m.predictiveParity?.pass ? 'PASS' : 'FAIL'})
    - Disparate Impact ratio: ${m.disparateImpact?.ratio} (${m.disparateImpact?.pass ? 'PASS' : 'FAIL'})`;
  }).join('\n');

  const findings = (audit.biasSummary?.findings || []).map(
    (f) => `  - [${f.severity?.toUpperCase()}] ${f.title}: ${f.description}`
  ).join('\n');

  const compliance = (audit.biasSummary?.complianceNotes || []).map(
    (c) => `  - ${c.regulation} (${c.riskLevel}): ${c.relevance}`
  ).join('\n');

  const shapTop = (audit.shapValues?.shapValues || []).slice(0, 8).map(
    (s) => `  - ${s.feature}: importance ${s.importance}, bias risk: ${s.biasRisk || 'low'}`
  ).join('\n');

  return `Generate a comprehensive, professional AI fairness audit report for the following completed audit.

AUDIT DETAILS:
- Dataset: "${audit.datasetName || 'Unknown'}"
- Use Case: ${audit.config?.useCase || 'general'}
- Target Column: ${audit.config?.targetColumn}
- Protected Attributes: ${(audit.config?.protectedAttributes || []).join(', ')}
- Overall Fairness Score: ${audit.fairnessScore?.score}/100
- Severity: ${audit.severityScore}
- Completed: ${audit.completedAt ? new Date(audit.completedAt).toISOString() : 'N/A'}
- Dataset Size: ${dataset?.schemaInfo?.rowCount || 'Unknown'} rows, ${dataset?.schemaInfo?.columns?.length || 'Unknown'} columns

FAIRNESS METRICS:
${metricsSummary || 'Not available'}

KEY FINDINGS:
${findings || 'None'}

TOP FEATURES BY ATTRIBUTION:
${shapTop || 'Not available'}

COMPLIANCE NOTES:
${compliance || 'None'}

EXECUTIVE SUMMARY (pre-generated):
${audit.biasSummary?.executiveSummary || 'Not available'}

Generate a JSON report with exactly this structure:
{
  "title": "<report title>",
  "generatedAt": "<ISO timestamp>",
  "sections": [
    {
      "id": "executive_summary",
      "title": "Executive Summary",
      "content": "<2-3 paragraphs summarising the audit findings in plain language. Written for a non-technical executive, legal officer, or compliance team. Include the overall score and key risks.>"
    },
    {
      "id": "methodology",
      "title": "Methodology",
      "content": "<2-3 paragraphs explaining how the audit was conducted: metrics used (demographic parity, equal opportunity, predictive parity, disparate impact), SHAP-based feature attribution, slice-based evaluation, and AI-powered analysis.>"
    },
    {
      "id": "fairness_assessment",
      "title": "Fairness Assessment",
      "content": "<2-3 paragraphs describing the detailed fairness metric results. Reference specific numbers, pass/fail status, and which groups are most affected.>"
    },
    {
      "id": "feature_attribution",
      "title": "Feature Attribution Analysis",
      "content": "<2 paragraphs about which features most influence outcomes and any bias risks identified in the SHAP analysis.>"
    },
    {
      "id": "findings",
      "title": "Key Findings & Recommendations",
      "content": "<Bullet-point style findings with severity levels and actionable recommendations for each. Be specific.>"
    },
    {
      "id": "compliance",
      "title": "Regulatory Compliance Assessment",
      "content": "<Map findings to GDPR Article 22, EU AI Act, US EEOC guidelines. Include risk levels and specific compliance gaps. Be authoritative.>"
    },
    {
      "id": "conclusion",
      "title": "Conclusion",
      "content": "<1-2 paragraphs with overall assessment and recommended next steps.>"
    }
  ]
}

Rules:
- Professional, authoritative tone suitable for regulatory submission
- Cite specific numbers from the audit data
- Plain language — no jargon without explanation
- Each section should be 100-300 words`;
};

const REPORT_SYSTEM = 'You are FairScan, an enterprise AI fairness auditing platform. Generate professional bias audit reports suitable for legal review, regulatory submission, and executive briefing. Output only valid JSON.';

const generateFullReport = async (audit, dataset) => {
  try {
    const prompt = buildReportPrompt(audit, dataset);
    return await generateJSON(prompt, REPORT_SYSTEM);
  } catch (err) {
    console.error('[Report] Gemini report generation failed:', err.message);
    return buildFallbackReport(audit);
  }
};

const buildFallbackReport = (audit) => ({
  title: `FairScan Bias Audit Report — ${audit.datasetName || 'Dataset'}`,
  generatedAt: new Date().toISOString(),
  sections: [
    { id: 'executive_summary', title: 'Executive Summary', content: audit.biasSummary?.executiveSummary || 'This audit evaluated the dataset for potential bias across protected attributes. Please refer to the dashboard for detailed metrics.' },
    { id: 'methodology', title: 'Methodology', content: 'This audit used statistical fairness metrics including Demographic Parity, Equal Opportunity, Predictive Parity, and Disparate Impact. Feature attribution was computed using SHAP-like correlation analysis. All findings were reviewed by Gemini AI for plain-language interpretation.' },
    { id: 'fairness_assessment', title: 'Fairness Assessment', content: `The overall fairness score is ${audit.fairnessScore?.score ?? 'N/A'}/100, classified as ${audit.severityScore || 'unknown'} severity.` },
    { id: 'feature_attribution', title: 'Feature Attribution Analysis', content: 'Feature attribution analysis identifies which dataset features most strongly influence outcomes. High-risk features may encode or proxy protected attributes.' },
    { id: 'findings', title: 'Key Findings & Recommendations', content: (audit.biasSummary?.findings || []).map((f) => `[${f.severity?.toUpperCase()}] ${f.title}: ${f.description}${f.recommendation ? ' Recommendation: ' + f.recommendation : ''}`).join('\n\n') || 'No specific findings recorded.' },
    { id: 'compliance', title: 'Regulatory Compliance Assessment', content: (audit.biasSummary?.complianceNotes || []).map((c) => `${c.regulation} (${c.riskLevel} risk): ${c.relevance}`).join('\n\n') || 'No compliance notes available.' },
    { id: 'conclusion', title: 'Conclusion', content: 'This report was auto-generated by FairScan. For detailed visualisations and interactive analysis, please refer to the FairScan dashboard.' },
  ],
});

/* ═══════════════════════════════════════════
   MODEL CARD
   ═══════════════════════════════════════════ */

const buildModelCardPrompt = (audit, dataset) => {
  const cols = (dataset?.schemaInfo?.columns || []).map((c) => `${c.name} (${c.dtype}${c.isProtected ? ', PROTECTED' : ''}${c.isProxy ? ', PROXY for ' + c.proxyFor : ''})`).join(', ');

  return `Generate a standardised Model Card for an AI system audited by FairScan.

SYSTEM DETAILS:
- Dataset: "${audit.datasetName}"
- Use Case: ${audit.config?.useCase || 'general'}
- Target Column: ${audit.config?.targetColumn}
- Protected Attributes: ${(audit.config?.protectedAttributes || []).join(', ')}
- Columns: ${cols}
- Fairness Score: ${audit.fairnessScore?.score}/100
- Severity: ${audit.severityScore}
- Audit Date: ${audit.completedAt ? new Date(audit.completedAt).toLocaleDateString() : 'N/A'}

Generate JSON:
{
  "modelName": "<descriptive name based on use case>",
  "version": "1.0",
  "lastUpdated": "<ISO date>",
  "intendedUse": {
    "primaryUse": "<1-2 sentences>",
    "primaryUsers": "<who should use this>",
    "outOfScope": "<what this should NOT be used for>"
  },
  "factors": {
    "relevantFactors": ["<demographic factors evaluated>"],
    "evaluationFactors": ["<metrics used>"]
  },
  "metrics": {
    "fairnessScore": ${audit.fairnessScore?.score ?? 'null'},
    "severity": "${audit.severityScore || 'unknown'}",
    "metricsUsed": ["Demographic Parity", "Equal Opportunity", "Predictive Parity", "Disparate Impact"]
  },
  "ethicalConsiderations": [
    "<2-4 ethical considerations specific to this use case and data>"
  ],
  "limitations": [
    "<2-4 known limitations or failure modes>"
  ],
  "recommendations": [
    "<2-4 recommendations for responsible deployment>"
  ],
  "datasetInfo": {
    "name": "${audit.datasetName}",
    "protectedAttributes": ${JSON.stringify(audit.config?.protectedAttributes || [])},
    "targetColumn": "${audit.config?.targetColumn}"
  }
}`;
};

const MODEL_CARD_SYSTEM = 'You are FairScan generating standardised Model Cards following Google Model Cards best practices. Output only valid JSON.';

const generateModelCard = async (audit, dataset) => {
  try {
    const prompt = buildModelCardPrompt(audit, dataset);
    return await generateJSON(prompt, MODEL_CARD_SYSTEM);
  } catch (err) {
    console.error('[ModelCard] Gemini generation failed:', err.message);
    return {
      modelName: `${audit.config?.useCase || 'General'} Decision System`,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      intendedUse: { primaryUse: 'Automated decision-making', primaryUsers: 'Data scientists and compliance teams', outOfScope: 'Unsupervised production deployment without human oversight' },
      factors: { relevantFactors: audit.config?.protectedAttributes || [], evaluationFactors: ['Demographic Parity', 'Equal Opportunity', 'Predictive Parity', 'Disparate Impact'] },
      metrics: { fairnessScore: audit.fairnessScore?.score, severity: audit.severityScore, metricsUsed: ['Demographic Parity', 'Equal Opportunity', 'Predictive Parity', 'Disparate Impact'] },
      ethicalConsiderations: ['This system makes decisions affecting individuals and should be regularly audited for bias.'],
      limitations: ['Fairness metrics are computed on available data and may not capture all forms of bias.'],
      recommendations: ['Implement ongoing monitoring for fairness drift.'],
      datasetInfo: { name: audit.datasetName, protectedAttributes: audit.config?.protectedAttributes || [], targetColumn: audit.config?.targetColumn },
    };
  }
};

module.exports = { generateFullReport, generateModelCard };
