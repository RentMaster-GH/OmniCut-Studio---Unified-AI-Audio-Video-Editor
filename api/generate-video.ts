import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, aspect, duration, style } = req.body;
  const REPLICATE = (process.env.REPLICATE_API_TOKEN || '').trim().replace(/^Bearer\s+/,'');
  const LUMA = (process.env.LUMA_API_KEY || '').trim();
  const GEMINI = (process.env.GEMINI_API_KEY || '').trim();
  
  let enhancedPrompt = `${prompt}, ${style || 'cinematic'} style, 8k`;

  if (GEMINI) {
    try {
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Enhance video prompt: "${prompt}". Return only prompt.` }] }] })
      });
      const d = await g.json();
      const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) enhancedPrompt = t.slice(0,500);
    } catch {}
  }

  // TRY LUMA FIRST (you have key, no throttling)
  if (LUMA) {
    try {
      const lumaRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LUMA}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: enhancedPrompt, 
          aspect_ratio: aspect === '9:16' ? '9:16' : '16:9',
          loop: false
        })
      });
      const lumaData = await lumaRes.json();
      if (lumaRes.ok) {
        // Poll Luma
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const poll = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${lumaData.id}`, {
            headers: { 'Authorization': `Bearer ${LUMA}` }
          });
          const pData = await poll.json();
          if (pData.state === 'completed') {
            return res.status(200).json({ url: pData.assets.video, provider: 'luma', enhancedPrompt });
          }
          if (pData.state === 'failed') throw new Error(pData.failure_reason || 'Luma failed');
        }
        return res.status(200).json({ taskId: lumaData.id, provider: 'luma', status: 'dreaming', enhancedPrompt });
      }
      console.log('Luma create failed', lumaData);
    } catch (e:any) { console.log('Luma error', e.message); }
  }

  // FALLBACK TO REPLICATE WITH RETRY FOR THROTTLE
  try {
    await new Promise(r => setTimeout(r, 11000)); // wait 11s to clear throttle
    
    const resCreate = await fetch('https://api.replicate.com/v1/models/lucataco/hotshot-xl/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Token ${REPLICATE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt: enhancedPrompt } })
    });
    let pred = await resCreate.json();
    if (!resCreate.ok) return res.status(resCreate.status).json({ error: pred.detail || JSON.stringify(pred) });

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE}` }
      });
      const final = await poll.json();
      if (final.status === 'succeeded') {
        const url = Array.isArray(final.output) ? final.output[0] : final.output;
        return res.status(200).json({ url, provider: 'replicate', enhancedPrompt });
      }
      if (final.status === 'failed') throw new Error(final.error);
      pred = final;
    }
    return res.status(200).json({ taskId: pred.id, provider: 'replicate', status: pred.status, enhancedPrompt });
  } catch (e:any) {
    return res.status(500).json({ error: e.message });
  }
}
