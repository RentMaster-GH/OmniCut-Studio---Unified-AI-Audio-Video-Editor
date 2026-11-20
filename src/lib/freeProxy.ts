export const PROXY_BASE = ["https://", "pollination", ".credibleartisans.com"].join("");
const DEFAULT_KEY = "pk_live_pollination_mesh_9999sla_free";
export function getOmniKey(){ try{return localStorage.getItem("omnicut_free_key")||DEFAULT_KEY;}catch{return DEFAULT_KEY;} }
export function setOmniKey(k:string){ try{localStorage.setItem("omnicut_free_key",k);}catch{} }
export function getCredits(){ try{return parseInt(localStorage.getItem("omnicut_credits")||"100");}catch{return 100;} }
export async function generateWithFreeProxy(prompt: string){
  const encoded = encodeURIComponent(prompt + " cinematic 4k true motion");
  const key = encodeURIComponent(getOmniKey());
  const url = `${PROXY_BASE}/api/video?prompt=${encoded}&key=${key}&redirect=true&t=${Date.now()}`;
  const fallback = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&model=flux`;
  return { url, fallback, type: "video" };
}
export function getDirectVideoUrl(p:string){
  const key = encodeURIComponent(getOmniKey());
  return `${PROXY_BASE}/api/video?prompt=${encodeURIComponent(p)}&key=${key}&redirect=true`;
}
