const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
    },
    modelRef: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
    },
    fairnessMetrics: {
      demographicParity: mongoose.Schema.Types.Mixed,
      equalOpportunity: mongoose.Schema.Types.Mixed,
      predictiveParity: mongoose.Schema.Types.Mixed,
      disparateImpact: mongoose.Schema.Types.Mixed,
    },
    sliceResults: [mongoose.Schema.Types.Mixed],
    shapValues: mongoose.Schema.Types.Mixed,
    biasSummary: {
      type: String,
    },
    severityScore: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', null],
      default: null,
    },
    complianceFlags: [
      {
        regulation: String,
        article: String,
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        description: String,
      },
    ],
    mitigations: [
      {
        type: { type: String },
        appliedAt: Date,
        beforeMetrics: mongoose.Schema.Types.Mixed,
        afterMetrics: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Audit', auditSchema);
