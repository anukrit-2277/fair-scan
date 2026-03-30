const express = require('express');
const authRoutes = require('./auth.routes');
const datasetRoutes = require('./dataset.routes');
const auditRoutes = require('./audit.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/datasets', datasetRoutes);
router.use('/audits', auditRoutes);

module.exports = router;
