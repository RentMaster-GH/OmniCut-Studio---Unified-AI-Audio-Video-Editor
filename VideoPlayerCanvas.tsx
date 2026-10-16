import React, { useEffect, useRef } from 'react';
import { useProject } from '@/ProjectContext';
import { Play, Pause, Maximize2, Film } from 'lucide-react';

export const VideoPlayerCanvas: React.FC = () => {
  const { isPlaying, currentTime, duration, clips, togglePlay } = useProject();
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
  }, [isPlaying, activeVideoClip]); // Reacts immediately to clip switches

  // Sync the physical video time position when scrubbing the timeline
  useEffect(() => {
    if (!videoRef.current || !activeVideoClip) return;
    
    const localVideoTime = currentTime - activeVideoClip.start;
    // Keep playback time tightly synchronized under a 0.3s drifting tolerance
    if (Math.abs(videoRef.current.currentTime - localVideoTime) > 0.3) {
      videoRef.current.currentTime = localVideoTime;
    }
  }, [currentTime, activeVideoClip]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative group">
      
      {/* 📺 VIDEO STAGE VIEWPORT CHANNELS */}
      <div className="flex-1 w-full h-full bg-black relative flex items-center justify-center overflow-hidden aspect-video">
        {activeVideoClip?.src ? (
          <video
            key={activeVideoClip.id} // 🔥 CRUCIAL: Destroys old player cache to force layout re-renders!
            ref={videoRef}
            src={activeVideoClip.src}
            loop
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous" // Permits public domain stream tracking bypasses
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />
        ) : (
          /* Fallback view when no video assets populate the tracking timeline */
          <div className="text-center p-6 select-none">
            <Film className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 font-medium">Empty Stage Canvas Viewport</p>
            <p className="text-[10px] text-zinc-600">Populate track elements via prompt studio generation</p>
          </div>
        )}

        {/* 💬 VEED / DESCRIPT TEXT SUBTITLE OVERLAY RENDERING CHANNEL */}
        {activeVideoClip?.text && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 border border-zinc-800/60 px-4 py-2 rounded-xl text-center shadow-2xl backdrop-blur-sm max-w-[85%] pointer-events-none select-none z-10">
            <span className="text-yellow-400 font-extrabold text-xs sm:text-sm tracking-wide uppercase font-sans drop-shadow-md">
              {activeVideoClip.text}
            </span>
          </div>
        )}
      </div>

      {/* 🎛️ CONTROLS BAR HUD UTILITY FOOTER */}
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

        <div className="flex items-center gap-3 text-zinc-500 text-[10px] uppercase font-mono font-bold tracking-wider">
          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px]">
            {activeVideoClip ? 'Streaming: 1080p' : 'Idle'}
          </span>
          <Maximize2 className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
        </div>
      </div>
    </div>
  );
};
