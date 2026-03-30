const { GoogleGenAI } = require('@google/genai');
const { env } = require('../../config');

let client = null;

const getClient = () => {
  if (!client && env.GEMINI_API_KEY) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateJSON = async (prompt, systemInstruction, retries = 3) => {
  const ai = getClient();
  if (!ai) throw new Error('Gemini API key not configured');

  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000);
        console.log(`[Gemini] Retry ${attempt}/${retries} after ${delay}ms...`);
        await sleep(delay);
      }

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
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.message?.includes('429') || JSON.stringify(err).includes('429');
      if (status && attempt < retries - 1) continue;
      throw err;
    }
  }

  throw lastError;
};

module.exports = { getClient, generateJSON };
