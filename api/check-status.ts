import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { taskId, provider } = req.query;
  const REPLICATE = process.env.REPLICATE_API_TOKEN;
  const RUNWAY = process.env.RUNWAY_API_KEY;
  const LUMA = process.env.LUMA_API_KEY;

  try {
    if (provider === 'replicate') {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${taskId}`, {
        headers: { 'Authorization': `Bearer ${REPLICATE}` }
      });
      const data = await r.json();
      if (data.status === 'succeeded') {
        const url = Array.isArray(data.output) ? data.output[0] : data.output;
        return res.json({ status: 'succeeded', url, output: data.output });
      }
      return res.json({ status: data.status, error: data.error });
    }
    if (provider === 'luma') {
      const r = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
        headers: { 'Authorization': `Bearer ${LUMA}` }
      });
      const d = await r.json();
      if (d.state === 'completed') return res.json({ status: 'succeeded', url: d.assets?.video });
      return res.json({ status: d.state });
    }
    if (provider === 'runway') {
      const r = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${RUNWAY}`, 'X-Runway-Version': '2024-11-06' }
      });
      return res.json(await r.json());
    }
    return res.json({ status: 'unknown' });
  } catch (e:any) { return res.status(500).json({ error: e.message }); }
}
