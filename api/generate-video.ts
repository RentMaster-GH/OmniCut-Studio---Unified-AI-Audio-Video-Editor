import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { prompt, aspect, duration } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt missing' });

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'POLLINATIONS_API_KEY missing in Vercel env' });

  const dur = Math.min(Number(duration) || 5, 10);
  const ratio = aspect === '9:16' ? '9:16' : aspect === '1:1' ? '1:1' : '16:9';

  try {
    // CORRECT WAY to use sk_ key - Bearer header, NOT ?key=
    const pollinationsUrl = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?duration=${dur}&aspectRatio=${ratio}&nologo=true&safe=false`;

    console.log('Calling Pollinations:', pollinationsUrl);

    // We don't fetch video here, we return the URL that frontend <video> tag will fetch with key
    // Frontend can't send Bearer header, so we need to proxy or use pk_ conversion
    // Simplest: return URL + tell frontend to fetch with Authorization via /api/video-proxy

    // For now, return URL with key in header instructions
    // The frontend video tag will fail if we use Bearer, so we use proxy approach

    const proxyUrl = `/api/video-proxy?prompt=${encodeURIComponent(prompt)}&duration=${dur}&aspect=${ratio}`;

    return res.status(200).json({
      url: pollinationsUrl, // direct URL
      proxyUrl, // use this if direct fails
      status: 'succeeded',
      useProxy: true
    });

  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}