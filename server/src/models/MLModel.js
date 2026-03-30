const mongoose = require('mongoose');

const mlModelSchema = new mongoose.Schema(
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
    source: {
      type: String,
      enum: ['upload', 'vertex_ai'],
      required: true,
    },
    framework: {
      type: String,
      enum: ['onnx', 'tensorflow', 'sklearn', 'pytorch', 'vertex_ai', 'unknown'],
      default: 'unknown',
    },
    filePath: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    originalName: {
      type: String,
    },
    vertexConfig: {
      endpointId: String,
      modelId: String,
      projectId: String,
      location: String,
    },
    status: {
      type: String,
      enum: ['uploaded', 'validating', 'ready', 'error'],
      default: 'uploaded',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MLModel', mlModelSchema);
