export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';

export function getOmniKey(): string {
  try {
    return localStorage.getItem('omnicut_free_key') || '';
  } catch { return ''; }
}

export function setOmniKey(key: string) {
  try {
    localStorage.setItem('omnicut_free_key', key);
    localStorage.setItem('omnicut_credits', '100');
  } catch {}
}

export function getCredits(): number {
  try { return parseInt(localStorage.getItem('omnicut_credits') || '0'); } catch { return 0; }
}

// STEP 1: Generate your own omni_ key with 100 credits
export async function ensureOmniKey(email: string = 'rentmaster.gh@gmail.com'): Promise<string> {
  let key = getOmniKey();
  if (key && key.startsWith('omni_')) return key;

  console.log('Generating new omni_ key from gateway...');
  const res = await fetch(`${PROXY_BASE}/api/keys/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!res.ok) throw new Error('Key generation failed');
  const data = await res.json();
  const newKey = data.key || data.apiKey || data.omni_key;
  if (!newKey) throw new Error('No key in response');
  
  setOmniKey(newKey);
  return newKey;
}

// STEP 2: Check balance
export async function checkBalance(key?: string): Promise<number> {
  const k = key || getOmniKey();
  if (!k) return 0;
  try {
    const res = await fetch(`${PROXY_BASE}/api/keys/balance?key=${k}`);
    const data = await res.json();
    const bal = data.balance ?? data.credits ?? data.remaining ?? 100;
    try { localStorage.setItem('omnicut_credits', String(bal)); } catch {}
    return bal;
  } catch { return getCredits(); }
}

// STEP 3: TRUE MOTION VIDEO via POST /api/generate
export async function generateWithFreeProxy(
  prompt: string,
  type: 'video' | 'image' = 'video',
  opts: any = {}
): Promise<{ url: string; type: string }> {
  const key = await ensureOmniKey();
  await checkBalance(key);

  // Primary: POST /api/generate with X-API-Key
  const res = await fetch(`${PROXY_BASE}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': key
    },
    body: JSON.stringify({
      prompt: prompt + ' true motion, 5 seconds, cinematic, smooth movement, 24fps',
      type: 'video',
      width: opts.width || 1280,
      height: opts.height || 720,
      duration: 5,
      motion: true
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Generate failed: ${err}`);
  }

  const data = await res.json();
  const url = data.url || data.videoUrl || data.video || data.result || data.src;
  if (!url) throw new Error('No video url returned');

  // Deduct locally
  try {
    const bal = await checkBalance(key);
    localStorage.setItem('omnicut_credits', String(Math.max(0, bal - 1)));
  } catch {}

  return { url, type: 'video' };
}

// STEP 4: Direct GET /api/video?prompt=... fallback
export function getDirectVideoUrl(prompt: string): string {
  return `${PROXY_BASE}/api/video?prompt=${encodeURIComponent(prompt)}&duration=5&motion=true`;
}
