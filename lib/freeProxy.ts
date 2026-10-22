import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const GATEWAY = 'https://pollinationaidecentralizedinference.vercel.app';
const CACHE_FILE = path.join(process.cwd(), '.omnicut_key.json');

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } 
  catch { return {}; }
}
function saveCache(data: any) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

export async function getFreeProxyKey(email?: string): Promise<string> {
  const cache = loadCache();
  if (cache.apiKey) {
    console.log(`♻️  Using cached key: ${cache.apiKey.slice(0,15)}... (${cache.credits} credits left)`);
    return cache.apiKey;
  }

  console.log('🔑 Generating new self-sufficient omni_... key from YOUR Supabase...');
  const res = await fetch(`${GATEWAY}/api/keys/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email || 'free@omnicut.studio' })
  });
  const data = await res.json();
  if (!data.apiKey) throw new Error('Failed to generate key: ' + JSON.stringify(data));
  
  saveCache({ apiKey: data.apiKey, credits: data.credits, email });
  console.log(`✅ Generated: ${data.apiKey} with ${data.credits} credits`);
  return data.apiKey;
}

export async function generateWithFreeProxy(prompt: string, type: 'image'|'video'='image') {
  const apiKey = await getFreeProxyKey();
  
  console.log(`🎨 Generating ${type}: "${prompt}"`);
  const res = await fetch(`${GATEWAY}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({ 
      prompt, 
      type, 
      model: type === 'video' ? 'veo' : 'flux',
      duration: 5,
      aspectRatio: '16:9'
    })
  });
  const data = await res.json();
  
  if (data.remainingCredits !== undefined) {
    const cache = loadCache();
    saveCache({ ...cache, credits: data.remainingCredits });
    console.log(`💳 Credits left: ${data.remainingCredits}`);
  }
  
  console.log(`✅ Result: ${data.url}`);
  return data.url;
}

// ESM-safe CLI check
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const prompt = process.argv[2] || "cinematic cat astronaut floating in space, 8k";
  const type = (process.argv[3] as any) || "video";
  generateWithFreeProxy(prompt, type).then(url => {
    console.log("\n--- FINAL URL ---");
    console.log(url);
  });
}
