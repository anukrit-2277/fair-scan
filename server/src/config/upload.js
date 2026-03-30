const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { AppError } = require('../middleware/errorHandler');
const env = require('./env');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const DATASET_DIR = path.join(UPLOAD_DIR, 'datasets');
const MODEL_DIR = path.join(UPLOAD_DIR, 'models');

[DATASET_DIR, MODEL_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_DATASET_TYPES = {
  'text/csv': 'csv',
  'application/json': 'json',
  'application/vnd.ms-excel': 'csv',
  'text/plain': 'csv',
};

const ALLOWED_MODEL_TYPES = {
  'application/octet-stream': true,
  'application/x-hdf5': true,
  'application/x-tar': true,
  'application/gzip': true,
  'application/zip': true,
};

const ALLOWED_MODEL_EXTS = ['.onnx', '.h5', '.pb', '.pkl', '.joblib', '.pt', '.pth', '.tar.gz', '.zip', '.savedmodel'];

const uniqueName = (originalName) => {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(12).toString('hex');
  return `${Date.now()}-${hash}${ext}`;
};

const datasetStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DATASET_DIR),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
});

const modelStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODEL_DIR),
  filename: (_req, file, cb) => cb(null, uniqueName(file.originalname)),
});

const datasetFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_DATASET_TYPES[file.mimetype] || ext === '.csv' || ext === '.json') {
    return cb(null, true);
  }
  cb(new AppError('Only CSV and JSON files are allowed for datasets', 400), false);
};

const modelFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MODEL_TYPES[file.mimetype] || ALLOWED_MODEL_EXTS.some((e) => file.originalname.toLowerCase().endsWith(e))) {
    return cb(null, true);
  }
  cb(new AppError('Unsupported model format. Use ONNX, TensorFlow (.h5/.pb/.savedmodel), scikit-learn (.pkl/.joblib), or PyTorch (.pt/.pth)', 400), false);
};

const uploadDataset = multer({
  storage: datasetStorage,
  fileFilter: datasetFilter,
  limits: { fileSize: env.UPLOAD_MAX_SIZE },
});

const uploadModel = multer({
  storage: modelStorage,
  fileFilter: modelFilter,
  limits: { fileSize: env.UPLOAD_MAX_SIZE },
});

module.exports = {
  uploadDataset,
  uploadModel,
  UPLOAD_DIR,
  DATASET_DIR,
  MODEL_DIR,
  ALLOWED_DATASET_TYPES,
  ALLOWED_MODEL_EXTS,
};
