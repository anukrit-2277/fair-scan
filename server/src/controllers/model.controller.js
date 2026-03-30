const path = require('path');
const { MLModel } = require('../models');
const { asyncHandler, apiResponse } = require('../utils');
const { AppError } = require('../middleware/errorHandler');
const storage = require('../services/storage');

const FRAMEWORK_MAP = {
  '.onnx': 'onnx',
  '.h5': 'tensorflow',
  '.pb': 'tensorflow',
  '.savedmodel': 'tensorflow',
  '.pkl': 'sklearn',
  '.joblib': 'sklearn',
  '.pt': 'pytorch',
  '.pth': 'pytorch',
};

const detectFramework = (filename) => {
  const lower = filename.toLowerCase();
  for (const [ext, fw] of Object.entries(FRAMEWORK_MAP)) {
    if (lower.endsWith(ext)) return fw;
  }
  return 'unknown';
};

const uploadModel = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const framework = detectFramework(req.file.originalname);

  const model = await MLModel.create({
    name: req.body.name || req.file.originalname.replace(/\.[^.]+$/, ''),
    owner: req.user.id,
    source: 'upload',
    framework,
    filePath: req.file.path,
    fileSize: req.file.size,
    originalName: req.file.originalname,
    description: req.body.description || '',
    status: 'ready',
  });

  apiResponse.created(res, { model }, 'Model uploaded successfully');
});

const connectVertexModel = asyncHandler(async (req, res) => {
  const { endpointId, modelId, projectId, location, name } = req.body;
  if (!endpointId || !modelId) {
    throw new AppError('Vertex AI endpoint ID and model ID are required', 400);
  }

  const model = await MLModel.create({
    name: name || `vertex-${modelId.slice(0, 8)}`,
    owner: req.user.id,
    source: 'vertex_ai',
    framework: 'vertex_ai',
    vertexConfig: {
      endpointId,
      modelId,
      projectId: projectId || '',
      location: location || 'us-central1',
    },
    description: req.body.description || '',
    status: 'ready',
  });

  apiResponse.created(res, { model }, 'Vertex AI model connected');
});

const getModels = asyncHandler(async (req, res) => {
  const models = await MLModel.find({ owner: req.user.id })
    .select('-__v')
    .sort({ createdAt: -1 });

  apiResponse.success(res, { models });
});

const getModel = asyncHandler(async (req, res) => {
  const model = await MLModel.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });
  if (!model) throw new AppError('Model not found', 404);

  apiResponse.success(res, { model });
});

const deleteModel = asyncHandler(async (req, res) => {
  const model = await MLModel.findOne({
    _id: req.params.id,
    owner: req.user.id,
  });
  if (!model) throw new AppError('Model not found', 404);

  if (model.source === 'upload' && model.filePath) {
    await storage.deleteFile(model.filePath);
  }

  await MLModel.deleteOne({ _id: model._id });

  apiResponse.success(res, null, 'Model deleted');
});

module.exports = { uploadModel, connectVertexModel, getModels, getModel, deleteModel };
