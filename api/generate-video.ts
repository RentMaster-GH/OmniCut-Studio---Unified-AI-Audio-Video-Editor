import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { prompt, aspect } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    const key = process.env.POLLINATIONS_API_KEY;
    const duration = 5;
    const ratio = aspect === '9:16' ? '9:16' : '16:9';
    // Real video endpoint - seedance is fastest
    const videoUrl = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?model=seedance&duration=${duration}&aspectRatio=${ratio}&key=${key}`;
    return res.status(200).json({ url: videoUrl, type: 'video', provider: 'pollinations-seedance', status: 'succeeded' });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}
