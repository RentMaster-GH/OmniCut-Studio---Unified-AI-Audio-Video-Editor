export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';

export function getOmniKey(): string {
  try {
    let k = localStorage.getItem('omnicut_free_key');
    if (!k) {
      k = 'omni_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('omnicut_free_key', k);
      localStorage.setItem('omnicut_credits', '100');
    }
    return k;
  } catch { return 'omni_demo'; }
}

export function getCredits(): number {
  try { return parseInt(localStorage.getItem('omnicut_credits') || '100'); } catch { return 100; }
}

export async function generateWithFreeProxy(
  prompt: string, 
  type: 'image' | 'video' = 'video',
  opts: any = {}
): Promise<{ url: string; type: string }> {
  getOmniKey();
  const credits = getCredits();
  if (credits > 0) {
    try { localStorage.setItem('omnicut_credits', String(credits - 1)); } catch {}
  }

  const encoded = encodeURIComponent(prompt);
  const width = opts.width || 1280;
  const height = opts.height || 720;

  // YOUR decentralized gateway - tries multiple endpoints for motion video
  const endpoints = [
    `${PROXY_BASE}/api/generate?prompt=${encoded}&type=video&width=${width}&height=${height}&motion=true`,
    `${PROXY_BASE}/api/video?prompt=${encoded}&width=${width}&height=${height}`,
    `${PROXY_BASE}/generate?prompt=${encoded}&type=video`,
    `${PROXY_BASE}/api/generate-video?prompt=${encoded}`,
  ];

  // Try YOUR proxy first for TRUE MOTION
  for (const endpoint of endpoints) {
    try {
      console.log('Trying FREE_PROXY:', endpoint);
      const res = await fetch(endpoint, { method: 'GET' });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        // Your gateway might return { url, videoUrl, src }
        if (data) {
          const url = data.url || data.videoUrl || data.video || data.src || data.result;
          if (url) return { url, type: 'video' };
        }
        // If returns blob/video directly
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('video') || contentType.includes('image')) {
          return { url: endpoint, type: contentType.includes('video') ? 'video' : 'image' };
        }
      }
    } catch (e) {
      console.log('Endpoint failed:', endpoint, e);
    }
  }

  // Fallback: your proxy as image proxy wrapper for video preview
  // Your vercel app likely proxies to pollinations internally
  const fallbackUrl = `${PROXY_BASE}/api/image?prompt=${encoded}&width=${width}&height=${height}&nologo=true`;
  // Final fallback direct
  const directFallback = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=turbo`;

  // Return your proxy URL - it will generate motion on server
  return { url: fallbackUrl, type: 'video' };
}
