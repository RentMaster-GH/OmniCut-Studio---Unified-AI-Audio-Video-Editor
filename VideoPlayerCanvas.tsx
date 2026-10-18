import React, { useRef, useEffect, useState } from 'react';
import { useProject } from "./ProjectContext";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Monitor, Smartphone, Square, Shield, Sliders, Sparkles, Film,
} from 'lucide-react';
import { ColorGrading } from "./types";

const imageCache = new Map<string, HTMLImageElement>();

function getCssFilter(cg: ColorGrading): string {
  return `contrast(${100 + (cg.contrast || 0)}%) saturate(${100 + (cg.saturation || 0)}%) brightness(${100 + (cg.exposure || 0)}%)`;
}

function drawLiveGenerativeScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  prompt: string,
  visualTag: string,
  isPlaying: boolean,
  imageSrc?: string
) {
  if (imageSrc) {
    let img = imageCache.get(imageSrc);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      imageCache.set(imageSrc, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const zoom = 1.1 + Math.sin(time * 0.05) * 0.1;
      const panX = Math.cos(time * 0.02) * 20;
      const panY = Math.sin(time * 0.03) * 10;
      ctx.translate(w / 2 + panX, h / 2 + panY);
      ctx.scale(zoom, zoom);
      const r = img.naturalWidth / img.naturalHeight;
      let dw = w;
      let dh = h;
      if (r > w / h) dw = h * r;
      else dh = w / r;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      return;
    }
  }

  // Fallback generative while image loads
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3f3f46';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`GENERATING: ${prompt.slice(0, 40)}`, w / 2, h / 2);
}

