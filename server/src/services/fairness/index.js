const metricsService = require('./metrics.service');
const shapService = require('./shap.service');
const slicerService = require('./slicer.service');
const summaryService = require('./summary.service');
const explainerService = require('./explainer.service');
const mitigationService = require('./mitigation.service');
const reportService = require('./report.service');

module.exports = { metricsService, shapService, slicerService, summaryService, explainerService, mitigationService, reportService };
