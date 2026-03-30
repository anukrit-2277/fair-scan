const mongoose = require('mongoose');
const { Audit, Dataset } = require('../models');
const Monitor = require('../models/Monitor');
const { asyncHandler, apiResponse } = require('../utils');
const { AppError } = require('../middleware/errorHandler');
const { metricsService } = require('../services/fairness');

/**
 * Count passing/failing fairness metrics from an audit's fairnessMetrics map.
 */
const countPassingMetrics = (fairnessMetrics) => {
  let passing = 0;
  let total = 0;
  for (const m of Object.values(fairnessMetrics || {})) {
    if (m?.demographicParity) { total++; if (m.demographicParity.pass) passing++; }
    if (m?.equalOpportunity) { total++; if (m.equalOpportunity.pass) passing++; }
    if (m?.predictiveParity) { total++; if (m.predictiveParity.pass) passing++; }
    if (m?.disparateImpact) { total++; if (m.disparateImpact.pass) passing++; }
  }
  return { passing, total };
};

const createMonitor = asyncHandler(async (req, res) => {
  const { auditId, config } = req.body;
  if (!auditId) throw new AppError('auditId is required', 400);

  const audit = await Audit.findOne({ _id: auditId, owner: req.user.id });
  if (!audit) throw new AppError('Audit not found', 404);
  if (audit.status !== 'completed') throw new AppError('Audit must be completed before monitoring', 400);

  const existing = await Monitor.findOne({ audit: auditId, owner: req.user.id, active: true });
  if (existing) throw new AppError('A monitor already exists for this audit', 409);

  const score = audit.fairnessScore?.score ?? 0;
  const severity = audit.severityScore || metricsService.deriveSeverity(score);
  const { passing, total: totalMetrics } = countPassingMetrics(audit.fairnessMetrics);

  const monitor = await Monitor.create({
    owner: req.user.id,
    audit: audit._id,
    datasetName: audit.datasetName,
    useCase: audit.config?.useCase,
    config: {
      checkIntervalHours: config?.checkIntervalHours || 24,
      fairnessThreshold: config?.fairnessThreshold || 70,
      driftThreshold: config?.driftThreshold || 10,
    },
    snapshots: [
      {
        fairnessScore: score,
        severity,
        metricsPassing: passing,
        metricsFailing: totalMetrics - passing,
        recordedAt: audit.completedAt || new Date(),
      },
    ],
    lastCheckedAt: new Date(),
  });

  apiResponse.created(res, { monitor }, 'Monitor created');
});

const getMonitors = asyncHandler(async (req, res) => {
  const monitors = await Monitor.find({ owner: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  apiResponse.success(res, { monitors });
});

const getMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, owner: req.user.id }).lean();
  if (!monitor) throw new AppError('Monitor not found', 404);

  apiResponse.success(res, { monitor });
});

const refreshMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, owner: req.user.id });
  if (!monitor) throw new AppError('Monitor not found', 404);

  const audit = await Audit.findById(monitor.audit).lean();
  if (!audit || audit.status !== 'completed') {
    throw new AppError('Linked audit not available', 400);
  }

  const baseScore = monitor.snapshots[0]?.fairnessScore ?? audit.fairnessScore?.score ?? 50;
  const lastScore = monitor.snapshots.length
    ? monitor.snapshots[monitor.snapshots.length - 1].fairnessScore
    : baseScore;

  // NOTE: Simulated drift — replace with real Vertex AI Model Monitor when available
  const drift = (Math.random() - 0.5) * 8;
  const newScore = Math.max(0, Math.min(100, Math.round((lastScore + drift) * 100) / 100));
  const severity = metricsService.deriveSeverity(newScore);

  const scoreDrop = baseScore - newScore;
  const newAlerts = [];

  if (scoreDrop > monitor.config.driftThreshold) {
    newAlerts.push({
      type: 'drift',
      metric: 'fairnessScore',
      message: `Fairness score dropped ${scoreDrop.toFixed(1)} points from baseline (${baseScore} → ${newScore})`,
      severity: scoreDrop > 20 ? 'critical' : 'warning',
      value: newScore,
      threshold: monitor.config.driftThreshold,
    });
  }

  if (newScore < monitor.config.fairnessThreshold) {
    newAlerts.push({
      type: 'threshold',
      metric: 'fairnessScore',
      message: `Fairness score (${newScore}) fell below threshold (${monitor.config.fairnessThreshold})`,
      severity: newScore < 40 ? 'critical' : 'warning',
      value: newScore,
      threshold: monitor.config.fairnessThreshold,
    });
  }

  const { passing, total: totalMetrics } = countPassingMetrics(audit.fairnessMetrics);

  monitor.snapshots.push({
    fairnessScore: newScore,
    severity,
    metricsPassing: passing,
    metricsFailing: totalMetrics - passing,
    recordedAt: new Date(),
  });

  if (monitor.snapshots.length > 100) {
    monitor.snapshots = monitor.snapshots.slice(-100);
  }

  newAlerts.forEach((a) => monitor.alerts.push(a));
  monitor.lastCheckedAt = new Date();
  await monitor.save();

  apiResponse.success(res, { monitor: monitor.toObject(), simulated: true });
});

const acknowledgeAlert = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, owner: req.user.id });
  if (!monitor) throw new AppError('Monitor not found', 404);

  const { alertId } = req.body;
  if (!alertId) throw new AppError('alertId is required', 400);

  const alert = monitor.alerts.id(alertId);
  if (!alert) throw new AppError('Alert not found', 404);

  alert.acknowledged = true;
  alert.acknowledgedAt = new Date();
  await monitor.save();

  apiResponse.success(res, { alert: alert.toObject() });
});

const toggleMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, owner: req.user.id });
  if (!monitor) throw new AppError('Monitor not found', 404);

  monitor.active = !monitor.active;
  await monitor.save();

  apiResponse.success(res, { monitor: monitor.toObject() }, `Monitor ${monitor.active ? 'activated' : 'paused'}`);
});

const deleteMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({ _id: req.params.id, owner: req.user.id });
  if (!monitor) throw new AppError('Monitor not found', 404);

  await Monitor.deleteOne({ _id: monitor._id });
  apiResponse.success(res, null, 'Monitor deleted');
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [datasetCount, auditCount, audits, monitorCount] = await Promise.all([
    Dataset.countDocuments({ owner: userId }),
    Audit.countDocuments({ owner: userId }),
    Audit.find({ owner: userId, status: 'completed' })
      .select('datasetName fairnessScore severityScore biasSummary config completedAt createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Monitor.countDocuments({ owner: userId, active: true }),
  ]);

  const issueCount = audits.reduce((sum, a) => {
    return sum + (a.biasSummary?.findings?.length || 0);
  }, 0);

  const recentAudits = audits.slice(0, 5).map((a) => ({
    _id: a._id,
    datasetName: a.datasetName,
    score: a.fairnessScore?.score,
    severity: a.severityScore,
    useCase: a.config?.useCase,
    completedAt: a.completedAt || a.createdAt,
  }));

  const scoreTrend = audits
    .slice(0, 10)
    .reverse()
    .map((a) => ({
      date: a.completedAt || a.createdAt,
      score: a.fairnessScore?.score ?? 0,
      name: a.datasetName,
    }));

  const severityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
  audits.forEach((a) => {
    const s = a.severityScore;
    if (s && severityBreakdown[s] !== undefined) severityBreakdown[s]++;
  });

  apiResponse.success(res, {
    stats: {
      datasets: datasetCount,
      audits: auditCount,
      issues: issueCount,
      activeMonitors: monitorCount,
    },
    recentAudits,
    scoreTrend,
    severityBreakdown,
  });
});

module.exports = {
  createMonitor,
  getMonitors,
  getMonitor,
  refreshMonitor,
  acknowledgeAlert,
  toggleMonitor,
  deleteMonitor,
  getDashboardStats,
};
