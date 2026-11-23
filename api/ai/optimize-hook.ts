import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { scriptSegment, tone } = req.body || {};
  if (!scriptSegment) return res.status(400).json({ error: 'scriptSegment is required' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analyze this script section and suggest a visually striking 3-second B-roll clip prompt matching "${tone || 'engaging'}" pacing. Respond ONLY with JSON: {"bRollPrompt": "..."}\n\nScript Segment: ${scriptSegment}`,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json({ success: true, prompt: parsed.bRollPrompt || '' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to generate visual optimization node' });
  }
}
