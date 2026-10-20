import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, aspect, duration } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'Prompt required (min 3 chars)' });
    }

    const key = process.env.POLLINATIONS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'POLLINATIONS_API_KEY not set in Vercel Dashboard → Settings → Environment Variables' });
    }

    const cleanPrompt = prompt.trim().slice(0, 1000);
    const dur = Math.min(Math.max(Number(duration) || 5, 3), 10); // 3-10s safe
    const ratio = aspect === '9:16' ? '9:16' : aspect === '1:1' ? '1:1' : '16:9';

    // FINAL WORKING URL - NO model param = uses default, no 400 error
    // This returns in <100ms, no fetch inside Vercel = no timeout
    const url = `https://gen.pollinations.ai/video/${encodeURIComponent(cleanPrompt)}?duration=${dur}&aspectRatio=${ratio}&key=${key}&nologo=true&safe=false`;

    return res.status(200).json({
      url,
      type: 'video',
      provider: 'pollinations',
      status: 'succeeded',
      duration: dur,
      aspect: ratio,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}