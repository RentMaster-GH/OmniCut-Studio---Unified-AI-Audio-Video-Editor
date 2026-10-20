import React, { useState, useEffect, useRef } from 'react';
import { useProject } from "../../context/ProjectContext";
import {
  Sparkles, Film, Wand2, Image as ImageIcon, Video, 
  Mic, Layout, Upload, Settings2, Zap, Layers, Type, Music2,
  Clapperboard, Lightbulb, RefreshCw, Download
} from 'lucide-react';

export type EngineMode = 'text-to-video' | 'image-to-video' | 'video-to-video' | 'script-to-video' | 'ugc-avatar';
export type AIModel = 'runway-gen4' | 'luma-dream' | 'pika-2.0' | 'sora-turbo' | 'kling-2.0';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

const MODELS = [
  { id: 'runway-gen4', name: 'Runway Gen-4 Turbo', badge: 'FAST', desc: 'Best for cinematic' },
  { id: 'luma-dream', name: 'Luma Dream Machine', badge: 'REAL', desc: 'Photoreal motion' },
  { id: 'pika-2.0', name: 'Pika 2.0', badge: 'STYLE', desc: 'Stylized & anime' },
  { id: 'sora-turbo', name: 'Sora Turbo', badge: 'NEW', desc: 'Long-form 60s' },
  { id: 'kling-2.0', name: 'Kling 2.0', badge: 'PRO', desc: 'Complex physics' },
] as const;

const STYLES = ['Cinematic', 'Photorealistic', 'Anime', '3D Render', 'Vintage Film', 'Cyberpunk', 'Documentary', 'UGC iPhone', 'Stock Footage'];
const VOICES = ['Aria - Warm Female', 'Adam - Deep Male', 'Bella - Gen-Z', 'Sam - UGC Creator', 'David - Documentary'];

