import { LongFormButton } from './LongFormButton';
import React, { useState, useRef } from 'react';
import { useProject } from "../../context/ProjectContext";
import { Sparkles, Film, Clapperboard, RefreshCw, Plus, Download, Play } from 'lucide-react';

export const AIStudioGenerator: React.FC = () => {
  console.log("FREE_PROXY active");
  const { addClip } = useProject();
  const [prompt, setPrompt] = useState('person cooking jollof in ghana cinematic');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const FREE_PROXY = "https://pollinationaidecentralizedinference.vercel.app/api/generate";

  const createVideoFromImage = async (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgSrc;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = 1280;
        canvas.height = 720;
        let frame = 0;
        const totalFrames = 150;
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(URL.createObjectURL(blob));
        };
        recorder.start();
        const animate = () => {
          frame++;
          const progress = frame / totalFrames;
          const scale = 1 + progress * 0.25;
          const xOffset = progress * -50;
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.save();
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.scale(scale, scale);
          ctx.translate(-canvas.width/2 + xOffset/2, -canvas.height/2);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          if (frame < totalFrames) requestAnimationFrame(animate);
          else recorder.stop();
        };
        animate();
      };
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setImageUrl(null);
    setVideoUrl(null);
    setStatus('Generating true motion video (veo)...');
    
    try {
      const res = await fetch(FREE_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          type: 'video',
          model: 'veo',
          duration: 5,
          aspectRatio: '16:9'
        })
      });
      const data = await res.json();
      if (!data.url) throw new Error('No video URL from gateway');
      
      // TRUE MOTION - Direct MP4 from Pollinations veo/seedance
      if (data.type === 'video' && data.isRealVideo) {
        setVideoUrl(data.url);
        setStatus('Real motion video ready! (veo)');
      } else {
        // Fallback to Ken Burns if gateway returns image
        setImageUrl(data.url);
        setStatus('Creating video with motion...');
        const vidUrl = await createVideoFromImage(data.url);
        setVideoUrl(vidUrl);
        setStatus('Video ready! (Ken Burns fallback)');
      }
      
    } catch (err: any) {
      setStatus(`Error: ${err.message}. Trying image fallback...`);
      // Last resort fallback to image
      try {
        const fallbackRes = await fetch(FREE_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, type: 'image', model: 'flux', width: 1280, height: 720 })
        });
        const fbData = await fallbackRes.json();
        if (fbData.url) {
          setImageUrl(fbData.url);
          const vidUrl = await createVideoFromImage(fbData.url);
          setVideoUrl(vidUrl);
          setStatus('Video ready via fallback');
        }
      } catch {}
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTimeline = () => {
    const url = videoUrl || imageUrl;
    if (!url) return;
    try {
      addClip?.({ 
        id: `ai-${Date.now()}`, 
        type: 'video', 
        src: url, 
        duration: 5, 
        name: prompt.slice(0,30) 
      } as any);
      setStatus('Added to timeline! ✓');
    } catch (e) { console.log(e); }
  };

  return (
    <div className="h-full w-full flex bg-[#0a0a0a] text-white overflow-hidden">
      <div className="w-[380px] min-w-[380px] border-r border-zinc-800 p-5 flex flex-col gap-5 overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><Clapperboard className="w-4 h-4" /></div>
          <div><h2 className="font-semibold text-[15px]">OmniCut Studio</h2><p className="text-[11px] text-emerald-400">TRUE MOTION • veo • 5s</p></div>
        </div>
        <div>
          <label className="text-[12px] text-zinc-400 mb-2 block">Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[13px] focus:border-violet-500 outline-none resize-none" placeholder="person cooking jollof in ghana cinematic, steam rising, 4k" />
        </div>
        <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-zinc-100 transition">
          {isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> {status}</> : <><Sparkles className="w-4 h-4" /> Generate TRUE Video</>}
        </button>
        {(imageUrl || videoUrl) && (
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
            <button onClick={handleAddToTimeline} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-[13px] flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add to Timeline (5s)</button>
            {videoUrl && <a href={videoUrl} download={`omnicut-${Date.now()}.mp4`} className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download Video</a>}
            {status && <p className="text-[11px] text-emerald-400 text-center">{status}</p>}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col bg-[#101010] min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
          <h3 className="text-[14px] font-semibold flex items-center gap-2"><Film className="w-4 h-4 text-violet-400" /> Generated Video</h3>
          {videoUrl && <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">TRUE MOTION • 5s</span>}
        </div>
        <div className="flex-1 p-6 flex items-center justify-center bg-[#0e0e0e] overflow-hidden">
          <div className="w-full max-w-[900px] aspect-video relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            {videoUrl ? <video src={videoUrl} autoPlay loop muted playsInline controls className="w-full h-full object-cover" /> : imageUrl ? <img src={imageUrl} alt="gen" className="w-full h-full object-cover" /> : isGenerating ? <div className="w-full h-full flex flex-col items-center justify-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 animate-pulse flex items-center justify-center"><Film className="w-7 h-7" /></div><p className="text-[13px] text-zinc-400">{status}</p></div> : <div className="w-full h-full flex flex-col items-center justify-center gap-3"><div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center"><Clapperboard className="w-6 h-6 text-zinc-500" /></div><p className="text-[13px] text-zinc-500">Your true motion video will appear here</p><p className="text-[11px] text-zinc-600">veo • seedance • ltx-2 • 5 seconds</p></div>}
            {videoUrl && <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px]"><Play className="w-3 h-3" /> Real Motion</div>}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
export default AIStudioGenerator;
