const express = require('express');
const monitorController = require('../controllers/monitor.controller');
const { protect } = require('../middleware');

const router = express.Router();

router.use(protect);

router.get('/stats', monitorController.getDashboardStats);

router.route('/')
  .get(monitorController.getMonitors)
  .post(monitorController.createMonitor);

router.route('/:id')
  .get(monitorController.getMonitor)
  .delete(monitorController.deleteMonitor);

router.post('/:id/refresh', monitorController.refreshMonitor);
router.post('/:id/toggle', monitorController.toggleMonitor);
router.post('/:id/alerts/acknowledge', monitorController.acknowledgeAlert);

module.exports = router;
