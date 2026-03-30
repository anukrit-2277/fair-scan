const fs = require('fs');
const path = require('path');

const DTYPE_MAP = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  object: 'object',
};

const inferDtype = (value) => {
  if (value === null || value === undefined || value === '') return 'string';
  if (typeof value === 'boolean' || value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(Number(value)) && value !== '') return 'number';
  return 'string';
};

/**
 * Core CSV parser — returns headers + ALL row arrays.
 * Handles quoted fields with commas inside.
 * Used by both preview (parseCSV) and full audit parsing.
 */
const parseCSVRows = (content) => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

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

  return { headers, rows };
};

/**
 * Core JSON parser — returns ALL row arrays given column names.
 * Supports arrays, or objects with .data/.records/.rows keys.
 */
const parseJSONRows = (content, columnNames) => {
  const data = JSON.parse(content);
  const arr = Array.isArray(data) ? data : data.data || data.records || data.rows || [data];
  return arr.map((row) => columnNames.map((k) => row[k] ?? ''));
};

/**
 * High-level CSV parser — detects schema + returns 20 preview rows.
 * Delegates to parseCSVRows for the actual parsing.
 */
const parseCSV = (content) => {
  const { headers, rows } = parseCSVRows(content);
  if (!headers.length) return { columns: [], rows: [], rowCount: 0 };

  const sampleSize = Math.min(100, rows.length);
  const dtypes = headers.map((_, colIdx) => {
    const typeCounts = {};
    for (let r = 0; r < sampleSize; r++) {
      const val = rows[r]?.[colIdx];
      const dt = inferDtype(val);
      typeCounts[dt] = (typeCounts[dt] || 0) + 1;
    }
    return Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'string';
  });

  const columns = headers.map((name, i) => ({
    name,
    dtype: dtypes[i],
    isProtected: false,
    isProxy: false,
    proxyFor: null,
    proxyConfidence: null,
  }));

  return {
    columns,
    rows: rows.slice(0, 20),
    rowCount: rows.length,
  };
};

/**
 * High-level JSON parser — detects schema + returns 20 preview rows.
 */
const parseJSON = (content) => {
  const data = JSON.parse(content);
  const arr = Array.isArray(data) ? data : data.data || data.records || data.rows || [data];

  if (!arr.length) return { columns: [], rows: [], rowCount: 0 };

  const keys = [...new Set(arr.slice(0, 100).flatMap(Object.keys))];
  const sampleSize = Math.min(100, arr.length);

  const columns = keys.map((key) => {
    const typeCounts = {};
    for (let r = 0; r < sampleSize; r++) {
      const val = arr[r]?.[key];
      const dt = DTYPE_MAP[typeof val] || 'string';
      typeCounts[dt] = (typeCounts[dt] || 0) + 1;
    }
    const dtype = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'string';
    return {
      name: key,
      dtype,
      isProtected: false,
      isProxy: false,
      proxyFor: null,
      proxyConfidence: null,
    };
  });

  const rows = arr.slice(0, 20).map((row) => keys.map((k) => row[k] ?? ''));

  return { columns, rows, rowCount: arr.length };
};

const parseDatasetFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const content = await fs.promises.readFile(filePath, 'utf-8');

  if (ext === '.csv') return parseCSV(content);
  if (ext === '.json') return parseJSON(content);

  throw new Error(`Unsupported dataset format: ${ext}`);
};

module.exports = { parseDatasetFile, parseCSV, parseJSON, parseCSVRows, parseJSONRows };
