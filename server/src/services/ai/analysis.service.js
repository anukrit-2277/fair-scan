const { generateJSON } = require('./gemini.service');

const PROTECTED_KEYWORDS = [
  'gender', 'sex', 'race', 'ethnicity', 'ethnic', 'religion', 'religious',
  'age', 'disability', 'national_origin', 'nationality', 'marital_status',
  'sexual_orientation', 'veteran', 'pregnant', 'pregnancy',
];

const PROXY_HINTS = [
  { pattern: /zip|postal|postcode/i, proxyFor: 'race / socioeconomic status' },
  { pattern: /first.?name|given.?name|nombre/i, proxyFor: 'gender / ethnicity' },
  { pattern: /last.?name|surname|family.?name/i, proxyFor: 'ethnicity / national origin' },
  { pattern: /address|street|neighborhood|borough/i, proxyFor: 'race / socioeconomic status' },
  { pattern: /school|university|college|alma.?mater/i, proxyFor: 'socioeconomic status / race' },
  { pattern: /language|lang/i, proxyFor: 'national origin / ethnicity' },
  { pattern: /height|weight|bmi/i, proxyFor: 'gender / disability' },
];

const heuristicScan = (columns) => {
  return columns.map((col) => {
    const lower = col.name.toLowerCase().replace(/[_\-\s]+/g, '_');

    const isProtected = PROTECTED_KEYWORDS.some((kw) => lower.includes(kw));

    let isProxy = false;
    let proxyFor = null;
    let proxyConfidence = null;
    for (const hint of PROXY_HINTS) {
      if (hint.pattern.test(col.name)) {
        isProxy = true;
        proxyFor = hint.proxyFor;
        proxyConfidence = 0.7;
        break;
      }
    }

    return { ...col, isProtected, isProxy, proxyFor, proxyConfidence };
  });
};

const buildAnalysisPrompt = (columns, sampleRows) => {
  const colList = columns.map((c) => `  - "${c.name}" (${c.dtype})`).join('\n');

  const rowSample = sampleRows.slice(0, 5).map((row, i) => {
    const obj = {};
    columns.forEach((c, ci) => { obj[c.name] = row[ci] ?? ''; });
    return `  Row ${i + 1}: ${JSON.stringify(obj)}`;
  }).join('\n');

  return `Analyze this dataset for fairness auditing.

COLUMNS:
${colList}

SAMPLE DATA:
${rowSample}

Respond with a JSON object with exactly these keys:
{
  "protectedAttributes": [
    { "column": "<column_name>", "reason": "<why this is a protected attribute>" }
  ],
  "proxyAttributes": [
    { "column": "<column_name>", "proxyFor": "<which protected attribute it correlates with>", "confidence": <0.0-1.0>, "reason": "<explanation>" }
  ],
  "useCase": {
    "domain": "<one of: lending, hiring, healthcare, insurance, criminal_justice, education, housing, general>",
    "description": "<1-2 sentence description of what this dataset appears to be used for>",
    "confidence": <0.0-1.0>
  },
  "targetColumn": {
    "column": "<most likely prediction target column name, or null>",
    "reason": "<why>"
  },
  "summary": "<2-3 sentence plain-English overview of fairness-relevant findings in this dataset>"
}

Rules:
- Only flag columns that genuinely are protected attributes under anti-discrimination law (gender, race, age, religion, disability, national origin, etc.)
- Proxy attributes are columns that are NOT themselves protected but correlate with protected attributes (e.g. zip code -> race, first name -> gender)
- Be conservative with confidence scores
- If no protected or proxy attributes found, return empty arrays`;
};

const SYSTEM_INSTRUCTION = `You are FairScan, an expert AI fairness auditor. You analyze datasets to detect protected attributes, proxy attributes, and potential bias risks. You are precise, conservative, and always explain your reasoning. You only output valid JSON.`;

const analyzeWithGemini = async (columns, sampleRows) => {
  const prompt = buildAnalysisPrompt(columns, sampleRows);
  return generateJSON(prompt, SYSTEM_INSTRUCTION);
};

const mergeResults = (columns, heuristic, geminiResult) => {
  const geminiProtected = new Map(
    (geminiResult.protectedAttributes || []).map((a) => [a.column.toLowerCase(), a])
  );
  const geminiProxy = new Map(
    (geminiResult.proxyAttributes || []).map((a) => [a.column.toLowerCase(), a])
  );

  return columns.map((col) => {
    const lower = col.name.toLowerCase();
    const heur = heuristic.find((h) => h.name === col.name) || {};
    const gProtected = geminiProtected.get(lower);
    const gProxy = geminiProxy.get(lower);

    return {
      ...col,
      isProtected: !!(heur.isProtected || gProtected),
      protectedReason: gProtected?.reason || (heur.isProtected ? 'Matched known protected attribute keyword' : null),
      isProxy: !!(heur.isProxy || gProxy),
      proxyFor: gProxy?.proxyFor || heur.proxyFor || null,
      proxyConfidence: gProxy?.confidence ?? heur.proxyConfidence ?? null,
      proxyReason: gProxy?.reason || null,
    };
  });
};

const analyzeDataset = async (columns, sampleRows) => {
  const heuristic = heuristicScan(columns);

  let geminiResult = {
    protectedAttributes: [],
    proxyAttributes: [],
    useCase: { domain: 'general', description: 'Unable to determine', confidence: 0 },
    targetColumn: { column: null, reason: null },
    summary: '',
  };

  try {
    geminiResult = await analyzeWithGemini(columns, sampleRows);
  } catch (err) {
    console.error('[Gemini Analysis] Failed, using heuristic fallback:', err.message);
    geminiResult.summary = 'Gemini analysis unavailable — showing heuristic results only.';
  }

  const mergedColumns = mergeResults(columns, heuristic, geminiResult);

  return {
    columns: mergedColumns,
    useCase: geminiResult.useCase || { domain: 'general', description: 'Unknown', confidence: 0 },
    targetColumn: geminiResult.targetColumn || { column: null, reason: null },
    summary: geminiResult.summary || '',
  };
};

module.exports = { analyzeDataset, heuristicScan };
