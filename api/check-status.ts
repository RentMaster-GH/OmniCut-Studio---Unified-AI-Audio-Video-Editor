import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { taskId } = req.query;
  const TOKEN = (process.env.REPLICATE_API_TOKEN || '').trim();
  const r = await fetch(`https://api.replicate.com/v1/predictions/${taskId}`, {
    headers: { 'Authorization': `Token ${TOKEN}` }
  });
  const data = await r.json();
  if (data.status === 'succeeded') {
    const url = Array.isArray(data.output) ? data.output[0] : data.output;
    return res.json({ status: 'succeeded', url });
  }
  return res.json({ status: data.status, error: data.error });
}
