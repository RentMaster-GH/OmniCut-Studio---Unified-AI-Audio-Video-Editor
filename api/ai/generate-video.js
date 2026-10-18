import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const prompt = req.body?.prompt || req.query?.prompt;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-generate-001',
      prompt: `Realistic 4k video: ${prompt}`,
    });

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    return res.status(200).json({ success: true, prompt, videoUri });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message, hint: 'Enable Veo API and billing in Google AI Studio' });
  }
}
