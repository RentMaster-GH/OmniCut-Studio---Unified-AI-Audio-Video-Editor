import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { prompt, aspect, duration } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt missing' });

  const dur = Math.min(Number(duration) || 5, 10); // free tier max 10s
  const ratio = aspect === '9:16' ? '9:16' : '1:1';
  
  // FREE - NO KEY, NO PAYMENT
  const encoded = encodeURIComponent(prompt);
  const url = `https://gen.pollinations.ai/video/${encoded}?duration=${dur}&aspectRatio=${ratio}&nologo=false`;

  console.log('FREE video URL:', url);

  return res.status(200).json({ 
    url, 
    status: 'succeeded',
    free: true
  });
}