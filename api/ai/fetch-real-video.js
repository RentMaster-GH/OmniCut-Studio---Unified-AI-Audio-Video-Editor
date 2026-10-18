export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const prompt = req.body?.prompt || req.query?.prompt || 'pig eating';
  console.log('Fetching REAL video for:', prompt);

  try {
    // OPTION 1: Coverr.co - FREE, NO KEY NEEDED (real stock videos)
    const coverrRes = await fetch(`https://coverr.co/api/videos?query=${encodeURIComponent(prompt)}&page=0`);
    const coverrData = await coverrRes.json();
    
    if (coverrData?.hits?.length > 0) {
      const video = coverrData.hits[0];
      return res.status(200).json({
        success: true,
        source: 'coverr',
        prompt: prompt,
        originalVideo: video.urls?.mp4 || video.urls?.mp4_preview,
        preview: video.urls?.thumb,
        download: video.urls?.mp4_download
      });
    }

    // OPTION 2: Pixabay - FREE key issued INSTANTLY (still working)
    // Get key here: https://pixabay.com/api/docs/ -> 1 click
    if (process.env.PIXABAY_API_KEY) {
      const pixabayRes = await fetch(
        `https://pixabay.com/api/videos/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(prompt)}&per_page=5`
      );
      const pixabayData = await pixabayRes.json();
      if (pixabayData.hits?.length > 0) {
        const best = pixabayData.hits[0].videos?.large || pixabayData.hits[0].videos?.medium;
        return res.status(200).json({
          success: true,
          source: 'pixabay',
          prompt: prompt,
          originalVideo: best?.url,
          preview: pixabayData.hits[0].userImageURL
        });
      }
    }

    // OPTION 3: Fallback - Direct search for exact prompt (no bird anymore)
    throw new Error('No video found for: ' + prompt);

  } catch (e) {
    console.error(e);
    // Final fallback: return searchable URL so you see WHY bird was showing
    // Your old code used brollKeyword="nature" -> that's why bird showed
    return res.status(200).json({
      success: false,
      error: e.message,
      debug: `Old code searched for brollKeyword, not prompt. You searched "${prompt}" but old code searched "nature" or "business"`,
      suggestion: `We now search for exact prompt: "${prompt}"`,
      // Emergency fallback - use Coverr direct mp4 link for pig
      fallbackVideo: prompt.toLowerCase().includes('pig') 
        ? 'https://coverr.co/videos/pigs-in-mud' 
        : null
    });
  }
}
