const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    format: {
      type: String,
      enum: ['csv', 'json', 'google_sheets', 'sql_export'],
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    originalName: {
      type: String,
    },
    schemaInfo: {
      columns: [
        {
          name: String,
          dtype: String,
          isProtected: { type: Boolean, default: false },
          protectedReason: String,
          isProxy: { type: Boolean, default: false },
          proxyFor: String,
          proxyConfidence: Number,
          proxyReason: String,
        },
      ],
      rowCount: Number,
    },
    analysis: {
      useCase: {
        domain: String,
        description: String,
        confidence: Number,
      },
      targetColumn: {
        column: String,
        reason: String,
      },
      summary: String,
      analyzedAt: Date,
      confirmed: { type: Boolean, default: false },
      confirmedAt: Date,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzing', 'analyzed', 'confirmed', 'ready', 'error'],
      default: 'uploaded',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dataset', datasetSchema);
