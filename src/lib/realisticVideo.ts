export async function generateTrueVideo(prompt: string) {
  const REAL_URL = "https://pollination-ai-decentralized-inference-gateway.vercel.app/api/video/generate";
  const res = await fetch(REAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.videoUrl;
}
