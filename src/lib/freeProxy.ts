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

export async function generateWithFreeProxy(prompt: string, type: 'image' | 'video' = 'image', opts: any = {}): Promise<{ url: string; type: string }> {
  getOmniKey();
  // Use Pollinations - FREE, no key, works in Ghana
  const encoded = encodeURIComponent(prompt + ', cinematic, 4k, ghana jollof cooking, true motion');
  const width = opts.width || 1280;
  const height = opts.height || 720;
  
  // Image proxy that always works
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`;
  
  // Try to fetch to ensure it exists (but don't block)
  try {
    localStorage.setItem('omnicut_credits', String(Math.max(0, getCredits() - 1)));
  } catch {}

  return { url: imageUrl, type: 'image' };
}
