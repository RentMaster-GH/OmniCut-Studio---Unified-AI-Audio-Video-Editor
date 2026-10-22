export const PROXY_BASE = 'https://pollinationaidecentralizedinference.vercel.app';
let audioCtx: AudioContext | null = null;
export function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    console.log('Audio unlocked:', audioCtx?.state);
  } catch(e){}
}
export async function generateVoiceover(text: string): Promise<string> {
  return `tts:${text}`;
}
export function speakWithBrowser(text: string) {
  unlockAudio();
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.volume = 1;
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