export const AIStudioGenerator: React.FC = () => {
  const { addClip } = useProject();
  const [mode, setMode] = useState<EngineMode>('text-to-video');
  const [model, setModel] = useState<AIModel>('runway-gen4');
  const [prompt, setPrompt] = useState('video of a woman cooking jollof in ghana cinematic');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState(5);
  const [style, setStyle] = useState('Cinematic');
  const [voice, setVoice] = useState(VOICES[0]);
  const [autoBroll, setAutoBroll] = useState(true);
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [autoMusic, setAutoMusic] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const enhancePrompt = () => {
    if (!prompt) return;
    setEnhancedPrompt(`${prompt}, ${style.toLowerCase()} style, ultra-detailed, 8k, dynamic camera movement: slow dolly in, soft natural lighting, cinematic lighting, shallow depth of field, high motion fidelity, no flicker, smooth 24fps, professional color grading`);
  };
  useEffect(() => { if (prompt.length > 20) enhancePrompt(); }, [style]);

    const handleGenerate = async () => {
    if (!prompt.trim()) return alert('Enter prompt');
    setIsGenerating(true);
    setProgress(10);
    setVideoUrl(null);
    const t = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 1000);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enhancedPrompt || prompt, aspect, duration })
      });
      
      const data = await res.json();
      console.log('API response:', data);
      
      if (!res.ok) throw new Error(data.error || 'Generate failed');
      
      clearInterval(t);
      setProgress(100);
      
      const finalUrl = data.proxyUrl;
      if (!finalUrl) throw new Error('No proxyUrl returned');

      console.log('Using proxy URL:', finalUrl);
      setVideoUrl(finalUrl);
      
      addClip?.({ 
        id: `ai-${Date.now()}`, 
        type: 'video', 
        src: finalUrl, 
        duration, 
        name: prompt.slice(0,30) 
      } as any);
      
    } catch(e:any) {
      clearInterval(t);
      alert(`Failed: ${e.message}`);
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-[380px] border-r border-zinc-800 p-5 overflow-y-auto flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Clapperboard className="w-4 h-4" /></div>
          <div><h2 className="font-semibold text-[15px]">InVideo AI Studio</h2><p className="text-[11px] text-zinc-500">v2.0 • OmniCut Engine</p></div>
          <div className="ml-auto px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[10px]">PRO</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ id: 'text-to-video', label: 'Text → Video', icon: Type },{ id: 'image-to-video', label: 'Image → Video', icon: ImageIcon },{ id: 'script-to-video', label: 'Script → Video', icon: Film },{ id: 'video-to-video', label: 'Video → Video', icon: Video },{ id: 'ugc-avatar', label: 'UGC Avatar', icon: Mic },].map(m => (
            <button key={m.id} onClick={() => setMode(m.id as any)} className={`p-3 rounded-xl border text-[11px] flex flex-col items-center gap-1.5 transition ${mode === m.id ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}><m.icon className="w-4 h-4" />{m.label}</button>
          ))}
        </div>
        <div>
          <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Zap className="w-3 h-3" /> Engine Model</label>
          <div className="space-y-2">{MODELS.map(m => (<button key={m.id} onClick={() => setModel(m.id as AIModel)} className={`w-full text-left p-3 rounded-xl border flex justify-between items-center transition ${model === m.id ? 'bg-zinc-800 border-violet-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'}`}><div><div className="text-[13px] font-medium flex items-center gap-2">{m.name} <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-700">{m.badge}</span></div><div className="text-[11px] text-zinc-500">{m.desc}</div></div><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${model === m.id ? 'border-violet-500' : 'border-zinc-700'}`}>{model === m.id && <div className="w-2 h-2 rounded-full bg-violet-500" />}</div></button>))}</div>
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">Prompt</label>
          <div className="relative"><textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[13px] resize-none focus:outline-none focus:border-violet-500/50" /><button onClick={enhancePrompt} className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-zinc-800 text-[11px] flex items-center gap-1 hover:bg-zinc-700"><Wand2 className="w-3 h-3" /> Enhance</button></div>
          {enhancedPrompt && (<div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20"><div className="text-[10px] text-violet-300 uppercase tracking-widest mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Enhanced Prompt</div><div className="text-[12px] text-zinc-300 leading-relaxed">{enhancedPrompt}</div></div>)}
          <input value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} placeholder="Negative prompt: blurry, low quality, deformed..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-[12px] focus:outline-none focus:border-zinc-700" />
        </div>
        {mode !== 'text-to-video' && (
          <div className="border border-dashed border-zinc-700 rounded-xl p-4 text-center">
            {referenceImage ? <img src={referenceImage} className="w-full h-32 object-cover rounded-lg" /> : (<><Upload className="w-6 h-6 mx-auto text-zinc-600 mb-2" /><p className="text-[12px] text-zinc-400">Drop reference image/video</p></>)}
            <input type="file" accept="image/*,video/*" className="hidden" id="ref" onChange={e => { const file = e.target.files?.[0]; if (file) setReferenceImage(URL.createObjectURL(file)); }} />
            <label htmlFor="ref" className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-white text-black text-[12px] cursor-pointer">Browse</label>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] text-zinc-500 uppercase">Aspect</label><select value={aspect} onChange={e => setAspect(e.target.value as any)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[13px]"><option>16:9</option><option>9:16</option><option>1:1</option><option>21:9</option></select></div>
          <div><label className="text-[10px] text-zinc-500 uppercase">Duration</label><select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[13px]"><option value={5}>5s - Bumper</option><option value={10}>10s - Short</option><option value={20}>20s - Story</option></select></div>
          <div><label className="text-[10px] text-zinc-500 uppercase">Style</label><select value={style} onChange={e => setStyle(e.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[13px]">{STYLES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="text-[10px] text-zinc-500 uppercase">Voice</label><select value={voice} onChange={e => setVoice(e.target.value)} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-[13px]">{VOICES.map(v => <option key={v}>{v}</option>)}</select></div>
        </div>
        <div className="space-y-2">{[{ label: 'Auto B-roll', value: autoBroll, set: setAutoBroll, icon: Layers },{ label: 'Auto Captions (Hormozi)', value: autoCaptions, set: setAutoCaptions, icon: Type },{ label: 'Auto Music + SFX', value: autoMusic, set: setAutoMusic, icon: Music2 },].map(t => (<label key={t.label} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[12px] cursor-pointer"><span className="flex items-center gap-2"><t.icon className="w-3.5 h-3.5 text-zinc-500" /> {t.label}</span><input type="checkbox" checked={t.value} onChange={e => t.set(e.target.checked)} className="accent-violet-500" /></label>))}</div>
        <button onClick={handleGenerate} disabled={!prompt || isGenerating} className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 transition">{isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating {progress.toFixed(0)}%</> : <><Sparkles className="w-4 h-4" /> Generate Video</>}</button>
        {isGenerating && (<div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div>)}
      </div>

      {/* RIGHT - Preview - THIS IS THE PLACE YOU ASKED */}
      <div className="flex-1 flex flex-col bg-[#101010]">
        <div className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2 text-[12px] text-zinc-400"><Layout className="w-4 h-4" /> Preview • {aspect} • {duration}s • {model}</div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-zinc-900 border border-zinc-800"><Download className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg bg-zinc-900 border border-zinc-800"><Settings2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className={`relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl ${aspect === '9:16' ? 'aspect-[9/16] h-[70%]' : aspect === '1:1' ? 'aspect-square w-[60%]' : 'aspect-video w-[85%]'}`}>
            {/* >>> YOUR BLOCK IS NOW CORRECTLY HERE <<< */}
            {videoUrl ? (
              <video ref={videoRef} src={videoUrl} controls autoPlay loop playsInline className="w-full h-full object-cover bg-black" onError={(e)=>{ console.error('Video failed', videoUrl); }} />
            ) : isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse flex items-center justify-center"><Film className="w-8 h-8" /></div>
                <p className="text-[14px]">Dreaming up your video... {progress.toFixed(0)}%</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Clapperboard className="w-8 h-8 text-zinc-600" />
                <p className="text-[13px] text-zinc-500">Your video will appear here</p>
              </div>
            )}
            {/* >>> END BLOCK <<< */}
          </div>
        </div>

        <div className="h-24 border-t border-zinc-800 p-3 flex gap-2 overflow-x-auto">
          {[1,2,3,4].map(i => (
            <div key={i} className="min-w-[160px] h-full rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex flex-col justify-between">
              <div className="text-[10px] text-zinc-500">Scene {i}</div>
              <div className="text-[11px] text-zinc-300 truncate">{prompt ? prompt.slice(0,20) : `Auto B-roll ${i}`}</div>
              <div className="h-1 bg-zinc-800 rounded-full"><div className="h-full bg-white rounded-full" style={{width: `${i*25}%`}} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};