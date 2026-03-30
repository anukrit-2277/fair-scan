const path = require('path');
const { Dataset } = require('../models');
const { asyncHandler, apiResponse } = require('../utils');
const { parseDatasetFile } = require('../utils/parseDataset');
const { AppError } = require('../middleware/errorHandler');
const storage = require('../services/storage');

const uploadDataset = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  const formatMap = { csv: 'csv', json: 'json' };
  const format = formatMap[ext];
  if (!format) throw new AppError('Unsupported file format', 400);

  let schemaInfo = { columns: [], rowCount: 0 };
  let preview = [];
  try {
    const parsed = await parseDatasetFile(req.file.path);
    schemaInfo = { columns: parsed.columns, rowCount: parsed.rowCount };
    preview = parsed.rows;
  } catch (parseErr) {
    await storage.deleteFile(req.file.path);
    throw new AppError(`Failed to parse file: ${parseErr.message}`, 422);
  }

  const dataset = await Dataset.create({
    name: req.body.name || req.file.originalname.replace(/\.[^.]+$/, ''),
    owner: req.user.id,
    format,
    filePath: req.file.path,
    fileSize: req.file.size,
    originalName: req.file.originalname,
    schemaInfo,
    status: 'ready',
  });

  apiResponse.created(res, {
    dataset,
    preview,
  }, 'Dataset uploaded successfully');
});

const uploadGoogleSheet = asyncHandler(async (req, res) => {
  const { url, name } = req.body;
  if (!url) throw new AppError('Google Sheets URL is required', 400);

  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!sheetIdMatch) throw new AppError('Invalid Google Sheets URL', 400);

  const dataset = await Dataset.create({
    name: name || `Sheet-${sheetIdMatch[1].slice(0, 8)}`,
    owner: req.user.id,
    format: 'google_sheets',
    filePath: url,
    fileSize: 0,
    originalName: url,
    schemaInfo: { columns: [], rowCount: 0 },
    status: 'processing',
  });

  apiResponse.created(res, { dataset }, 'Google Sheet linked — processing will begin shortly');
});

const getDatasets = asyncHandler(async (req, res) => {
  const datasets = await Dataset.find({ owner: req.user.id })
    .select('-__v')
    .sort({ createdAt: -1 });

  apiResponse.success(res, { datasets });
});

const getDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!dataset) throw new AppError('Dataset not found', 404);

  let preview = [];
  if (dataset.format !== 'google_sheets' && storage.fileExists(dataset.filePath)) {
    try {
      const parsed = await parseDatasetFile(dataset.filePath);
      preview = parsed.rows;
    } catch { /* preview unavailable */ }
  }

  apiResponse.success(res, { dataset, preview });
});

const deleteDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });

  if (!dataset) throw new AppError('Dataset not found', 404);

  if (dataset.format !== 'google_sheets') {
    await storage.deleteFile(dataset.filePath);
  }

  await Dataset.deleteOne({ _id: dataset._id });

  apiResponse.success(res, null, 'Dataset deleted');
});

module.exports = { uploadDataset, uploadGoogleSheet, getDatasets, getDataset, deleteDataset };
