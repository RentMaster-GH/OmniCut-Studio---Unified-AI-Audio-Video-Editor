import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '@/ProjectContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Monitor,
  Smartphone,
  Square,
  Shield,
  Layers,
  Sparkles,
  Sliders,
  Settings,
} from 'lucide-react';
import { audioEngine } from '@/audioEngine';

export const VideoPlayerCanvas: React.FC = () => {
  const {
    currentTime,
    duration,
    isPlaying,
    play,
    pause,
    togglePlay,
    seek,
    stepFrame,
    aspectRatio,
    setAspectRatio,
    showSafeMargins,
    setShowSafeMargins,
    clips,
    captionStyle,
    colorGrading,
    isStudioSoundActive,
    masterVolume,
    setMasterVolume,
  } = useProject();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [showColorInspector, setShowColorInspector] = useState<boolean>(false);

  // Calculate container aspect ratio dimensions
  const getAspectRatioDimensions = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[520px]';
      case '1:1':
        return 'aspect-square max-h-[460px]';
      case '4:5':
        return 'aspect-[4/5] max-h-[480px]';
      case '21:9':
        return 'aspect-[21/9] max-h-[380px]';
      case '16:9':
      default:
        return 'aspect-[16/9] max-h-[440px]';
    }
  };

  // Convert seconds to SMPTE timecode HH:MM:SS:FF
  const formatTimecode = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    const frames = Math.floor((sec % 1) * 30);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames
      .toString()
      .padStart(2, '0')}`;
  };

  // Render composite video frame on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // 1. Identify active clips at current timecode
    const activeVideo = clips.find(
      c => c.trackId === 'track-v1' && currentTime >= c.start && currentTime <= c.start + c.duration
    );
    const activeOverlay = clips.find(
      c => c.trackId === 'track-v2' && currentTime >= c.start && currentTime <= c.start + c.duration
    );
    const activeCaption = clips.find(
      c => c.trackId === 'track-captions' && currentTime >= c.start && currentTime <= c.start + c.duration
    );

    // 2. Render Background Visual Simulation (Dynamic cinematic canvas background)
    ctx.save();

    // Color Grading adjustments
    const brightness = 1 + (colorGrading.brightness || 0) / 100;
    const contrast = 1 + (colorGrading.contrast || 0) / 100;
    const saturate = 1 + (colorGrading.saturation || 0) / 100;
    let filterString = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

    if (colorGrading.lut === 'cyber-neon') {
      filterString += ' hue-rotate(185deg) contrast(1.25)';
    } else if (colorGrading.lut === 'noir') {
      filterString += ' grayscale(100%) contrast(1.35)';
    } else if (colorGrading.lut === 'cinematic-teal') {
      filterString += ' hue-rotate(-15deg) contrast(1.15)';
    } else if (colorGrading.lut === 'warm-sunset') {
      filterString += ' sepia(35%) saturate(1.4)';
    }
    ctx.filter = filterString;

    // Draw background gradient / scene visualization
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (activeVideo?.visualTag === 'cyberpunk') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#020617');
    } else if (activeVideo?.visualTag === 'editing') {
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#030712');
    } else if (activeVideo?.visualTag === 'timeline') {
      grad.addColorStop(0, '#18181b');
      grad.addColorStop(0.5, '#27272a');
      grad.addColorStop(1, '#09090b');
    } else {
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#131b2e');
      grad.addColorStop(1, '#020617');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle moving cinematic grid / light beams
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1;
    const offset = (currentTime * 40) % 80;
    for (let x = -80 + offset; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Dynamic wave glow in the middle
    ctx.beginPath();
    ctx.strokeStyle = activeVideo?.color || '#3B82F6';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = activeVideo?.color || '#3B82F6';
    ctx.shadowBlur = 18;

    const midY = height * 0.45;
    ctx.moveTo(0, midY);
    for (let x = 0; x < width; x += 15) {
      const wave = Math.sin(x * 0.02 + currentTime * 3.5) * 22 * (isPlaying ? 1.4 : 0.4);
      ctx.lineTo(x, midY + wave);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Vignette layer
    if (colorGrading.vignette > 0) {
      const vigRadius = Math.max(width, height) * 0.75;
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        vigRadius * 0.4,
        width / 2,
        height / 2,
        vigRadius
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${colorGrading.vignette / 100})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    // 4. Overlays & B-Roll Graphic layer (V2)
    if (activeOverlay) {
      ctx.save();
      ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.fillRect(width * 0.08, height * 0.12, width * 0.84, height * 0.25);
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 2;
      ctx.strokeRect(width * 0.08, height * 0.12, width * 0.84, height * 0.25);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`⚡ ${activeOverlay.title}`, width * 0.12, height * 0.24);
      ctx.restore();
    }

    // 5. Scene Primary Title Card / Text
    if (activeVideo?.text) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 28px Syne, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillText(activeVideo.text, width / 2, height * 0.38);
      ctx.restore();
    }

    // 6. VEED.io Dynamic Captions & Subtitles
    if (activeCaption?.text) {
      ctx.save();
      const cap = captionStyle;
      const textToRender = cap.uppercase ? activeCaption.text.toUpperCase() : activeCaption.text;

      ctx.font = `800 ${cap.fontSize || 34}px ${cap.fontFamily || 'Syne, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const posX = width / 2;
      const posY = (height * (cap.positionY || 80)) / 100;

      // Measure text width for background container
      const metrics = ctx.measureText(textToRender);
      const textWidth = metrics.width;
      const pad = cap.backgroundPadding || 14;

      // Draw caption background box
      if (cap.backgroundColor && cap.backgroundColor !== 'transparent') {
        ctx.fillStyle = cap.backgroundColor;
        const boxX = posX - textWidth / 2 - pad;
        const boxY = posY - 24 - pad / 2;
        const boxW = textWidth + pad * 2;
        const boxH = 48 + pad;
        const radius = cap.borderRadius || 8;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
        ctx.fill();
      }

      // Stroke outline
      if (cap.strokeWidth > 0) {
        ctx.strokeStyle = cap.strokeColor || '#000000';
        ctx.lineWidth = cap.strokeWidth;
        ctx.strokeText(textToRender, posX, posY);
      }

      // Fill text
      ctx.fillStyle = cap.highlightColor || '#FACC15';
      ctx.fillText(textToRender, posX, posY);
      ctx.restore();
    }

    // 7. VEED.io Progress Bar Indicator at bottom
    ctx.save();
    const progressPct = duration > 0 ? currentTime / duration : 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, height - 6, width, 6);

    const progGrad = ctx.createLinearGradient(0, 0, width * progressPct, 0);
    progGrad.addColorStop(0, '#3B82F6');
    progGrad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = progGrad;
    ctx.fillRect(0, height - 6, width * progressPct, 6);
    ctx.restore();

    // 8. Safe Margins overlay guide (for TikTok, YouTube Shorts, TV safe)
    if (showSafeMargins) {
      ctx.save();
      // Action Safe (90%)
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);

      // Title Safe (80%)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);

      // Mobile/TikTok right-side UI warning area
      if (aspectRatio === '9:16') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(width * 0.8, height * 0.45, width * 0.18, height * 0.4);
        ctx.fillStyle = '#EF4444';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('TikTok Icons Safe Area', width * 0.82, height * 0.44);
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText('TITLE SAFE (80%)', width * 0.11, height * 0.13);
      ctx.restore();
    }
  }, [currentTime, duration, clips, captionStyle, colorGrading, showSafeMargins, aspectRatio, isPlaying]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl transition-all"
    >
      {/* Top player HUD bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-400 select-none backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-zinc-500">/</span>
          <span className="font-mono text-zinc-400">{formatTimecode(duration)}</span>

          {isStudioSoundActive && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded font-medium">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              Studio Sound AI
            </span>
          )}
        </div>

        {/* Aspect Ratio & Safe Margins Tools */}
        <div className="flex items-center gap-1.5">
          {/* Aspect switcher */}
          <div className="flex items-center bg-zinc-800/80 rounded-lg p-0.5 border border-zinc-700/60">
            <button
              onClick={() => setAspectRatio('16:9')}
              title="16:9 Landscape (YouTube/Premiere)"
              className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${
                aspectRatio === '16:9'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              16:9
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              title="9:16 Vertical (TikTok/Reels/Shorts)"
              className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${
                aspectRatio === '9:16'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              9:16
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              title="1:1 Square (Social Feed)"
              className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${
                aspectRatio === '1:1'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Square className="w-3 h-3" />
              1:1
            </button>
          </div>

          {/* Safe Margins toggle */}
          <button
            onClick={() => setShowSafeMargins(!showSafeMargins)}
            title="Toggle Safe Margins & Social UI Guide"
            className={`p-1.5 rounded-lg border transition ${
              showSafeMargins
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
          </button>

          {/* Color Inspector Quick Toggle */}
          <button
            onClick={() => setShowColorInspector(!showColorInspector)}
            title="Premiere Color Grading Quick Controls"
            className={`p-1.5 rounded-lg border transition ${
              showColorInspector
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative w-full flex items-center justify-center p-2 bg-zinc-950/90 overflow-hidden">
        <div className={`relative ${getAspectRatioDimensions()} w-full flex items-center justify-center`}>
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full object-contain rounded-lg shadow-2xl bg-black border border-zinc-800/50 cursor-pointer"
            onClick={togglePlay}
          />

          {/* Play/Pause Overlay indicator on hover or pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-auto p-4 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-xl backdrop-blur-md transition-transform transform hover:scale-110 active:scale-95"
            >
              <Play className="w-7 h-7 fill-white ml-0.5" />
            </button>
          )}

          {/* Quick Color LUT badge */}
          <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-300 border border-zinc-700/60 font-mono">
            LUT: {colorGrading.lut.replace('-', ' ').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Quick Color Grading Drawer if toggled */}
      {showColorInspector && (
        <div className="w-full bg-zinc-900/95 border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-300 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-zinc-400 font-medium">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Color Grading:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">LUT:</span>
            <select
              value={colorGrading.lut}
              onChange={e =>
                useProject().setColorGrading(prev => ({
                  ...prev,
                  lut: e.target.value as any,
                }))
              }
              className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-0.5 text-xs"
            >
              <option value="none">None (Rec.709)</option>
              <option value="cinematic-teal">Cinematic Teal & Orange</option>
              <option value="cyber-neon">Cyber Neon Vivid</option>
              <option value="kodachrome">Vintage Kodachrome</option>
              <option value="noir">B&W Film Noir</option>
              <option value="clean-hdr">Clean Studio HDR</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Contrast:</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorGrading.contrast}
              onChange={e =>
                useProject().setColorGrading(prev => ({
                  ...prev,
                  contrast: parseInt(e.target.value, 10),
                }))
              }
              className="w-20 accent-blue-500 h-1"
            />
            <span className="font-mono text-[10px] text-zinc-400">{colorGrading.contrast}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Saturation:</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorGrading.saturation}
              onChange={e =>
                useProject().setColorGrading(prev => ({
                  ...prev,
                  saturation: parseInt(e.target.value, 10),
                }))
              }
              className="w-20 accent-blue-500 h-1"
            />
            <span className="font-mono text-[10px] text-zinc-400">{colorGrading.saturation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Vignette:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={colorGrading.vignette}
              onChange={e =>
                useProject().setColorGrading(prev => ({
                  ...prev,
                  vignette: parseInt(e.target.value, 10),
                }))
              }
              className="w-20 accent-blue-500 h-1"
            />
            <span className="font-mono text-[10px] text-zinc-400">{colorGrading.vignette}%</span>
          </div>
        </div>
      )}

      {/* Bottom Transport Controls Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border-t border-zinc-800 text-zinc-300">
        <div className="flex items-center gap-2">
          {/* Step back 1 frame */}
          <button
            onClick={() => stepFrame(-1)}
            title="Step Back 1 Frame (J)"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause toggle */}
          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Step forward 1 frame */}
          <button
            onClick={() => stepFrame(1)}
            title="Step Forward 1 Frame (L)"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Scrubber Slider */}
        <div className="flex-1 max-w-lg mx-4 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration}
            step="0.05"
            value={currentTime}
            onChange={e => seek(parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Master Volume & Quick Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMasterVolume(masterVolume === 0 ? 0.85 : 0)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            title={masterVolume === 0 ? 'Unmute' : 'Mute'}
          >
            {masterVolume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={e => setMasterVolume(parseFloat(e.target.value))}
            className="w-16 accent-blue-500 h-1 bg-zinc-800 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
