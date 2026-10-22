export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';

let audioCtx: AudioContext | null = null;

export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Unlock speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
    console.log('🔊 Audio unlocked:', audioCtx.state);
  } catch(e) { console.error(e); }
}

export async function generateVoiceover(text: string): Promise<string> {
  try {
    // Try ElevenLabs-style via gateway if you add route, else use browser
    const url = `${PROXY_BASE}/api/audio?text=${encodeURIComponent(text)}&t=${Date.now()}`;
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}
  return `tts:${text}`;
}

export function speakWithBrowser(text: string) {
  unlockAudio();
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voices.find(v => v.name.includes('Google') || v.lang.startsWith('en')) || voices[0];
  u.rate = 0.95;
  u.volume = 1; // FULL VOLUME
  u.pitch = 1;
  u.onstart = () => console.log('🔊 Speaking:', text.slice(0,30));
  window.speechSynthesis.speak(u);
}
