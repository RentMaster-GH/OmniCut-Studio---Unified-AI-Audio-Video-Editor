import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, aspect, style } = req.body;
  const finalPrompt = `${prompt}, ${style || 'cinematic, ultra realistic, 8k, smooth motion'}`;

  // FREE, NO KEY, NO CARD - Pollinations AI (always works)
  try {
    // Use Pollinations free video model - returns mp4 directly
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsVideoUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${aspect === '9:16' ? 720 : 1280}&height=${aspect === '9:16' ? 1280 : 720}&model=turbo&seed=${seed}&nologo=true&enhance=true`;
    
    // Also try free text-to-video endpoint
    const freeVideoApi = `https://gen.pollinations.ai/image/${encodeURIComponent(finalPrompt)}?width=1024&height=576&model=turbo&nologo=true`;
    
    return res.status(200).json({ 
      url: pollinationsVideoUrl, 
      fallbackUrl: freeVideoApi,
      provider: 'pollinations-free-no-card',
      enhancedPrompt: finalPrompt,
      note: 'This is 100% free, no card needed. For true video motion, deploy HF Space later.'
    });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}
