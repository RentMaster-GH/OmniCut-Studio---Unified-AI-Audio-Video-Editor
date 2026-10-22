import React, { useState, useRef } from 'react';
import { useProject } from "../../context/ProjectContext";
import { Sparkles, Film, Clapperboard, RefreshCw } from 'lucide-react';

export const AIStudioGenerator: React.FC = () => {
  const { addClip } = useProject();
  const [prompt, setPrompt] = useState('person cooking jollof in ghana cinematic');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const FREE_PROXY = "https://pollinationaidecentralizedinference.vercel.app/api/generate";

  const handleGenerate = async () => {
    const input = prompt.trim();
    if (!input) return;
    
    setIsGenerating(true);
    setProgress(10);
    setVideoUrl(null);
    
    try {
      const res = await fetch(FREE_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: input, 
          model: 'flux',
          width: 1280, 
          height: 720 
        })
      });
      
      setProgress(70);
      const data = await res.json();
      console.log("Generated:", data);
      
      if (data.url) {
        setVideoUrl(data.url);
        setProgress(100);
        // Also add to timeline if you have addClip
        try {
          addClip?.({ id: `ai-${Date.now()}`, type: 'video', src: data.url, duration: 5, name: input.slice(0,30) } as any);
        } catch {}
      } else {
        alert("No URL: " + JSON.stringify(data));
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed: " + err.message);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="h-full flex bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-[380px] border-r border-zinc-800 p-5 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Clapperboard className="w-4 h-4" /></div>
          <div><h2 className="font-semibold text-[15px]">OmniCut Studio</h2><p className="text-[11px] text-emerald-400">FREE • No Key</p></div>
        </div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[13px]" />
        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-[14px] flex items-center justify-center gap-2">
          {isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> {progress.toFixed(0)}%</> : <><Sparkles className="w-4 h-4" /> Generate FREE</>}
        </button>
      </div>
      
      {/* THIS IS WHERE YOUR DIV GOES */}
      <div className="flex-1 flex bg-[#101010] items-center justify-center p-8">
        <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl aspect-video w-[85%] flex flex-col">
          {/* Header for Generated box */}
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">✨ Generated</h3>
            {isGenerating && <p className="text-[11px] text-zinc-400">Generating jollof... 🍚</p>}
          </div>
          
          {/* Content */}
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
            {videoUrl ? (
              <img 
                src={videoUrl} 
                alt="generated" 
                className="w-full h-full object-cover"
                onError={() => console.log("Image failed to load:", videoUrl)}
              />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse flex items-center justify-center">
                  <Film className="w-6 h-6" />
                </div>
                <p className="text-[13px]">{progress.toFixed(0)}% generating...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Clapperboard className="w-8 h-8 text-zinc-600" />
                <p className="text-[13px] text-zinc-500">Your image will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudioGenerator;