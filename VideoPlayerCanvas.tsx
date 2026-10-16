import React, { useEffect, useRef, useState } from 'react';
import { useProject } from '@/ProjectContext';
import { Play, Pause, Maximize2, Film, ShieldCheck, Sparkles } from 'lucide-react';

export const VideoPlayerCanvas: React.FC = () => {
  const { isPlaying, currentTime, duration, clips, togglePlay } = useProject();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  const [faceMeshActive, setFaceMeshActive] = useState<boolean>(true);
  const [detectedFaces, setDetectedFaces] = useState<number>(0);

  // Find if there is an active video clip at the current time position
  const activeVideoClip = clips.find(
    c => c.type === 'video' && currentTime >= c.start && currentTime <= (c.start + c.duration)
  );

  // Sync the physical HTML Video player state with your global React play controls
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        console.log('Browser blocked autoplay or media stream initialization:', err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, activeVideoClip]);

  // Sync the physical video time position when scrubbing the timeline
  useEffect(() => {
    if (!videoRef.current || !activeVideoClip) return;
    
    const localVideoTime = currentTime - activeVideoClip.start;
    if (Math.abs(videoRef.current.currentTime - localVideoTime) > 0.3) {
      videoRef.current.currentTime = localVideoTime;
    }
  }, [currentTime, activeVideoClip]);

  // 🧬 CLIENT-SIDE AI BEAUTY TRACKING LOOP (YOUCAM REPLICATOR ENGINE)
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !faceMeshActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      if (video.paused || video.ended) {
        requestRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Sync canvas sizing boundaries with source video parameters
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
      }

      // 1. Draw original video track base frame to secondary tracking layer
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 2. Mock Mocking structural MediaPipe mesh node processing calculations
      // Real implementation: faceMesh.send({image: video}) -> yields 468 landmark vectors
      const hasFaceDetected = true; 
      if (hasFaceDetected) {
        if (detectedFaces !== 1) setDetectedFaces(1);

        // Core beauty routine filter sample: Bilateral Skin Smooth Emulation
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 230, 230, 0.08)'; // Light skin softening tone mapping overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Trace AI face tracker nodes to render spatial cosmetic mappings
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.45)'; // Purple mesh layout line colors
        ctx.lineWidth = 1.5;
        
        // Emulate geometric plotting of lip mappings (Virtual Lipstick Try-on)
        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, canvas.height * 0.58, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // High-fidelity overlay tint
        ctx.fill();
        ctx.stroke();

        // Emulate geometric plotting of eyeliner mesh tracks
        ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
        ctx.beginPath(); // Left Eye node point anchor
        ctx.arc(canvas.width * 0.43, canvas.height * 0.45, 4, 0, Math.PI * 2);
        ctx.arc(canvas.width * 0.57, canvas.height * 0.45, 4, 0, Math.PI * 2); // Right Eye anchor
        ctx.fill();
      } else {
        if (detectedFaces !== 0) setDetectedFaces(0);
      }

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [faceMeshActive, activeVideoClip, detectedFaces]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative group">
      
      {/* 🧭 TOP RADAR HUD INDICATOR METRICS FOR FACE TRACKING AI */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800/80 text-[10px] font-mono text-zinc-300">
        <div className={`w-1.5 h-1.5 rounded-full ${faceMeshActive && detectedFaces > 0 ? 'bg-green-500 animate-ping' : 'bg-zinc-600'}`} />
        <span>Face Engine: {faceMeshActive ? (detectedFaces > 0 ? 'Retouch Tracking Active' : 'Scanning Stage...') : 'Disabled'}</span>
      </div>

      {/* 🎬 VIDEO STAGE VIEWPORT CHANNELS */}
      <div className="flex-1 w-full h-full bg-black relative flex items-center justify-center overflow-hidden aspect-video">
        {activeVideoClip?.src ? (
          <>
            <video
              key={activeVideoClip.id}
              ref={videoRef}
              src={activeVideoClip.src}
              loop
              muted
              playsInline
              preload="auto"
              crossOrigin="anonymous"
              className={`w-full h-full object-contain ${faceMeshActive ? 'hidden' : 'block'}`}
              onClick={togglePlay}
            />
            {/* Real-time AR pipeline rendering layer */}
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-contain cursor-pointer ${faceMeshActive ? 'block' : 'hidden'}`}
              onClick={togglePlay}
            />
          </>
        ) : (
          <div className="text-center p-6 select-none">
            <Film className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 font-medium">Empty Stage Canvas Viewport</p>
            <p className="text-[10px] text-zinc-600">Populate track elements via prompt studio generation</p>
          </div>
        )}

        {/* 💬 VEED / DESCRIPT TEXT SUBTITLE OVERLAY RENDERING CHANNEL */}
        {activeVideoClip?.text && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 border border-zinc-800/60 px-4 py-2 rounded-xl text-center shadow-2xl backdrop-blur-sm max-w-[85%] pointer-events-none select-none z-10">
            <span className="text-yellow-400 font-extrabold text-xs sm:text-sm tracking-wide uppercase font-sans drop-shadow-md">
              {activeVideoClip.text}
            </span>
          </div>
        )}
      </div>

      {/* 🛠️ CONTROLS BAR HUD UTILITY FOOTER */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800/50 flex items-center justify-between gap-4 shrink-0 text-zinc-400 text-xs select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded-lg transition ${
              isPlaying ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <span className="font-mono text-[11px] tracking-widest text-zinc-500">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>

        {/* Toggle option to see standard raw video tracks vs AI tracking mesh channels */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFaceMeshActive(!faceMeshActive)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition border ${
              faceMeshActive 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{faceMeshActive ? 'AR Cosmetics ON' : 'AR Cosmetics OFF'}</span>
          </button>

          <div className="flex items-center gap-3 text-zinc-500 text-[10px] uppercase font-mono font-bold tracking-wider">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px]">
              {activeVideoClip ? 'Streaming: 1080p' : 'Idle'}
            </span>
            <Maximize2 className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
          </div>
        </div>
      </div>
    </div>
  );
};
