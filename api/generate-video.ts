import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, aspect, style } = req.body;
  const TOKEN = (process.env.REPLICATE_API_TOKEN || '').trim().replace(/^Bearer\s+/,'').replace(/^Token\s+/,'');
  const GEMINI = (process.env.GEMINI_API_KEY || '').trim();
  
  if (!TOKEN) return res.status(500).json({ error: 'REPLICATE_API_TOKEN missing' });

  let enhancedPrompt = `${prompt}, ${style || 'cinematic'}, 8k, high quality`;
  
  if (GEMINI) {
    try {
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Enhance this video prompt to detailed cinematic (max 300 chars): "${prompt}" - return only prompt` }] }] })
      });
      const d = await g.json();
      const t = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (t && t.length > 10) enhancedPrompt = t.slice(0,500);
    } catch {}
  }

  // List of reliable models to try in order
  const attempts = [
    { 
      url: 'https://api.replicate.com/v1/models/kwaivgi/kling-v2.5-turbo/predictions',
      input: { prompt: enhancedPrompt, duration: 5, aspect_ratio: aspect === '9:16' ? '9:16' : '16:9', cfg_scale: 0.5 }
    },
    {
      url: 'https://api.replicate.com/v1/models/luma/dream-machine/predictions',
      input: { prompt: enhancedPrompt, aspect_ratio: aspect || '16:9', loop: false }
    },
    {
      url: 'https://api.replicate.com/v1/models/minimax/video-01/predictions',
      input: { prompt: enhancedPrompt, prompt_optimizer: true }
    }
  ];

  for (const attempt of attempts) {
    try {
      console.log(`Trying ${attempt.url}`);
      const createRes = await fetch(attempt.url, {
        method: 'POST',
        headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json', 'Prefer': 'wait=60' },
        body: JSON.stringify({ input: attempt.input })
      });
      
      let pred = await createRes.json();
      
      if (!createRes.ok) {
        console.log(`Create failed for ${attempt.url}:`, pred);
        if (pred.detail?.includes('throttled') || pred.detail?.includes('rate')) {
          return res.status(429).json({ error: `Throttled: ${pred.detail}. Wait 15s and retry, or add billing at replicate.com/account/billing` });
        }
        continue; // try next model
      }

      // Poll with same token
      for (let i = 0; i < 60; i++) {
        // Replicate will auto-wait if we used Prefer: wait, but poll anyway
        if (pred.status === 'succeeded') {
          const videoUrl = Array.isArray(pred.output) ? pred.output[0] : (pred.output as any)?.video || pred.output;
          if (videoUrl) return res.status(200).json({ url: videoUrl, provider: 'replicate', model: attempt.url, enhancedPrompt });
        }
        if (pred.status === 'failed') throw new Error(pred.error || 'Generation failed');
        
        await new Promise(r => setTimeout(r, 4000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
          headers: { 'Authorization': `Token ${TOKEN}` }
        });
        if (!pollRes.ok) {
          const err = await pollRes.json();
          if (pollRes.status === 404) return res.status(404).json({ error: `Prediction ${pred.id} not found - likely token mismatch or expired. Try again. Raw: ${JSON.stringify(err)}` });
          throw new Error(JSON.stringify(err));
        }
        pred = await pollRes.json();
      }
      return res.status(200).json({ taskId: pred.id, provider: 'replicate', status: pred.status, enhancedPrompt });
      
    } catch (e:any) {
      console.log(`Attempt ${attempt.url} error:`, e.message);
      // continue to next model
      if (e.message.includes('Throttled') || e.message.includes('resource')) {
        // don't try more if throttled
        return res.status(500).json({ error: e.message });
      }
    }
  }
  
  return res.status(500).json({ error: 'All models failed. Add billing to Replicate or check LUMA_API_KEY' });
}
