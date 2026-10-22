export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';

export function getOmniKey(){ try{return localStorage.getItem('omnicut_free_key')||'';}catch{return'';} }
export function setOmniKey(k:string){ try{localStorage.setItem('omnicut_free_key',k);}catch{} }
export function getCredits(){ try{return parseInt(localStorage.getItem('omnicut_credits')||'100');}catch{return 100;} }

export async function generateWithFreeProxy(prompt: string){
  const encoded = encodeURIComponent(prompt + ' cinematic 4k true motion');
  const url = `${PROXY_BASE}/api/video?prompt=${encoded}&redirect=true&t=${Date.now()}`;
  const fallback = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&model=flux`;
  return { url, fallback, type: 'video' };
}

export function getDirectVideoUrl(p:string){
  return `${PROXY_BASE}/api/video?prompt=${encodeURIComponent(p)}&redirect=true`;
}
