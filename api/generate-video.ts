import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { prompt, aspect, duration } = req.body || {};
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return res.status(500).json({ error: 'POLLINATIONS_API_KEY missing' });
  const dur = Number(duration) || 5;
  const ratio = aspect === '9:16' ? '9:16' : '16:9';
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?duration=${dur}&aspectRatio=${ratio}&key=${key}&nologo=true`;
  return res.status(200).json({ url, status: 'succeeded' });
}