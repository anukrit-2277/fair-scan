const express = require('express');
const { datasetController } = require('../controllers');
const { protect } = require('../middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(datasetController.getDatasets)
  .post(datasetController.uploadDataset);

router.route('/:id')
  .get(datasetController.getDataset)
  .delete(datasetController.deleteDataset);

module.exports = router;
