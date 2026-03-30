const express = require('express');
const { modelController } = require('../controllers');
const { protect } = require('../middleware');
const { uploadModel } = require('../config/upload');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(modelController.getModels)
  .post(uploadModel.single('file'), modelController.uploadModel);

router.post('/vertex', modelController.connectVertexModel);

router.route('/:id')
  .get(modelController.getModel)
  .delete(modelController.deleteModel);

module.exports = router;
