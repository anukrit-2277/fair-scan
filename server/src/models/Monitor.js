const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['drift', 'threshold', 'degradation'], required: true },
  metric: String,
  attribute: String,
  message: String,
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  value: Number,
  threshold: Number,
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const snapshotSchema = new mongoose.Schema({
  fairnessScore: Number,
  severity: String,
  metricsPassing: Number,
  metricsFailing: Number,
  recordedAt: { type: Date, default: Date.now },
});

const monitorSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    audit: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit', required: true },
    datasetName: String,
    useCase: String,
    active: { type: Boolean, default: true },
    config: {
      checkIntervalHours: { type: Number, default: 24 },
      fairnessThreshold: { type: Number, default: 70 },
      driftThreshold: { type: Number, default: 10 },
    },
    snapshots: [snapshotSchema],
    alerts: [alertSchema],
    lastCheckedAt: Date,
  },
  { timestamps: true }
);

monitorSchema.index({ owner: 1, active: 1 });
monitorSchema.index({ audit: 1 });

module.exports = mongoose.model('Monitor', monitorSchema);
