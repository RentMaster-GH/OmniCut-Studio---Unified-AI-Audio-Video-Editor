import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProject } from "./ProjectContext";
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
  Film,
} from 'lucide-react';
import { drawLiveGenerativeScene } from "./videoLibrary";
import { audioManager } from "./audioManager";
import { ColorGrading } from "./types";

function getCssFilter(colorGrading: ColorGrading): string {
  const brightness = 1 + (colorGrading.brightness || 0) / 100;
  const contrast = 1 + (colorGrading.contrast || 0) / 100;
  const saturate = 1 + (colorGrading.saturation || 0) / 100;
  let filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  if (colorGrading.lut === 'cyber-neon') {
    filter += ' hue-rotate(185deg) contrast(1.25)';
  } else if (colorGrading.lut === 'noir') {
    filter += ' grayscale(100%) contrast(1.35)';
  } else if (colorGrading.lut === 'cinematic-teal') {
    filter += ' hue-rotate(-15deg) contrast(1.15)';
  } else if (colorGrading.lut === 'warm-sunset') {
    filter += ' sepia(35%) saturate(1.4)';
  } else if (colorGrading.lut === 'clean-hdr') {
    filter += ' contrast(1.1) saturate(1.15)';
  } else if (colorGrading.lut === 'kodachrome') {
    filter += ' sepia(20%) saturate(1.3) contrast(1.1)';
  }
  return filter;
}

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
    setColorGrading,
    isStudioSoundActive,
    masterVolume,
    setMasterVolume,
  } = useProject();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSrcRef = useRef<string>('');
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [showColorInspector, setShowColorInspector] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);

  // Identify active video on Primary Track V1 at current playhead
  const activeVideo = clips.find(
    c => c.trackId === 'track-v1' && currentTime >= c.start && currentTime <= c.start + c.duration
  );

  // Sync active video playback and ensure sound is audible through unified audio manager
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Route media element through unified audioManager singleton
    audioManager.routeAIGeneratedVideo(
      video,
      activeVideo?.trackId || 'track-v1',
      activeVideo?.volume ?? 1,
      !!activeVideo?.muted
    );

    if (activeVideo?.src) {
      if (activeSrcRef.current !== activeVideo.src) {
        activeSrcRef.current = activeVideo.src;
        video.src = activeVideo.src;
        video.load();
      }

      const clipLocalTime = Math.max(0, currentTime - activeVideo.start);
      // Avoid continuous seek calls during normal 60fps playback; only correct noticeable drift
      if (Math.abs(video.currentTime - clipLocalTime) > 0.8 || !isPlaying) {
        video.currentTime = clipLocalTime;
      }

      if (isPlaying && video.paused) {
        video.play().catch(err => {
          // If browser restricts unmuted autoplay, try muted once and prompt user
          if (video.muted === false) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      } else if (!isPlaying && !video.paused) {
        video.pause();
      }
    } else {
      if (!video.paused) video.pause();
      if (activeSrcRef.current !== '') {
        activeSrcRef.current = '';
        video.removeAttribute('src');
      }
    }
  }, [activeVideo?.src, currentTime, isPlaying, masterVolume, activeVideo?.volume, activeVideo?.muted, activeVideo?.start]);

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

  // Render composite video overlays, smart captions, safe margins & generative visuals on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Identify active clips at current timecode
    const activeOverlay = clips.find(
      c => c.trackId === 'track-v2' && currentTime >= c.start && currentTime <= c.start + c.duration
    );
    const activeCaption = clips.find(
      c => c.trackId === 'track-captions' && currentTime >= c.start && currentTime <= c.start + c.duration
    );

        // 2. Base layer
    if (activeVideo?.src) {
      // ALWAYS show real video if src exists - don't wait for isVideoLoaded
      ctx.clearRect(0, 0, width, height);
    } else {
      drawLiveGenerativeScene(
        ctx,
        width,
        height,
        currentTime,
        activeVideo?.prompt || activeVideo?.title || 'OmniCut Studio AI Scene',
        activeVideo?.visualTag || 'cyberpunk',
        isPlaying,
        activeVideo?.imageSrc
      );
    }

    // 3. Vignette layer
    if (colorGrading.vignette > 0) {
      ctx.save();
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
      ctx.restore();
    }

    // 4. Overlays & B-Roll Graphic layer (V2)
    if (activeOverlay) {
      ctx.save();
      ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
      ctx.fillRect(width * 0.08, height * 0.1, width * 0.84, height * 0.18);
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(width * 0.08, height * 0.1, width * 0.84, height * 0.18);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 10;
      ctx.fillText(`⚡ ${activeOverlay.title}`, width * 0.12, height * 0.21);
      ctx.restore();
    }

    // 5. Scene Primary Title Card / Text
    if (activeVideo?.text) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 28px Syne, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 16;
      ctx.fillText(activeVideo.text, width / 2, height * 0.36);
      ctx.restore();
    }

    // 6. VEED.io Dynamic Captions & Subtitles
    if (activeCaption?.text) {
      ctx.save();
      const cap = captionStyle;
      const textToRender = cap.uppercase ? activeCaption.text.toUpperCase() : activeCaption.text;

      ctx.font = `800 ${cap.fontSize || 36}px ${cap.fontFamily || 'Syne, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const posX = width / 2;
      const posY = (height * (cap.positionY || 80)) / 100;

      // Measure text width for background container
      const metrics = ctx.measureText(textToRender);
      const textWidth = metrics.width;
      const pad = cap.backgroundPadding || 16;

      // Draw caption background box
      if (cap.backgroundColor && cap.backgroundColor !== 'transparent') {
        ctx.fillStyle = cap.backgroundColor;
        const boxX = posX - textWidth / 2 - pad;
        const boxY = posY - 26 - pad / 2;
        const boxW = textWidth + pad * 2;
        const boxH = 52 + pad;
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
  }, [currentTime, duration, clips, captionStyle, colorGrading, showSafeMargins, aspectRatio, isPlaying, isVideoLoaded, activeVideo?.src, activeVideo?.title, activeVideo?.text, activeVideo?.visualTag]);

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

          {activeVideo && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-purple-300 bg-purple-950/50 border border-purple-800/50 px-2 py-0.5 rounded truncate max-w-[200px]">
              <Film className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate">{activeVideo.title}</span>
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

      {/* Main Video Viewport: Real native HTML5 Video layer + High-Fidelity Canvas Overlay */}
      <div className="relative w-full flex items-center justify-center p-2 bg-zinc-950/90 overflow-hidden">
        <div className={`relative ${getAspectRatioDimensions()} w-full flex items-center justify-center bg-black rounded-lg overflow-hidden border border-zinc-800/80 shadow-2xl`}>
          {/* 1. Real Native HTML5 Video Element - Plays live video smoothly with hardware acceleration and audible audio */}
          <video
            ref={videoRef}
            playsInline
            muted={masterVolume === 0 || !!activeVideo?.muted}
            loop
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              filter: getCssFilter(colorGrading),
            }}
            onLoadedData={() => setIsVideoLoaded(true)}
            onPlaying={() => setIsVideoLoaded(true)}
            onCanPlay={() => setIsVideoLoaded(true)}
            onError={(e) => {
              console.error('Video load failed:', activeVideo?.src, e);
              // Don't block - still clear canvas so user sees error, not fake pasture
              setIsVideoLoaded(true);
            }}
          />

          {/* 2. Interactive High-Fidelity Canvas Viewport */}
          {/* Overlaid on top of video: renders transparently when video plays, and procedural visuals if buffering */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full object-contain cursor-pointer z-10"
            onClick={togglePlay}
          />

          {/* Play/Pause Overlay indicator on hover or pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-auto p-4 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white shadow-xl backdrop-blur-md transition-transform transform hover:scale-110 active:scale-95 z-20"
            >
              <Play className="w-7 h-7 fill-white ml-0.5" />
            </button>
          )}

          {/* Quick Color LUT badge */}
          <div className="absolute top-3 left-3 bg-zinc-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-300 border border-zinc-700/60 font-mono z-20">
            LUT: {colorGrading.lut.replace('-', ' ').toUpperCase()}
          </div>

          {/* Top Right Badges: Sound status & Live Video */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            {/* Audio Audible Indicator */}
            <button
              onClick={e => {
                e.stopPropagation();
                setMasterVolume(masterVolume === 0 ? 0.85 : 0);
              }}
              className={`flex items-center gap-1 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                masterVolume > 0 && !activeVideo?.muted
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70 hover:bg-emerald-900'
                  : 'bg-red-950/80 text-red-300 border-red-800/70 hover:bg-red-900'
              }`}
              title="Click to toggle Sound"
            >
              {masterVolume > 0 && !activeVideo?.muted ? (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>SOUND: {Math.round(masterVolume * 100)}%</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3 text-red-400" />
                  <span>MUTED</span>
                </>
              )}
            </button>

            {/* Live Video Indicator */}
            <div className="flex items-center gap-1.5 bg-zinc-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-emerald-400 border border-emerald-800/60 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE VIDEO</span>
            </div>
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
                setColorGrading(prev => ({
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
                setColorGrading(prev => ({
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
                setColorGrading(prev => ({
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
                setColorGrading(prev => ({
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
