import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const prompt = req.query.prompt as string;
  const duration = req.query.duration || '5';
  const aspect = req.query.aspect || '16:9';
  
  if (!prompt) return res.status(400).json({ error: 'prompt missing' });

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?duration=${duration}&aspectRatio=${aspect}&nologo=true&safe=false`;
  
  console.log('Proxy fetching:', url);

  try {
    const response = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        Accept: 'video/mp4'
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Pollinations error:', response.status, text);
      return res.status(response.status).json({ error: text, status: response.status });
    }

    // Stream video back
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Important: pipe the stream
    const arrayBuffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
    
  } catch (e: any) {
    console.error('Proxy error:', e);
    return res.status(500).json({ error: e.message });
  }
}