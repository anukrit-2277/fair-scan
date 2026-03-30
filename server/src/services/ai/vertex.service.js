const { VertexAI } = require('@google-cloud/vertexai');
const { env } = require('../../config');

let vertexClient = null;

const getVertexClient = () => {
  if (!vertexClient && env.GOOGLE_CLOUD_PROJECT) {
    vertexClient = new VertexAI({
      project: env.GOOGLE_CLOUD_PROJECT,
      location: env.GOOGLE_CLOUD_LOCATION,
    });
  }
  return vertexClient;
};

module.exports = { getVertexClient };
