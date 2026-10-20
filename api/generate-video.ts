import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { prompt } = req.body || {};
  const key = process.env.POLLINATIONS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Add POLLINATIONS_API_KEY in Vercel Dashboard -> Settings -> Env Vars' });
  // Return URL directly - no fetch, no timeout
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?model=seedance&duration=5&aspectRatio=16:9&key=${key}`;
  return res.json({ url, status: 'succeeded', type: 'video' });
}