export const VideoPlayerCanvas: React.FC = () => {
  const {
    currentTime, duration, isPlaying, togglePlay, seek, stepFrame,
    aspectRatio, setAspectRatio, showSafeMargins, setShowSafeMargins,
    clips, captionStyle, colorGrading, setColorGrading,
    isStudioSoundActive, masterVolume, setMasterVolume,
  } = useProject();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showColorInspector, setShowColorInspector] = useState(false);

  const activeVideo = clips.find(
    c => c.trackId === 'track-v1' && currentTime >= c.start && currentTime <= c.start + c.duration
  );

  const getAspectRatioDimensions = () => {
    switch (aspectRatio) {
      case '9:16': return 'aspect-[9/16] max-h-[520px]';
      case '1:1': return 'aspect-square max-h-[460px]';
      case '4:5': return 'aspect-[4/5] max-h-[480px]';
      case '21:9': return 'aspect-[21/9] max-h-[380px]';
      default: return 'aspect-[16/9] max-h-[440px]';
    }
  };

  const formatTimecode = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const f = Math.floor((sec % 1) * 30);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    const activeOverlay = clips.find(c => c.trackId === 'track-v2' && currentTime >= c.start && currentTime <= c.start + c.duration);
    const activeCaption = clips.find(c => c.trackId === 'track-captions' && currentTime >= c.start && currentTime <= c.start + c.duration);

    drawLiveGenerativeScene(
      ctx, width, height, currentTime,
      activeVideo?.prompt || activeVideo?.title || 'OmniCut Studio AI Scene',
      activeVideo?.visualTag || activeVideo?.prompt || 'generative',
      isPlaying,
      activeVideo?.imageSrc
    );

    if (colorGrading.vignette > 0) {
      ctx.save();
      const vigRadius = Math.max(width, height) * 0.75;
      const vig = ctx.createRadialGradient(width / 2, height / 2, vigRadius * 0.4, width / 2, height / 2, vigRadius);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${colorGrading.vignette / 100})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    if (activeOverlay) {
      ctx.save();
      ctx.fillStyle = 'rgba(236,72,153,0.2)';
      ctx.fillRect(width * 0.08, height * 0.1, width * 0.84, height * 0.18);
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(width * 0.08, height * 0.1, width * 0.84, height * 0.18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 10;
      ctx.fillText(`⚡ ${activeOverlay.title}`, width * 0.12, height * 0.21);
      ctx.restore();
    }

    if (activeVideo?.text) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 28px Syne, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 16;
      ctx.fillText(activeVideo.text, width / 2, height * 0.36);
      ctx.restore();
    }

    if (activeCaption?.text) {
      ctx.save();
      const cap = captionStyle;
      const textToRender = cap.uppercase ? activeCaption.text.toUpperCase() : activeCaption.text;
      ctx.font = `800 ${cap.fontSize || 36}px ${cap.fontFamily || 'Syne, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const posX = width / 2;
      const posY = (height * (cap.positionY || 80)) / 100;
      const metrics = ctx.measureText(textToRender);
      const textWidth = metrics.width;
      const pad = cap.backgroundPadding || 16;
      if (cap.backgroundColor && cap.backgroundColor !== 'transparent') {
        ctx.fillStyle = cap.backgroundColor;
        const boxX = posX - textWidth / 2 - pad;
        const boxY = posY - 26 - pad / 2;
        const boxW = textWidth + pad * 2;
        const boxH = 52 + pad;
        const radius = cap.borderRadius || 8;
        ctx.beginPath();
        // @ts-ignore
        if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, radius);
        else ctx.rect(boxX, boxY, boxW, boxH);
        ctx.fill();
      }
      if (cap.strokeWidth > 0) {
        ctx.strokeStyle = cap.strokeColor || '#000000';
        ctx.lineWidth = cap.strokeWidth;
        ctx.strokeText(textToRender, posX, posY);
      }
      ctx.fillStyle = cap.highlightColor || '#FACC15';
      ctx.fillText(textToRender, posX, posY);
      ctx.restore();
    }

    ctx.save();
    const progressPct = duration > 0 ? currentTime / duration : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, height - 6, width, 6);
    const progGrad = ctx.createLinearGradient(0, 0, width * progressPct, 0);
    progGrad.addColorStop(0, '#3B82F6');
    progGrad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = progGrad;
    ctx.fillRect(0, height - 6, width * progressPct, 6);
    ctx.restore();

    if (showSafeMargins) {
      ctx.save();
      ctx.strokeStyle = 'rgba(234,179,8,0.6)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);
      ctx.strokeStyle = 'rgba(59,130,246,0.6)';
      ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
      ctx.restore();
    }
  }, [currentTime, duration, clips, captionStyle, colorGrading, showSafeMargins, aspectRatio, isPlaying, activeVideo]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl">
      <div className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-400 select-none backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-zinc-500">/</span>
          <span className="font-mono text-zinc-400">{formatTimecode(duration)}</span>
          {isStudioSoundActive && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded font-medium">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> Studio Sound AI
            </span>
          )}
          {activeVideo && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-950/50 border border-purple-800/50 px-2 py-0.5 rounded truncate max-w-[200px]">
              <Film className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate">{activeVideo.title}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-zinc-800/80 rounded-lg p-0.5 border border-zinc-700/60">
            <button onClick={() => setAspectRatio('16:9')} className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${aspectRatio === '16:9' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'}`}>
              <Monitor className="w-3 h-3" /> 16:9
            </button>
            <button onClick={() => setAspectRatio('9:16')} className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${aspectRatio === '9:16' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'}`}>
              <Smartphone className="w-3 h-3" /> 9:16
            </button>
            <button onClick={() => setAspectRatio('1:1')} className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${aspectRatio === '1:1' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'}`}>
              <Square className="w-3 h-3" /> 1:1
            </button>
          </div>
          <button onClick={() => setShowSafeMargins(!showSafeMargins)} className={`p-1.5 rounded-lg border transition ${showSafeMargins ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-white'}`}>
            <Shield className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowColorInspector(!showColorInspector)} className={`p-1.5 rounded-lg border transition ${showColorInspector ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-white'}`}>
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full flex items-center justify-center p-2 bg-zinc-950/90 overflow-hidden">
        <div className={`relative ${getAspectRatioDimensions()} w-full flex items-center justify-center bg-black rounded-lg overflow-hidden border border-zinc-800/80 shadow-2xl`}>
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full object-contain cursor-pointer z-10"
            onClick={togglePlay}
            style={{ filter: getCssFilter(colorGrading) }}
          />
          {!isPlaying && (
            <button onClick={togglePlay} className="absolute inset-auto p-4 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-xl backdrop-blur-md transition-transform transform hover:scale-110 active:scale-95 z-20">
              <Play className="w-7 h-7 fill-white ml-0.5" />
            </button>
          )}
          <div className="absolute top-3 left-3 bg-zinc-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-300 border border-zinc-700/60 font-mono z-20">
            LUT: {colorGrading.lut.replace('-', ' ').toUpperCase()} • LIFE-LIKE AI
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <div className="flex items-center gap-1.5 bg-zinc-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-emerald-400 border border-emerald-800/60 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIFE-LIKE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border-t border-zinc-800 text-zinc-300">
        <div className="flex items-center gap-2">
          <button onClick={() => stepFrame(-1)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"><SkipBack className="w-4 h-4" /></button>
          <button onClick={togglePlay} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition flex items-center justify-center">
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
          <button onClick={() => stepFrame(1)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"><SkipForward className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 max-w-lg mx-4 flex items-center gap-2">
          <input type="range" min="0" max={duration} step="0.05" value={currentTime} onChange={e => seek(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMasterVolume(masterVolume === 0 ? 0.85 : 0)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition">
            {masterVolume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={masterVolume} onChange={e => setMasterVolume(parseFloat(e.target.value))} className="w-16 accent-blue-500 h-1 bg-zinc-800 rounded cursor-pointer" />
        </div>
      </div>
    </div>
  );
};
