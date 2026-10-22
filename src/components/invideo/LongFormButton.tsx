import { useState } from 'react';
import { useVideoGeneration } from './useVideoGeneration';
import { generateJollofScript, cuesToVTT, type SubtitleCue } from '@/lib/subtitles';
import { generateVoiceover, speakWithBrowser } from '@/lib/voiceover';

export function LongFormButton({ addToTimeline }: { addToTimeline: (clip: any) => void }) {
  const { generateLongVideo, isGenerating, progress, currentStep } = useVideoGeneration();
  const [script, setScript] = useState<SubtitleCue[]>([]);
  const [isVO, setIsVO] = useState(false);

  const handle10MinJollof = async () => {
    const cues = generateJollofScript();
    setScript(cues);
    
    // 1. Create VTT subtitle file
    const vtt = cuesToVTT(cues);
    const vttBlob = new Blob([vtt], { type: 'text/vtt' });
    const vttUrl = URL.createObjectURL(vttBlob);
    
    // 2. Generate 60 clips with voiceover-synced prompts
    const prompts = cues.map(c => `person cooking jollof in ghana, ${c.text.slice(0,60)}, cinematic 4k`);
    
    // Expand to 60 clips (repeat script with variations)
    const fullPrompts: string[] = [];
    for (let i = 0; i < 60; i++) {
      fullPrompts.push(prompts[i % prompts.length]);
    }

    setIsVO(true);
    
    await generateLongVideo('person cooking authentic ghanaian jollof rice', 10, (url, i) => {
      const cue = cues[Math.floor((i / 60) * cues.length)] || cues[0];
      
      // Add video clip
      addToTimeline({ 
        id: `clip-${i}`,
        type: 'video',
        url, 
        duration: 10, 
        start: i * 10,
        transition: 'crossfade',
        prompt: fullPrompts[i]
      });

      // Add subtitle cue
      addToTimeline({
        id: `sub-${i}`,
        type: 'subtitle',
        text: cue.text,
        start: i * 10,
        end: i * 10 + 10,
        vttUrl: i === 0 ? vttUrl : undefined // only first needs vtt
      });

      // Voiceover - speak current cue every 6 clips (60s)
      if (i % 6 === 0) {
        const voiceText = cue.text;
        speakWithBrowser(voiceText);
        generateVoiceover(voiceText).then(audioUrl => {
          if (!audioUrl.startsWith('tts:')) {
            addToTimeline({
              id: `vo-${i}`,
              type: 'audio',
              url: audioUrl,
              start: i * 10,
              duration: 20,
              text: voiceText
            });
          }
        });
      }
    });

    setIsVO(false);
    
    // Final: Add full VTT track for export
    addToTimeline({
      id: 'full-subtitles',
      type: 'subtitle-track',
      url: vttUrl,
      vttContent: vtt,
      start: 0,
      duration: 600
    });
  };

  return (
    <div className="space-y-3 mt-4 p-3 border border-orange-500/30 rounded-xl bg-orange-950/20">
      <div className="text-xs font-bold text-orange-400 uppercase tracking-widest">InVideo Mode • 10 Min</div>
      <button
        disabled={isGenerating}
        onClick={handle10MinJollof}
        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3.5 px-4 rounded-lg hover:scale-[1.02] transition disabled:opacity-50 shadow-lg shadow-orange-900/30"
      >
        {isGenerating || isVO ? `🍚 Generating ${progress}% - ${currentStep}` : '🔥 Generate 10 Min Jollof (60 Clips + VO + Subs)'}
      </button>
      
      {script.length > 0 && (
        <div className="text-[11px] text-gray-300 max-h-32 overflow-y-auto bg-black/40 p-2 rounded">
          <div className="font-bold mb-1">Script ({script.length} cues):</div>
          {script.slice(0,5).map((s,i) => <div key={i} className="opacity-70">[{s.start}s] {s.text.slice(0,50)}...</div>)}
          <div className="opacity-50">... + {script.length - 5} more</div>
        </div>
      )}

      {isGenerating && (
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-orange-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
