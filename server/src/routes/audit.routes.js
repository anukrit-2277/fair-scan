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
router.post('/:id/explain', auditController.explainRow);
router.post('/:id/mitigate/preview', auditController.previewMitigation);
router.post('/:id/mitigate/apply', auditController.applyMitigation);
router.get('/:id/generate-report', auditController.generateReport);
router.get('/:id/model-card', auditController.generateModelCard);

module.exports = router;
