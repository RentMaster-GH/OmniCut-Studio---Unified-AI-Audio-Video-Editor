import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { keywords } = req.body;
  // Returns Pexels-style B-roll search - you can integrate Pexels API
  const PEXELS = process.env.PEXELS_API_KEY;
  if (!PEXELS) return res.json({ videos: [] });
  
  const results = await Promise.all((keywords as string[]).slice(0,3).map(async (k:string) => {
    const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(k)}&per_page=3`, {
      headers: { Authorization: PEXELS }
    });
    const d = await r.json();
    return d.videos?.[0]?.video_files?.[0]?.link;
  }));
  
  return res.json({ broll: results.filter(Boolean) });
}
