const express = require('express');
const { datasetController } = require('../controllers');
const { protect } = require('../middleware');
const { uploadDataset } = require('../config/upload');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(datasetController.getDatasets)
  .post(uploadDataset.single('file'), datasetController.uploadDataset);

router.post('/sheets', datasetController.uploadGoogleSheet);

router.route('/:id')
  .get(datasetController.getDataset)
  .delete(datasetController.deleteDataset);

router.post('/:id/analyze', datasetController.analyzeDataset);
router.put('/:id/confirm', datasetController.confirmConfig);

module.exports = router;
