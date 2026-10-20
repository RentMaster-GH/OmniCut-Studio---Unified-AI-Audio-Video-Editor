import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mode, model, prompt, negativePrompt, aspect, duration, style, referenceImage, voice } = req.body;
  const REPLICATE = process.env.REPLICATE_API_TOKEN;
  const GEMINI = process.env.GEMINI_API_KEY || process.env.GENERATIVE_AI_KEY;
  const LUMA_KEY = process.env.LUMA_API_KEY;
  const RUNWAY_KEY = process.env.RUNWAY_API_KEY;

  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  if (!REPLICATE) return res.status(500).json({ error: 'Missing REPLICATE_API_TOKEN' });

  // 1. ENHANCE PROMPT WITH GEMINI (auto B-roll script + voiceover script)
  let enhancedPrompt = prompt;
  let brollPlan: string[] = [];
  let voiceoverScript = "";

  if (GEMINI) {
    try {
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are InVideo AI. Given prompt: "${prompt}" Mode: ${mode} Style: ${style} Duration: ${duration}s. Return JSON only: {"enhancedPrompt": "cinematic detailed prompt", "broll": ["scene1 keyword", "scene2 keyword"], "voiceover": "15 second voiceover script"} No markdown.` }] }]
        })
      });
      const gData = await gRes.json();
      const text = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        enhancedPrompt = parsed.enhancedPrompt || prompt;
        brollPlan = parsed.broll || [];
        voiceoverScript = parsed.voiceover || "";
      }
    } catch (e) { console.log("Gemini enhance failed", e); }
  }

  // 2. MAP MODEL TO REPLICATE
  const modelMap: any = {
    'runway-gen4': { model: "runwayml/gen4-turbo", input: (p: string) => ({ prompt: p, duration: duration, aspect_ratio: aspect }) },
    'luma-dream': { model: "luma/dream-machine", input: (p: string) => ({ prompt: p, aspect_ratio: aspect === '9:16' ? '9:16' : '16:9' }) },
    'pika-2.0': { model: "pika/pika-2.0", input: (p: string) => ({ prompt: p, aspect_ratio: aspect }) },
    'sora-turbo': { model: "openai/sora", input: (p: string) => ({ prompt: p, aspect_ratio: aspect, n_frames: duration * 24 }) },
    'kling-2.0': { model: "kwaivgi/kling-v2.0", input: (p: string) => ({ prompt: p, duration: duration, aspect_ratio: aspect }) },
  };

  const selected = modelMap[model] || modelMap['runway-gen4'];

  try {
    // CREATE PREDICTION ON REPLICATE
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${REPLICATE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selected.model,
        input: {
          ...selected.input(enhancedPrompt + (negativePrompt ? ` --neg ${negativePrompt}` : "")),
          ...(referenceImage ? { image: referenceImage } : {})
        }
      })
    });

    const prediction = await createRes.json();
    if (!createRes.ok) {
      // Fallback: try direct Luma if replicate fails
      if (LUMA_KEY && model.includes('luma')) {
        const lumaRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LUMA_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: enhancedPrompt, aspect_ratio: aspect })
        });
        const lumaData = await lumaRes.json();
        return res.status(200).json({ taskId: lumaData.id, provider: 'luma', status: 'processing', enhancedPrompt, brollPlan, voiceoverScript });
      }
      throw new Error(JSON.stringify(prediction));
    }

    // POLL REPLICATE (60s max then return taskId for client polling)
    let final = prediction;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${final.id}`, {
        headers: { 'Authorization': `Bearer ${REPLICATE}` }
      });
      final = await poll.json();
      if (final.status === 'succeeded') {
        const videoUrl = Array.isArray(final.output) ? final.output[0] : final.output;
        
        // 3. AUTO VOICEOVER (ElevenLabs via Replicate)
        let voiceoverUrl = null;
        if (voiceoverScript && mode !== 'text-to-video') {
          try {
            const ttsRes = await fetch('https://api.replicate.com/v1/predictions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${REPLICATE}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: "suno/bark",
                input: { prompt: voiceoverScript, text_temp: 0.7 }
              })
            });
            const ttsData = await ttsRes.json();
            voiceoverUrl = ttsData.id; // client can poll
          } catch {}
        }

        return res.status(200).json({
          url: videoUrl,
          provider: 'replicate',
          model: selected.model,
          enhancedPrompt,
          brollPlan,
          voiceoverScript,
          voiceoverUrl,
          duration,
          aspect
        });
      }
      if (final.status === 'failed') throw new Error(final.error || 'Generation failed');
    }

    // Still processing - return for frontend polling
    return res.status(200).json({
      taskId: final.id,
      provider: 'replicate',
      status: final.status,
      enhancedPrompt,
      brollPlan,
      voiceoverScript,
      message: 'Still processing - poll /api/check-status'
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
