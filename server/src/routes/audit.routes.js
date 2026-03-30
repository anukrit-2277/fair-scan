const express = require('express');
const { auditController } = require('../controllers');
const { protect } = require('../middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(auditController.getAudits)
  .post(auditController.triggerAudit);

router.route('/:id')
  .get(auditController.getAudit)
  .delete(auditController.deleteAudit);

router.get('/:id/report', auditController.getAuditReport);

module.exports = router;
