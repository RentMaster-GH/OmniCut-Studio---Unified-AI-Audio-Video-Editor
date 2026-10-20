import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { taskId } = req.query as any;
  const TOKEN = (process.env.REPLICATE_API_TOKEN || '').trim().replace(/^(Bearer|Token)\s+/,'');
  try {
    const r = await fetch(`https://api.replicate.com/v1/predictions/${taskId}`, {
      headers: { 'Authorization': `Token ${TOKEN}` }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.detail || 'Not found', raw: data });
    if (data.status === 'succeeded') {
      const url = Array.isArray(data.output) ? data.output[0] : (data.output as any)?.video || data.output;
      return res.json({ status: 'succeeded', url, output: data.output });
    }
    return res.json({ status: data.status, error: data.error });
  } catch (e:any) { return res.status(500).json({ error: e.message }); }
}
