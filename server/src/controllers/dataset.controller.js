const { asyncHandler, apiResponse } = require('../utils');

const uploadDataset = asyncHandler(async (_req, res) => {
  apiResponse.created(res, null, 'Dataset upload endpoint ready');
});

const getDatasets = asyncHandler(async (_req, res) => {
  apiResponse.success(res, [], 'Datasets list endpoint ready');
});

const getDataset = asyncHandler(async (_req, res) => {
  apiResponse.success(res, null, 'Dataset detail endpoint ready');
});

const deleteDataset = asyncHandler(async (_req, res) => {
  apiResponse.success(res, null, 'Dataset delete endpoint ready');
});

module.exports = { uploadDataset, getDatasets, getDataset, deleteDataset };
