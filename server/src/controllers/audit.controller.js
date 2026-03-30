const { asyncHandler, apiResponse } = require('../utils');

const triggerAudit = asyncHandler(async (_req, res) => {
  apiResponse.created(res, null, 'Trigger audit endpoint ready');
});

const getAudits = asyncHandler(async (_req, res) => {
  apiResponse.success(res, [], 'Audits list endpoint ready');
});

const getAudit = asyncHandler(async (_req, res) => {
  apiResponse.success(res, null, 'Audit detail endpoint ready');
});

const getAuditReport = asyncHandler(async (_req, res) => {
  apiResponse.success(res, null, 'Audit report endpoint ready');
});

module.exports = { triggerAudit, getAudits, getAudit, getAuditReport };
