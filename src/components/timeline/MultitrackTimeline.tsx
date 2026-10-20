
import React, { useRef, useState, useEffect } from 'react';
import { useProject } from "../../context/ProjectContext";
import {
  MousePointer,
  Scissors,
  Magnet,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Split,
  Plus,
  Sparkles,
  Music,
  Video,
  FileText,
  Upload,
} from 'lucide-react';
import { TimelineClip } from './types';

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
    setShowUploadModal,
    toggleTrackMute,
    toggleTrackSolo,
    toggleTrackLock,
  } = useProject();

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [clipInitialStart, setClipInitialStart] = useState<number>(0);

  // Resize trimming state
  const [trimmingClipId, setTrimmingClipId] = useState<string | null>(null);
  const [trimHandle, setTrimHandle] = useState<'left' | 'right' | null>(null);
  const [trimStartClientX, setTrimStartClientX] = useState<number>(0);
  const [initialDuration, setInitialDuration] = useState<number>(0);

  const timelineWidth = Math.max(900, duration * zoom + 120);

  // Convert mouse X position relative to timeline container to seconds
  const getSecondsFromMouseX = (e: React.MouseEvent | MouseEvent) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + timelineRef.current.scrollLeft;
    return Math.max(0, Math.min(duration, offsetX / zoom));
  };

  // Playhead scrubber mouse down
  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    // Only scrub if clicking ruler or blank lane
    if (activeTool === 'razor') {
      splitClipAtPlayhead();
      return;
    }
    const sec = getSecondsFromMouseX(e);
    seek(sec);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        const sec = getSecondsFromMouseX(e);
        seek(sec);
      } else if (draggedClipId) {
        const deltaSec = (e.clientX - dragStartX) / zoom;
        const newStart = Math.max(0, clipInitialStart + deltaSec);
        moveClip(draggedClipId, newStart);
      } else if (trimmingClipId && trimHandle) {
        const deltaSec = (e.clientX - trimStartClientX) / zoom;
        if (trimHandle === 'right') {
          trimClip(trimmingClipId, 0, deltaSec);
        } else if (trimHandle === 'left') {
          trimClip(trimmingClipId, deltaSec, -deltaSec);
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggedClipId(null);
      setTrimmingClipId(null);
      setTrimHandle(null);
    };

    if (isScrubbing || draggedClipId || trimmingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggedClipId, clipInitialStart, dragStartX, trimmingClipId, trimHandle, trimStartClientX, zoom]);

  // Handle clicking a clip
  const handleClipClick = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    if (activeTool === 'razor') {
      // Split this specific clip at the click location
      const sec = getSecondsFromMouseX(e);
      seek(sec);
      splitClipAtPlayhead(clip.id);
      return;
    }
    setSelectedClipId(clip.id);
  };

  // Start clip dragging
  const handleClipDragStart = (e: React.MouseEvent, clip: TimelineClip) => {
    if (activeTool === 'razor') return;
    e.stopPropagation();
    setSelectedClipId(clip.id);
    setDraggedClipId(clip.id);
    setDragStartX(e.clientX);
    setClipInitialStart(clip.start);
  };

  // Start trimming handle drag
  const handleTrimStart = (e: React.MouseEvent, clip: TimelineClip, handle: 'left' | 'right') => {
    e.stopPropagation();
    setTrimmingClipId(clip.id);
    setTrimHandle(handle);
    setTrimStartClientX(e.clientX);
    setClipInitialStart(clip.start);
    setInitialDuration(clip.duration);
  };

  return (
    <div className="w-full flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl select-none">
      {/* Timeline Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-300">
        <div className="flex items-center gap-1.5">
          {/* Tool switchers */}
          <div className="flex items-center bg-zinc-800/90 rounded-lg p-0.5 border border-zinc-700/60">
            <button
              onClick={() => setActiveTool('select')}
              title="Selection Tool (V)"
              className={`p-1.5 rounded flex items-center gap-1 transition ${
                activeTool === 'select' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Select (V)</span>
            </button>
            <button
              onClick={() => setActiveTool('razor')}
              title="Razor / Split Tool (C)"
              className={`p-1.5 rounded flex items-center gap-1 transition ${
                activeTool === 'razor' ? 'bg-amber-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Razor (C)</span>
            </button>
          </div>

          {/* Quick Cut at Playhead button */}
          <button
            onClick={() => splitClipAtPlayhead()}
            title="Split Clip at Playhead (Ctrl+K)"
            className="p-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 hover:text-white flex items-center gap-1 transition"
          >
            <Split className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Split Playhead</span>
          </button>

          {/* Magnetic Snapping */}
          <button
            onClick={() => setSnapping(!snapping)}
            title="Magnetic Snapping (S)"
            className={`p-1.5 rounded-lg border flex items-center gap-1 transition ${
              snapping ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Snap</span>
          </button>

          {/* Delete selected clip */}
          {selectedClipId && (
            <button
              onClick={() => deleteClip(selectedClipId)}
              title="Delete Selected Clip (Del)"
              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Delete</span>
            </button>
          )}

          {/* Import Media & Documents button */}
          <button
            onClick={() => setShowUploadModal(true)}
            title="Import Video, Audio, Documents & Subtitles"
            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white flex items-center gap-1 transition"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline text-[11px] font-semibold">Import Media</span>
          </button>
        </div>

        {/* Timeline Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.max(duration > 600 ? 1 : 10, prev - (duration > 600 ? 2 : 8)))}
            title="Zoom Out (-)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={duration > 1800 ? "1" : duration > 300 ? "4" : "10"}
            max="90"
            value={zoom}
            onChange={e => setZoom(parseInt(e.target.value, 10))}
            className="w-20 accent-blue-500 h-1 bg-zinc-800 rounded cursor-pointer"
          />
          <button
            onClick={() => setZoom(prev => Math.min(90, prev + (duration > 600 ? 2 : 8)))}
            title="Zoom In (+)"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-zinc-500 font-mono w-8 text-right">{zoom}px/s</span>
        </div>
      </div>

      {/* Main Multitrack Workspace Area */}
      <div className="flex w-full h-[320px] overflow-hidden bg-zinc-950">
        {/* Track Headers Panel (Fixed Left) */}
        <div className="w-48 sm:w-56 shrink-0 bg-zinc-900/90 border-r border-zinc-800 flex flex-col z-20 shadow-md">
          {/* Header top ruler spacer */}
          <div className="h-7 border-b border-zinc-800 px-3 flex items-center text-[10px] font-mono text-zinc-400 bg-zinc-950/60 uppercase tracking-wider">
            Track / Channel
          </div>

          {/* Track headers list */}
          <div className="flex-1 overflow-y-auto">
            {tracks.map(track => (
              <div
                key={track.id}
                style={{ height: `${track.height}px` }}
                className="flex items-center justify-between px-3 border-b border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/40 transition group"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: track.color }}
                  />
                  <div className="flex flex-col truncate">
                    <span className="text-[11px] font-medium text-zinc-200 truncate">
                      {track.name}
                    </span>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-tight">
                      {track.type}
                    </span>
                  </div>
                </div>

                {/* Track control buttons: Mute, Solo, Lock */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    title={track.muted ? 'Unmute' : 'Mute (M)'}
                    className={`p-1 rounded text-[10px] transition ${
                      track.muted
                        ? 'bg-red-500/20 text-red-400 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => toggleTrackSolo(track.id)}
                    title={track.solo ? 'Solo On' : 'Solo (S)'}
                    className={`p-1 rounded text-[10px] transition ${
                      track.solo
                        ? 'bg-amber-500/20 text-amber-400 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => toggleTrackLock(track.id)}
                    title={track.locked ? 'Unlock' : 'Lock Track'}
                    className={`p-1 rounded text-[10px] transition ${
                      track.locked
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {track.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5 opacity-40" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Tracks & Timeline Canvas Area */}
        <div
          ref={timelineRef}
          onMouseDown={handleTimelineMouseDown}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-zinc-950 cursor-crosshair select-none"
        >
          <div style={{ width: `${timelineWidth}px` }} className="relative h-full">
            {/* 1. Time Ruler at Top */}
            <div className="h-7 border-b border-zinc-800 bg-zinc-900/90 relative cursor-pointer flex items-center">
              {(() => {
                const tickStep =
                  duration > 1800 ? 120 : duration > 600 ? 60 : duration > 120 ? 15 : duration > 30 ? 5 : 2;
                const totalTicks = Math.ceil(duration / tickStep) + 2;

                return Array.from({ length: totalTicks }).map((_, i) => {
                  const sec = i * tickStep;
                  const leftPos = sec * zoom;
                  const hrs = Math.floor(sec / 3600);
                  const mins = Math.floor((sec % 3600) / 60);
                  const secs = Math.floor(sec % 60);
                  const timeLabel =
                    hrs > 0
                      ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                      : `${mins}:${secs.toString().padStart(2, '0')}`;

                  return (
                    <div
                      key={sec}
                      style={{ left: `${leftPos}px` }}
                      className="absolute top-0 bottom-0 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-mono text-zinc-400 pl-1 select-none">
                        {timeLabel}
                      </span>
                      <div className="w-px h-2 bg-zinc-700" />
                    </div>
                  );
                });
              })()}
            </div>

            {/* 2. Track Lanes */}
            <div className="relative">
              {tracks.map(track => {
                const trackClips = clips.filter(c => c.trackId === track.id);
                return (
                  <div
                    key={track.id}
                    style={{ height: `${track.height}px` }}
                    className={`relative w-full border-b border-zinc-800/60 ${
                      track.muted ? 'opacity-40' : ''
                    } bg-zinc-950/40`}
                  >
                    {/* Render clips on this track */}
                    {trackClips.map(clip => {
                      const isSelected = selectedClipId === clip.id;
                      const left = clip.start * zoom;
                      const width = clip.duration * zoom;

                      return (
                        <div
                          key={clip.id}
                          onClick={e => handleClipClick(e, clip)}
                          onMouseDown={e => handleClipDragStart(e, clip)}
                          style={{
                            left: `${left}px`,
                            width: `${Math.max(12, width)}px`,
                            backgroundColor: clip.color ? `${clip.color}22` : '#3b82f622',
                            borderColor: isSelected ? '#FFFFFF' : clip.color || '#3b82f6',
                          }}
                          className={`absolute top-1 bottom-1 rounded-md border text-xs overflow-hidden flex flex-col justify-between cursor-move shadow-md transition-all ${
                            isSelected ? 'ring-2 ring-white/80 z-10' : 'hover:brightness-110'
                          }`}
                        >
                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={e => handleTrimStart(e, clip, 'left')}
                            className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/40 cursor-ew-resize z-20"
                          />

                          {/* Clip Header Content */}
                          <div className="px-1.5 py-0.5 flex items-center justify-between text-[10px] font-medium text-white truncate pointer-events-none">
                            <span className="truncate flex items-center gap-1 drop-shadow-sm">
                              {track.type === 'audio' && <Music className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                              {track.type === 'video' && <Video className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                              {track.type === 'caption' && <FileText className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                              {clip.title}
                            </span>
                            <span className="font-mono text-[9px] text-zinc-300 opacity-80 shrink-0 ml-1">
                              {clip.duration.toFixed(1)}s
                            </span>
                          </div>

                          {/* Audio Waveform visualization if audio track */}
                          {track.type === 'audio' && (
                            <div className="flex-1 flex items-center px-1 gap-0.5 opacity-60 pointer-events-none">
                              {Array.from({ length: Math.min(60, Math.floor(width / 3)) }).map((_, wIdx) => {
                                const hPct = Math.sin(wIdx * 0.4 + clip.start) * 40 + 50;
                                return (
                                  <div
                                    key={wIdx}
                                    style={{ height: `${hPct}%` }}
                                    className="w-0.5 bg-emerald-400/80 rounded-full shrink-0"
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* Captions Text Preview */}
                          {track.type === 'caption' && clip.text && (
                            <div className="px-1.5 pb-1 text-[9px] text-amber-200 truncate italic font-mono pointer-events-none">
                              "{clip.text}"
                            </div>
                          )}

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={e => handleTrimStart(e, clip, 'right')}
                            className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/40 cursor-ew-resize z-20"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* 3. The Red Needle Playhead Indicator */}
            <div
              style={{ left: `${currentTime * zoom}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-lg"
            >
              {/* Playhead handle head */}
              <div className="w-3.5 h-4 bg-red-500 rounded-b-sm -ml-[6px] flex items-center justify-center shadow-md">
                <div className="w-1 h-2 bg-white rounded-full opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
