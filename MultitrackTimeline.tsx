import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useProject } from './ProjectContext';
import {
  MousePointer,
  Scissors,
  Magnet,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Trash2,
  Split,
  Plus,
  Sparkles,
  Music,
  Video,
  Mic,
} from 'lucide-react';
import { TimelineClip } from './types';

const MIN_CLIP_DURATION = 0.15;
const TRACK_HEADER_WIDTH = 160;
const SNAP_THRESHOLD_PX = 12;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

export const MultitrackTimeline: React.FC = () => {
  const {
    currentTime,
    duration,
    seek,
    tracks,
    clips,
    activeTool,
    setActiveTool,
    snapping,
    setSnapping,
    zoom,
    setZoom,
    selectedClipId,
    setSelectedClipId,
    splitClipAtPlayhead,
    deleteClip,
    moveClip,
    trimClip,
    toggleTrackMute,
    toggleTrackSolo,
    toggleTrackLock,
  } = useProject();

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Drag state
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [clipInitialStart, setClipInitialStart] = useState(0);
  const [snapLineX, setSnapLineX] = useState<number | null>(null);

  // Trim state
  const [trimmingClipId, setTrimmingClipId] = useState<string | null>(null);
  const [trimHandle, setTrimHandle] = useState<'left' | 'right' | null>(null);
  const [trimStartClientX, setTrimStartClientX] = useState(0);
  const [trimInitialStart, setTrimInitialStart] = useState(0);
  const [trimInitialDuration, setTrimInitialDuration] = useState(0);

  const timelineWidth = Math.max(900, duration * zoom + TRACK_HEADER_WIDTH + 120);

  // Snap points: playhead + all clip edges
  const snapPoints = useMemo(() => {
    const points: number[] = [0, currentTime, duration];
    clips.forEach(c => {
      points.push(c.start);
      points.push(c.start + c.duration);
    });
    return Array.from(new Set(points)).sort((a, b) => a - b);
  }, [clips, currentTime, duration]);

  const getSecondsFromClientX = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const offsetX = clientX - rect.left + scrollLeft - TRACK_HEADER_WIDTH;
    return Math.max(0, Math.min(duration, offsetX / zoom));
  }, [zoom, duration]);

  const getSnappedTime = useCallback((rawTime: number) => {
    if (!snapping) return { time: rawTime, snappedAt: null as number | null };
    const thresholdSec = SNAP_THRESHOLD_PX / zoom;
    for (const p of snapPoints) {
      if (Math.abs(rawTime - p) < thresholdSec) {
        return { time: p, snappedAt: p };
      }
    }
    return { time: rawTime, snappedAt: null };
  }, [snapping, snapPoints, zoom]);

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-clip]')) return;
    if (activeTool === 'razor') {
      splitClipAtPlayhead();
      return;
    }
    const sec = getSecondsFromClientX(e.clientX);
    seek(sec);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        const sec = getSecondsFromClientX(e.clientX);
        seek(sec);
        return;
      }

      if (draggedClipId) {
        const rawDelta = (e.clientX - dragStartX) / zoom;
        const rawNewStart = Math.max(0, clipInitialStart + rawDelta);
        const { time: snappedTime, snappedAt } = getSnappedTime(rawNewStart);
        setSnapLineX(snappedAt!== null? snappedAt * zoom + TRACK_HEADER_WIDTH : null);
        moveClip(draggedClipId, snappedTime);
        return;
      }

      if (trimmingClipId && trimHandle) {
        const deltaSec = (e.clientX - trimStartClientX) / zoom;
        if (trimHandle === 'right') {
          const newDur = Math.max(MIN_CLIP_DURATION, trimInitialDuration + deltaSec);
          trimClip(trimmingClipId, 0, newDur - trimInitialDuration);
        } else {
          // left trim: move start forward, shrink duration
          const maxTrim = trimInitialDuration - MIN_CLIP_DURATION;
          const clampedDelta = Math.min(Math.max(deltaSec, -trimInitialStart), maxTrim);
          trimClip(trimmingClipId, clampedDelta, -clampedDelta);
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggedClipId(null);
      setTrimmingClipId(null);
      setTrimHandle(null);
      setSnapLineX(null);
    };

    if (isScrubbing || draggedClipId || trimmingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isScrubbing, draggedClipId, trimmingClipId, trimHandle, dragStartX, clipInitialStart, trimStartClientX, trimInitialDuration, trimInitialStart, getSecondsFromClientX, getSnappedTime, moveClip, trimClip, seek, zoom]);

  const handleClipClick = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    if (activeTool === 'razor') {
      const sec = getSecondsFromClientX(e.clientX);
      seek(sec);
      splitClipAtPlayhead(clip.id);
      return;
    }
    setSelectedClipId(clip.id);
  };

  const handleClipDragStart = (e: React.MouseEvent, clip: TimelineClip) => {
    if (activeTool === 'razor') return;
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked) return;

    e.stopPropagation();
    setSelectedClipId(clip.id);
    setDraggedClipId(clip.id);
    setDragStartX(e.clientX);
    setClipInitialStart(clip.start);
  };

  const handleTrimStart = (e: React.MouseEvent, clip: TimelineClip, handle: 'left' | 'right') => {
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked) return;
    e.stopPropagation();
    setTrimmingClipId(clip.id);
    setTrimHandle(handle);
    setTrimStartClientX(e.clientX);
    setTrimInitialStart(clip.start);
    setTrimInitialDuration(clip.duration);
  };

  // Ruler ticks
  const rulerTicks = useMemo(() => {
    const interval = zoom < 30? 5 : zoom < 50? 2 : 1;
    const ticks = [];
    for (let t = 0; t <= duration; t += interval) {
      ticks.push(t);
    }
    return ticks;
  }, [duration, zoom]);

  return (
    <div className="w-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl select-none">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-zinc-700/60">
            <button
              onClick={() => setActiveTool('select')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition ${activeTool === 'select'? 'bg-white text-black font-semibold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              <MousePointer className="w-3.5 h-3.5" /> Select
            </button>
            <button
              onClick={() => setActiveTool('razor')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition ${activeTool === 'razor'? 'bg-amber-500 text-black font-semibold shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              <Scissors className="w-3.5 h-3.5" /> Razor
            </button>
          </div>

          <div className="h-5 w-px bg-zinc-800" />

          <button
            onClick={() => splitClipAtPlayhead()}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <Split className="w-3.5 h-3.5 text-amber-400" /> Split at Playhead
          </button>

          <button
            onClick={() => setSnapping(!snapping)}
            className={`p-2 rounded-lg border flex items-center gap-1.5 transition ${snapping? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-zinc-800 border-zinc-700/50 text-zinc-500'}`}
          >
            <Magnet className="w-3.5 h-3.5" /> {snapping? 'Snap ON' : 'Snap OFF'}
          </button>

          {selectedClipId && (
            <button
              onClick={() => deleteClip(selectedClipId)}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center gap-1 bg-zinc-800 rounded-full p-0.5 border border-zinc-700">
            <button onClick={() => setZoom(z => Math.max(15, z - 8))} className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-400">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-zinc-400 w-10 text-center font-mono">{zoom}px/s</span>
            <button onClick={() => setZoom(z => Math.min(120, z + 8))} className="p-1.5 rounded-full hover:bg-zinc-700 text-zinc-400">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div ref={timelineRef} onMouseDown={handleTimelineMouseDown} className="flex-1 overflow-auto bg-[#0a0a0a] relative custom-scrollbar">
        <div style={{ width: timelineWidth }} className="relative flex flex-col">

          {/* Time Ruler */}
          <div className="sticky top-0 z-20 flex h-8 bg-zinc-900 border-b border-zinc-800">
            <div style={{ width: TRACK_HEADER_WIDTH }} className="shrink-0 bg-zinc-900 border-r border-zinc-800 flex items-center px-3 text-[10px] font-bold text-zinc-500 tracking-widest">
              TRACKS
            </div>
            <div className="relative flex-1">
              {rulerTicks.map(t => (
                <div key={t} style={{ left: t * zoom }} className="absolute top-0 bottom-0 flex flex-col justify-between py-1">
                  <div className="w-px h-2 bg-zinc-700" />
                  <span className="text-[9px] text-zinc-500 font-mono ml-1">{formatTime(t)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {tracks.map(track => {
            const trackClips = clips.filter(c => c.trackId === track.id);
            const isLocked = track.isLocked;
            return (
              <div key={track.id} className="flex h-[72px] border-b border-zinc-800/60 group/track">
                {/* Track Header */}
                <div style={{ width: TRACK_HEADER_WIDTH }} className="shrink-0 sticky left-0 z-10 bg-zinc-900/95 backdrop-blur border-r border-zinc-800 flex flex-col justify-center px-2.5 gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 truncate">
                      {track.type === 'video'? <Video className="w-3.5 h-3.5 text-blue-400" /> : track.type === 'audio'? <Music className="w-3.5 h-3.5 text-emerald-400" /> : <Mic className="w-3.5 h-3.5 text-violet-400" />}
                      <span className="truncate">{track.name}</span>
                    </span>
                    {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleTrackMute(track.id); }} className={`h-6 w-6 grid place-items-center rounded text-[10px] font-black tracking-wider border transition ${track.isMuted? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-zinc-800 border-zinc-700/50 text-zinc-400 hover:text-white'}`}>
                      {track.isMuted? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleTrackSolo(track.id); }} className={`h-6 px-1.5 grid place-items-center rounded text-[10px] font-bold border transition ${track.isSolo? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'}`}>
                      S
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleTrackLock(track.id); }} className="h-6 w-6 grid place-items-center rounded bg-zinc-800 border border-zinc-700/50 text-zinc-500 hover:text-white">
                      {isLocked? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      <button className="h-6 w-6 grid place-items-center rounded bg-zinc-800 border border-zinc-700/50 text-zinc-500">
                        {track.type === 'video'? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-30" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lane */}
                <div className={`flex-1 relative ${isLocked? 'bg-zinc-900/30' : 'bg-zinc-950/40 hover:bg-zinc-900/20'} transition-colors`}>
                  {trackClips.map(clip => {
                    const isSelected = selectedClipId === clip.id;
                    const isDragging = draggedClipId === clip.id;
                    const isTrimming = trimmingClipId === clip.id;
                    const isAI = (clip as any).isAIEnhanced;

                    return (
                      <div
                        key={clip.id}
                        data-clip
                        onClick={(e) => handleClipClick(e, clip)}
                        onMouseDown={(e) => handleClipDragStart(e, clip)}
                        style={{
                          left: clip.start * zoom,
                          width: Math.max(24, clip.duration * zoom),
                        }}
                        className={`absolute top-2 bottom-2 rounded-lg border flex flex-col justify-between px-2.5 py-1.5 cursor-grab active:cursor-grabbing overflow-hidden transition-all select-none
                          ${isDragging? 'z-20 shadow-2xl scale-[1.02] opacity-90' : 'z-0'}
                          ${isSelected? 'ring-2 ring-white/90 border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'border-transparent'}
                          ${track.type === 'video'? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white' : track.type === 'audio'? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white' : 'bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white'}
                        `}
                      >
                        {/* Content */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold truncate">
                            {track.type === 'video'? <Video className="w-3 h-3 opacity-80" /> : <Music className="w-3 h-3 opacity-80" />}
                            <span className="truncate">{clip.name}</span>
                          </span>
                          {isAI && <Sparkles className="w-3 h-3 text-yellow-200 shrink-0" />}
                        </div>

                        {/* Fake Waveform / Filmstrip */}
                        <div className="flex-1 flex items-center gap-[2px] mt-1 opacity-60">
                          {Array.from({ length: Math.min(24, Math.floor(clip.duration * 4)) }).map((_, i) => (
                            <div key={i} className="flex-1 bg-white/60 rounded-full" style={{ height: `${20 + Math.sin(i * 1.5) * 40 + Math.random() * 30}%` }} />
                          ))}
                        </div>

                        {/* Duration label */}
                        <span className="absolute bottom-1 right-2 text-[9px] font-mono opacity-70">{clip.duration.toFixed(2)}s</span>

                        {/* Trim handles */}
                        <div onMouseDown={(e) => handleTrimStart(e, clip, 'left')} className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/0 hover:bg-white/20 cursor-ew-resize flex items-center justify-center group/handle">
                          <div className="w-0.5 h-6 bg-white/50 rounded-full opacity-0 group-hover/handle:opacity-100" />
                        </div>
                        <div onMouseDown={(e) => handleTrimStart(e, clip, 'right')} className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/0 hover:bg-white/20 cursor-ew-resize flex items-center justify-center group/handle">
                          <div className="w-0.5 h-6 bg-white/50 rounded-full opacity-0 group-hover/handle:opacity-100" />
                        </div>

                        {isTrimming && <div className="absolute inset-0 bg-white/10 pointer-events-none" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Snap Line */}
          {snapLineX!== null && (
            <div style={{ left: snapLineX }} className="absolute top-8 bottom-0 w-px bg-blue-400 z-30 pointer-events-none">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-[2.5px] -translate-y-1" />
            </div>
          )}

          {/* Playhead */}
          <div style={{ left: currentTime * zoom + TRACK_HEADER_WIDTH }} className="absolute top-0 bottom-0 w-px bg-red-500 z-40 pointer-events-none">
            <div className="sticky top-0 -translate-x-1/2 -translate-y-0 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />
              <div className="w-px h-[2000px] bg-red-500/80" />
            </div>
            <div className="absolute top-8 -translate-x-1/2 bg-red-500 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="hidden md:inline">Hold <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">Shift</kbd> to disable snap • <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">C</kbd> Razor • <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">V</kbd> Select</span>
        </span>
        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-violet-400" /> AI Auto-Cut Ready</span>
      </div>
    </div>
  );
};
