export default function handler(req: any, res: any) {
  return res.json({ status: 'succeeded', url: req.query.url });
}
