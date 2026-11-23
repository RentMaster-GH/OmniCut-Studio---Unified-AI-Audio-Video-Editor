export const THEMES = [
  "mafia",
  "cinematic",
  "documentary",
  "luxury",
  "cyberpunk",
  "noir",
] as const;

export type RealisticTheme = (typeof THEMES)[number];

export interface RealisticVideoRequest {
  prompt: string;
  theme?: RealisticTheme | string;
  model?: "kling-3.0" | "runway-gen4.5" | string;
  duration?: number;
}

export interface RealisticVideoResponse {
  videoUrl: string;
}

const REAL_URL =
  "https://vercel.app";

export async function generateRealistic(
  params: RealisticVideoRequest
): Promise<RealisticVideoResponse> {
  const res = await fetch(REAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(30000),
  });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Gateway returned invalid JSON (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Gateway error (HTTP ${res.status})`);
  }

  if (!data?.videoUrl) {
    throw new Error("Gateway response missing videoUrl");
  }

  return { videoUrl: data.videoUrl };
}

export async function generateTrueVideo(prompt: string): Promise<string> {
  const { videoUrl } = await generateRealistic({ prompt });
  return videoUrl;
}
