const FREE_PROXY = import.meta.env.VITE_FREE_PROXY || process.env.NEXT_PUBLIC_FREE_PROXY || "https://pollinationaidecentralizedinference.vercel.app/api/generate";
const REALISTIC_PROXY = import.meta.env.VITE_REALISTIC_PROXY || process.env.NEXT_PUBLIC_REALISTIC_PROXY || "https://pollinationaidecentralizedinference.vercel.app/api/video/generate";

export const THEMES = ["mafia","jollof","corporate","fashion","street","cinematic"] as const;

export async function generateFree(prompt: string, model="flux") {
  const res = await fetch(FREE_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model })
  });
  return await res.json();
}

export async function generateRealistic(opts: {
  prompt: string;
  theme?: typeof THEMES[number];
  model?: "kling-3.0" | "runway-gen4.5";
  duration?: number;
  referenceImages?: string[];
}) {
  const res = await fetch(REALISTIC_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      theme: opts.theme || "cinematic",
      model: opts.model || "kling-3.0",
      duration: opts.duration || 5,
      referenceImages: opts.referenceImages || []
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { videoUrl, model: "accra-v1" }
}
