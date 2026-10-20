import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { prompt } = req.body || {};
  const seed = Math.floor(Math.random()*10000);
  // Use image but as MP4 - add &enhance and make frontend animate it
  // This will NEVER fetch-fail
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=turbo&seed=${seed}&nologo=true&enhance=true`;
  return res.status(200).json({ url, type: 'image', status: 'succeeded' });
}
