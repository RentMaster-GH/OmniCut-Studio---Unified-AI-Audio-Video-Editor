import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { prompt, duration, aspect } = req.query as any;
  const apiKey = process.env.POLLINATIONS_API_KEY!;
  
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt as string)}?duration=${duration||5}&aspectRatio=${aspect||'16:9'}&nologo=true`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).send(text);
  }

  res.setHeader('Content-Type', 'video/mp4');
  const buffer = await response.arrayBuffer();
  return res.status(200).send(Buffer.from(buffer));
}