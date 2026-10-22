export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';

export async function generateVoiceover(text: string, voice = 'alloy'): Promise<string> {
  // Uses your gateway + Pollinations audio + browser fallback
  try {
    const url = `${PROXY_BASE}/api/audio?text=${encodeURIComponent(text)}&voice=${voice}&t=${Date.now()}`;
    // Try gateway first (if you have audio route)
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}
  // Fallback: Use browser SpeechSynthesis and return text for subtitle sync
  return `tts:${text}`;
}

export function speakWithBrowser(text: string, rate = 0.95) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}
