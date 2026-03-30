const express = require('express');
const authRoutes = require('./auth.routes');
const datasetRoutes = require('./dataset.routes');
const modelRoutes = require('./model.routes');
const auditRoutes = require('./audit.routes');
const monitorRoutes = require('./monitor.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/datasets', datasetRoutes);
router.use('/models', modelRoutes);
router.use('/audits', auditRoutes);
router.use('/monitors', monitorRoutes);

module.exports = router;
