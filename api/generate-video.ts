import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    const finalPrompt = `${prompt}, cinematic, smooth motion, ultra realistic, 8k`;
    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) return res.status(500).json({ error: 'HF_TOKEN missing' });
    const r = await fetch('https://api-inference.huggingface.co/models/THUDM/CogVideoX-2b', {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json', 'x-wait-for-model': 'true' },
      body: JSON.stringify({ inputs: finalPrompt }),
    });
    if (r.ok && r.headers.get('content-type')?.includes('video')) {
      const buf = await r.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      return res.status(200).json({ url: `data:video/mp4;base64,${b64}`, provider: 'CogVideoX-2b', status: 'succeeded' });
    }
    const txt = await r.text();
    if (txt.includes('loading') || txt.includes('estimated_time')) {
      return res.status(202).json({ status: 'loading', message: 'Model warming up, retry in 20s' });
    }
    const seed = Math.floor(Math.random() * 9999);
    const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1280&height=720&model=turbo&seed=${seed}&nologo=true`;
    return res.status(200).json({ url: fallback, type: 'image', status: 'succeeded', note: txt.slice(0,200) });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}
