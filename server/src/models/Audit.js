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
      required: true,
    },
    datasetName: String,
    modelRef: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
    },
    config: {
      targetColumn: String,
      protectedAttributes: [String],
      useCase: String,
    },
    fairnessScore: {
      score: Number,
      penalties: [String],
    },
    fairnessMetrics: mongoose.Schema.Types.Mixed,
    sliceResults: mongoose.Schema.Types.Mixed,
    shapValues: mongoose.Schema.Types.Mixed,
    biasSummary: {
      executiveSummary: String,
      findings: [
        {
          title: String,
          description: String,
          severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
          affectedGroups: [String],
          recommendation: String,
        },
      ],
      overallRiskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      complianceNotes: [
        {
          regulation: String,
          relevance: String,
          riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        },
      ],
    },
    severityScore: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', null],
      default: null,
    },
    completedAt: Date,
    error: String,
  },
  { timestamps: true }
);

auditSchema.index({ owner: 1, createdAt: -1 });
auditSchema.index({ dataset: 1 });

module.exports = mongoose.model('Audit', auditSchema);
