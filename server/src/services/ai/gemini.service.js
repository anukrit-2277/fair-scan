const { GoogleGenAI } = require('@google/genai');
const { env } = require('../../config');

let client = null;

const getClient = () => {
  if (!client && env.GEMINI_API_KEY) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
};

const generateJSON = async (prompt, systemInstruction) => {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API key not configured');

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const text = response.text.trim();
  return JSON.parse(text);
};

module.exports = { getClient, generateJSON };
