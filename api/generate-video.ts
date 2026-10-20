import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, aspect, duration, style, model, mode, referenceImage, negativePrompt } = req.body;
  const REPLICATE_RAW = process.env.REPLICATE_API_TOKEN || '';
  const REPLICATE = REPLICATE_RAW.trim().replace(/^Bearer\s+/,'');
  const GEMINI = (process.env.GEMINI_API_KEY || process.env.GENERATIVE_AI_KEY || '').trim();

  if (!REPLICATE) return res.status(500).json({ error: 'REPLICATE_API_TOKEN missing in Vercel env. Add it and redeploy.' });
  if (!REPLICATE.startsWith('r8_')) return res.status(500).json({ error: `Invalid token format: got ${REPLICATE.slice(0,5)}... should start with r8_` });

  let enhancedPrompt = `${prompt}, ${style || 'cinematic'} style, 8k, high motion`;

  // Optional Gemini enhance
  if (GEMINI) {
    try {
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Enhance this video prompt to be detailed cinematic: "${prompt}". Return only enhanced prompt.` }] }] })
      });
      const d = await g.json();
      const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) enhancedPrompt = t.slice(0, 500);
    } catch {}
  }

  try {
    // Use stable Replicate model - lucataco/animate-diff is reliable fallback
    const modelId = model === 'pika-2.0' ? "pika/pika-2.0" : "runwayml/gen4-turbo";
    const resCreate = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 
        'Authorization': `Token ${REPLICATE}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: modelId,
        input: { prompt: enhancedPrompt, duration: duration || 5, aspect_ratio: aspect || '16:9' }
      })
    });
    const pred = await resCreate.json();
    if (!resCreate.ok) {
      console.error('Replicate create failed', pred);
      return res.status(resCreate.status).json({ error: pred.detail || pred.title || JSON.stringify(pred), raw: pred });
    }

    // Poll for up to 90s
    let final = pred;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${final.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE}` }
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
