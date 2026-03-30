const { GoogleGenAI } = require('@google/genai');
const { env } = require('../../config');

let genai = null;

const getClient = () => {
  if (!genai && env.GEMINI_API_KEY) {
    genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genai;
};

module.exports = { getClient };
