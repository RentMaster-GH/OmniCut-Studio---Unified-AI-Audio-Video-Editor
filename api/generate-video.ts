import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, aspect, duration, style } = req.body;
  const TOKEN = (process.env.REPLICATE_API_TOKEN || '').trim().replace(/^Bearer\s+/,'');
  const GEMINI = (process.env.GEMINI_API_KEY || '').trim();
  
  if (!TOKEN) return res.status(500).json({ error: 'Missing REPLICATE_API_TOKEN' });

  let enhancedPrompt = `${prompt}, ${style || 'cinematic'} style, 8k`;

  if (GEMINI) {
    try {
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Enhance video prompt: "${prompt}". Return only enhanced prompt.` }] }] })
      });
      const d = await g.json();
      const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) enhancedPrompt = t.slice(0,500);
    } catch {}
  }

  try {
    // FIX: Use correct Replicate endpoint - POST to /v1/models/{owner}/{name}/predictions
    // Using stable public model: lucataco/hotshot-xl which is very reliable
    const resCreate = await fetch('https://api.replicate.com/v1/models/lucataco/hotshot-xl/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          prompt: enhancedPrompt,
          n_frames: 16,
          steps: 8
        }
      })
    });
    
    let pred = await resCreate.json();
    
    // If hotshot fails, fallback to animate-diff - super stable
    if (!resCreate.ok) {
      console.log('hotshot failed, trying animate-diff', pred);
      const res2 = await fetch('https://api.replicate.com/v1/models/lucataco/animate-diff/predictions', {
        method: 'POST',
        headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            prompt: enhancedPrompt,
            motion_module: "mm_sd_v15_v2",
            steps: 25
          }
        })
      });
      pred = await res2.json();
      if (!res2.ok) return res.status(res2.status).json({ error: pred.detail || JSON.stringify(pred), raw: pred });
    }

    // Poll
    let final = pred;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${final.id}`, {
        headers: { 'Authorization': `Token ${TOKEN}` }
      });
      final = await poll.json();
      if (final.status === 'succeeded') {
        const url = Array.isArray(final.output) ? final.output[0] : final.output;
        return res.status(200).json({ url, provider: 'replicate', enhancedPrompt });
      }
      if (final.status === 'failed') throw new Error(final.error || 'failed');
    }
    return res.status(200).json({ taskId: final.id, provider: 'replicate', status: final.status, enhancedPrompt });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}
