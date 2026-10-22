import React, { useState } from 'react';
import { useProject } from "../../context/ProjectContext";
import { Sparkles, Film, Clapperboard, RefreshCw } from 'lucide-react';

export const AIStudioGenerator: React.FC = () => {
  const { addClip } = useProject();
  const [prompt, setPrompt] = useState('person cooking jollof in ghana cinematic');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const FREE_PROXY = "https://pollinationaidecentralizedinference.vercel.app/api/generate";

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const res = await fetch(FREE_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'flux', width: 1280, height: 720 })
      });
      const data = await res.json();
      console.log(data);
      if (data.url) setVideoUrl(data.url);
      else alert(JSON.stringify(data));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-[380px] border-r border-zinc-800 p-5 flex flex-col gap-6">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Clapperboard className="w-4 h-4" /></div><div><h2 className="font-semibold text-[15px]">OmniCut Studio</h2><p className="text-[11px] text-emerald-400">FREE • No Key</p></div></div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[13px]" />
        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-[14px] flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" />{isGenerating ? 'Generating...' : 'Generate FREE'}</button>
      </div>
      <div className="flex-1 flex flex-col bg-[#101010] p-6">
        <h3 className="text-[14px] font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generated</h3>
        <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden">
          {videoUrl ? <img src={videoUrl} alt="gen" className="w-full h-full object-contain" /> : isGenerating ? <><RefreshCw className="w-8 h-8 animate-spin text-zinc-600" /></> : <p className="text-zinc-500 text-sm">Your image will appear here</p>}
        </div>
      </div>
    </div>
  );
};
export default AIStudioGenerator;
