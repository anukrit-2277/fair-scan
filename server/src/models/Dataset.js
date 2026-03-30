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
          isProxy: { type: Boolean, default: false },
          proxyFor: String,
          proxyConfidence: Number,
        },
      ],
      rowCount: Number,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'error'],
      default: 'uploaded',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dataset', datasetSchema);
