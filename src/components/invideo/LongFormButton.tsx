import { useState, useRef } from 'react';
import { useVideoGeneration } from './useVideoGeneration';
import { generateJollofScript, cuesToVTT, type SubtitleCue } from '@/lib/subtitles';
import { generateVoiceover, speakWithBrowser, unlockAudio } from '@/lib/voiceover';

export function LongFormButton({ addToTimeline }: { addToTimeline: (clip: any) => void }) {
  const { generateLongVideo, isGenerating, progress, currentStep } = useVideoGeneration();
  const [script, setScript] = useState<SubtitleCue[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handle10MinJollof = async () => {
    unlockAudio(); // UNMUTE ON CLICK - fixes browser autoplay block
    const cues = generateJollofScript();
    setScript(cues);
    const vtt = cuesToVTT(cues);
    const vttBlob = new Blob([vtt], { type: 'text/vtt' });
    const vttUrl = URL.createObjectURL(vttBlob);
    const fullPrompts = cues.map(c => `person cooking jollof in ghana, ${c.text.slice(0,60)}, cinematic 4k`);
    const expanded: string[] = [];
    for (let i=0;i<60;i++) expanded.push(fullPrompts[i%fullPrompts.length]);

    await generateLongVideo('person cooking authentic ghanaian jollof rice', 10, (url, i) => {
      const cue = cues[Math.floor((i/60)*cues.length)] || cues[0];
      // VIDEO - NO MUTED
      addToTimeline({ 
        id: `clip-${i}`, type: 'video', url, duration: 10, start: i*10,
        muted: false, volume: 1, transition: 'crossfade', prompt: expanded[i]
      });
      // SUBTITLE
      addToTimeline({ id: `sub-${i}`, type: 'subtitle', text: cue.text, start: i*10, end: i*10+10, vttUrl: i===0? vttUrl: undefined });
      // VOICEOVER EVERY 6 CLIPS - AUDIBLE
      if (i % 6 === 0) {
        speakWithBrowser(cue.text);
        if (audioRef.current) {
          audioRef.current.volume = 1;
          audioRef.current.muted = false;
        }
        generateVoiceover(cue.text).then(audioUrl => {
          if (!audioUrl.startsWith('tts:')) {
            addToTimeline({ id: `vo-${i}`, type: 'audio', url: audioUrl, start: i*10, duration: 20, volume: 1, muted: false, text: cue.text });
            // Play immediately for test
            if (audioRef.current) { audioRef.current.src = audioUrl; audioRef.current.play().catch(()=>{}); }
          }
        });
      }
    });
    addToTimeline({ id: 'full-subtitles', type: 'subtitle-track', url: vttUrl, vttContent: vtt, start: 0, duration: 600 });
  };

  return (
    <div className="space-y-3 mt-4 p-3 border border-orange-500/30 rounded-xl bg-orange-950/20">
      <audio ref={audioRef} controls autoPlay style={{display:'none'}} />
      <div className="flex justify-between items-center">
        <div className="text-xs font-bold text-orange-400 uppercase">InVideo Mode • 10 Min + Audio</div>
        <button onClick={unlockAudio} className="text-xs bg-green-600 text-white px-2 py-1 rounded">🔊 Unmute</button>
      </div>
      <button disabled={isGenerating} onClick={handle10MinJollof} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3.5 px-4 rounded-lg disabled:opacity-50">
        {isGenerating ? `🍚 ${progress}% - ${currentStep}` : '🔥 Generate 10 Min Jollof (60 Clips + VO + Subs) + Sound'}
      </button>
      {isGenerating && <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-orange-600 h-2 rounded-full" style={{width:`${progress}%`}} /></div>}
      <div className="text-[10px] text-yellow-300">If muted: Click 🔊 Unmute then click video player 🔊 icon. Browser blocks sound until first click.</div>
    </div>
  );
}
