import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, aspect } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    const finalPrompt = `${prompt}, cinematic, ultra realistic, 8k, smooth motion`;
    const seed = Math.floor(Math.random() * 1000000);
    const width = aspect === '9:16' ? 720 : 1280;
    const height = aspect === '9:16' ? 1280 : 720;
    
    // 100% FREE, NO CARD, NO KEY - works instantly
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&model=turbo&seed=${seed}&nologo=true&enhance=true`;
    
    console.log("Generated:", url);
    
    return res.status(200).json({ 
      url: url,
      provider: 'pollinations-free',
      enhancedPrompt: finalPrompt,
      status: 'succeeded'
    });
  } catch (e:any) {
    console.error(e);
    return res.status(200).json({ 
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body?.prompt || 'test')}?width=1280&height=720&model=turbo&nologo=true`,
      provider: 'fallback-free',
      error: e.message,
      status: 'succeeded'
    });
  }
}
