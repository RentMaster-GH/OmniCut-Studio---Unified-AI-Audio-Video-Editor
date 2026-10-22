export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';

export function getOmniKey(): string {
  try { return localStorage.getItem('omnicut_free_key') || ''; } catch { return ''; }
}
export function setOmniKey(k: string) { try { localStorage.setItem('omnicut_free_key', k); localStorage.setItem('omnicut_credits', '100'); } catch {} }
export function getCredits(): number { try { return parseInt(localStorage.getItem('omnicut_credits')||'0'); } catch { return 0; } }

export async function ensureOmniKey(email: string = 'rentmaster.gh@gmail.com'): Promise<string> {
  let key = getOmniKey();
  if (key) return key;
  // GET with simple request - no preflight
  try {
    const res = await fetch(`${PROXY_BASE}/api/keys/generate?email=${encodeURIComponent(email)}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      const newKey = data.key || data.apiKey;
      if (newKey) { setOmniKey(newKey); return newKey; }
    }
  } catch {}
  // POST fallback but try to avoid X-API-Key header
  try {
    const res = await fetch(`${PROXY_BASE}/api/keys/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    const newKey = data.key || data.apiKey || data.omni_key;
    if (newKey) { setOmniKey(newKey); return newKey; }
  } catch {}
  return 'omni_demo_' + Date.now().toString(36);
}

export async function generateWithFreeProxy(prompt: string, type: 'video'|'image'='video'): Promise<{url:string,type:string}> {
  await ensureOmniKey();
  const encoded = encodeURIComponent(prompt + ' true motion video 5s cinematic smooth');

  // USE GET - NO CUSTOM HEADER = NO CORS PREFLIGHT
  // Your gateway GET /api/video?prompt= should return MP4 directly
  const videoUrl = `${PROXY_BASE}/api/video?prompt=${encoded}&type=video&motion=true&duration=5&key=${getOmniKey()}`;
  
  console.log('FREE_PROXY VIDEO GET (no CORS):', videoUrl);
  return { url: videoUrl, type: 'video' };
}

export function getDirectVideoUrl(prompt: string): string {
  return `${PROXY_BASE}/api/video?prompt=${encodeURIComponent(prompt)}&motion=true&duration=5`;
}
