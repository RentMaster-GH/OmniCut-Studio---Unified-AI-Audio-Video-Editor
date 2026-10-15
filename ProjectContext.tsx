import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AspectRatio,
  TimelineClip,
  TimelineTrack,
  TranscriptWord,
  Collaborator,
  ProjectComment,
  ProjectVersion,
  ProjectAnalytics,
  CaptionStyle,
  ColorGrading,
  AudioMixerChannel,
} from '@/index
import {
  INITIAL_CLIPS,
  INITIAL_TRACKS,
  INITIAL_TRANSCRIPT,
  INITIAL_COLLABORATORS,
  INITIAL_COMMENTS,
  INITIAL_VERSIONS,
  INITIAL_ANALYTICS,
  DEFAULT_CAPTION_STYLE,
  DEFAULT_COLOR_GRADING,
} from '@/initialProject';
import { audioEngine } from '@/audioEngine';

type Tool = 'select' | 'razor' | 'slip';
type UserRole = 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer';
type Tab = 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab';

interface ProjectContextType {
  // Playback
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  stepFrame: (frames: number) => void;

  // Timeline & Clips
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  snapping: boolean;
  setSnapping: (enabled: boolean) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  deleteClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, newStart: number, newTrackId?: string) => void;
  trimClip: (clipId: string, deltaStart: number, deltaDuration: number) => void;
  addClip: (clip: TimelineClip) => void;

  // Track controls
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;

  // Descript
  transcript: TranscriptWord[];
  removeFillerWords: () => void;
  deleteTranscriptWord: (wordId: string) => void;
  overdubTranscriptWord: (wordId: string, newWord: string) => Promise<void>;
  generateTranscriptFromClips: () => Promise<void>;

  // VEED
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  showSafeMargins: boolean;
  setShowSafeMargins: (show: boolean) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;

  // InVideo AI
  generateAIVideo: (prompt: string, tone?: string, format?: string) => Promise<any>;
  isAIGenerating: boolean;

  // Color & Audio
  colorGrading: ColorGrading;
  setColorGrading: React.Dispatch<React.SetStateAction<ColorGrading>>;
  audioChannels: AudioMixerChannel[];
  updateAudioChannel: (trackId: string, updates: Partial<AudioMixerChannel>) => void;
  isStudioSoundActive: boolean;
  toggleStudioSound: () => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;

  // Collab
  collaborators: Collaborator[];
  comments: ProjectComment[];
  addComment: (text: string, timestamp?: number) => void;
  resolveComment: (commentId: string) => void;
  versions: ProjectVersion[];
  restoreVersion: (versionId: string) => void;
  createVersionSnapshot: (label: string, summary?: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Analytics
  analytics: ProjectAnalytics;

  // Security
  isBiometricLocked: boolean;
  verifyBiometric: () => Promise<boolean>;
  lockWorkspace: () => void;
  isEndToEndEncrypted: boolean;
  encryptionFingerprint: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  syncNow: () => void;

  // UI
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  showSecurityModal: boolean;
  setShowSecurityModal: (show: boolean) => void;
  theme: 'dark' | 'oled' | 'light';
  setTheme: (t: 'dark' | 'oled' | 'light') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Playback
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // Timeline
  const [tracks, setTracks] = useState<TimelineTrack[]>(INITIAL_TRACKS);
  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_CLIPS);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [snapping, setSnapping] = useState(true);
  const [zoom, setZoom] = useState(48);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(INITIAL_CLIPS[0]?.id?? null);

  // Descript
  const [transcript, setTranscript] = useState<TranscriptWord[]>(INITIAL_TRANSCRIPT);

  // VEED
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showSafeMargins, setShowSafeMargins] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);

  // Color & Audio
  const [colorGrading, setColorGrading] = useState<ColorGrading>(DEFAULT_COLOR_GRADING);
  const [isStudioSoundActive, setIsStudioSoundActive] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [audioChannels, setAudioChannels] = useState<AudioMixerChannel[]>(() =>
    INITIAL_TRACKS.filter(t => t.type === 'audio' || t.type === 'voice').map(t => ({
      trackId: t.id,
      name: t.name,
      volume: t.volume?? 1,
      pan: 0,
      eq: { low: 0, lowMid: 0, highMid: 1.5, high: 2 },
      compressorEnabled: true,
      compressorThreshold: -18,
      studioSoundActive: t.id === 'track-a1',
      noiseReductionDb: t.id === 'track-a1'? 14 : 0,
      deReverbPct: t.id === 'track-a1'? 85 : 0,
      currentPeakLevel: 0.65,
    }))
  );

  // AI
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // Collab
  const [collaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [comments, setComments] = useState<ProjectComment[]>(INITIAL_COMMENTS);
  const [versions, setVersions] = useState<ProjectVersion[]>(INITIAL_VERSIONS);
  const [userRole, setUserRole] = useState<UserRole>('Lead Producer');

  // Analytics
  const [analytics] = useState<ProjectAnalytics>(INITIAL_ANALYTICS);

  // Security
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [isEndToEndEncrypted] = useState(true);
  const [encryptionFingerprint] = useState('SHA256:7e91...d8a2 (AES-GCM-256)');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'oled' | 'light'>('dark');

  const duration = useMemo(() => Math.max(30,...clips.map(c => c.start + c.duration), 24.5), [clips]);

  // Init Audio
  useEffect(() => {
    audioEngine.init();
    audioEngine.setMasterVolume(masterVolume);
    audioEngine.setStudioSound(isStudioSoundActive);
  }, []); // eslint-disable-line

  useEffect(() => { audioEngine.setMasterVolume(masterVolume); }, [masterVolume]);
  useEffect(() => { audioEngine.setStudioSound(isStudioSoundActive); }, [isStudioSoundActive]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioEngine.pause();
      return;
    }
    audioEngine.resume();
    audioEngine.startAmbientPlayback('cinematic');
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= duration) { setIsPlaying(false); return duration; }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, duration]);

  // Core Timeline Actions
  const seek = useCallback((s: number) => setCurrentTime(Math.max(0, Math.min(duration, s))), [duration]);
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying(p =>!p), []);
  const stepFrame = useCallback((frames: number) => seek(currentTime + frames / 30), [currentTime, seek]);

  const splitClipAtPlayhead = useCallback((clipId?: string) => {
    setClips(prev => {
      const out: TimelineClip[] = [];
      for (const clip of prev) {
        const inRange = currentTime > clip.start && currentTime < clip.start + clip.duration;
        const shouldSplit = clipId? clip.id === clipId : inRange;
        if (!shouldSplit || currentTime - clip.start < 0.15 || clip.start + clip.duration - currentTime < 0.15) {
          out.push(clip); continue;
        }
        const firstDur = currentTime - clip.start;
        out.push({...clip, duration: firstDur });
        out.push({
         ...clip,
          id: `${clip.id}_split_${Date.now()}`,
          start: currentTime,
          duration: clip.duration - firstDur,
          sourceStart: (clip as any).sourceStart + firstDur,
        });
      }
      return out;
    });
  }, [currentTime]);

  const deleteClip = useCallback((id: string) => {
    setClips(p => p.filter(c => c.id!== id));
    setSelectedClipId(p => p === id? null : p);
  }, []);

  const updateClip = useCallback((id: string, updates: Partial<TimelineClip>) => {
    setClips(p => p.map(c => c.id === id? {...c,...updates } : c));
  }, []);

  const moveClip = useCallback((id: string, newStart: number, newTrackId?: string) => {
    setClips(p => p.map(c => c.id === id? {...c, start: Math.max(0, newStart), trackId: newTrackId?? c.trackId } : c));
  }, []);

  const trimClip = useCallback((id: string, deltaStart: number, deltaDuration: number) => {
    setClips(p => p.map(c => {
      if (c.id!== id) return c;
      const newStart = Math.max(0, c.start + deltaStart);
      const newDur = Math.max(0.15, c.duration + deltaDuration);
      const src = (c as any).sourceStart?? 0;
      return {...c, start: newStart, duration: newDur, sourceStart: Math.max(0, src + deltaStart) } as TimelineClip;
    }));
  }, []);

  const addClip = useCallback((clip: TimelineClip) => setClips(p => [...p, clip]), []);

  const toggleTrackMute = useCallback((id: string) => setTracks(p => p.map(t => t.id === id? {...t, isMuted:!t.isMuted } : t)), []);
  const toggleTrackSolo = useCallback((id: string) => setTracks(p => p.map(t => t.id === id? {...t, isSolo:!t.isSolo } : t)), []);
  const toggleTrackLock = useCallback((id: string) => setTracks(p => p.map(t => t.id === id? {...t, isLocked:!t.isLocked } : t)), []);
  const setTrackVolume = useCallback((id: string, vol: number) => setTracks(p => p.map(t => t.id === id? {...t, volume: vol } : t)), []);

  // Descript
  const removeFillerWords = useCallback(() => {
    const fillers = new Set(['um', 'uh', 'like', 'you know', 'so']);
    setTranscript(p => p.filter(w =>!fillers.has(w.word.toLowerCase())));
  }, []);
  const deleteTranscriptWord = useCallback((wordId: string) => setTranscript(p => p.filter(w => w.id!== wordId)), []);
  const overdubTranscriptWord = useCallback(async (wordId: string, newWord: string) => {
    setTranscript(p => p.map(w => w.id === wordId? {...w, word: newWord, isAIOverdub: true } : w));
  }, []);
  const generateTranscriptFromClips = useCallback(async () => {
    setTranscript(INITIAL_TRANSCRIPT);
  }, []);

  // AI
  const generateAIVideo = useCallback(async (prompt: string) => {
    setIsAIGenerating(true);
    await new Promise(r => setTimeout(r, 2500));
    const newClip: TimelineClip = {
      id: `ai_${Date.now()}`,
      name: `AI: ${prompt.slice(0, 24)}`,
      trackId: tracks.find(t => t.type === 'video')?.id?? tracks[0].id,
      start: currentTime,
      duration: 3.5,
      sourceStart: 0,
      type: 'video' as any,
    } as any;
    setClips(p => [...p, newClip]);
    setIsAIGenerating(false);
    return newClip;
  }, [tracks, currentTime]);

  const updateAudioChannel = useCallback((trackId: string, updates: Partial<AudioMixerChannel>) => {
    setAudioChannels(p => p.map(ch => ch.trackId === trackId? {...ch,...updates } : ch));
  }, []);

  const addComment = useCallback((text: string, timestamp?: number) => {
    const c: ProjectComment = {
      id: `comment_${Date.now()}`,
      text,
      timestamp: timestamp?? currentTime,
      authorId: 'me',
      authorName: 'You',
      isResolved: false,
      createdAt: new Date().toISOString(),
    } as any;
    setComments(p => [...p, c]);
  }, [currentTime]);

  const resolveComment = useCallback((id: string) => setComments(p => p.map(c => c.id === id? {...c, isResolved: true } : c)), []);
  const restoreVersion = useCallback((id: string) => {
    const v = versions.find(v => v.id === id);
    if (v) { setClips(v.clips as any); setTracks(v.tracks as any); }
  }, [versions]);
  const createVersionSnapshot = useCallback((label: string, summary?: string) => {
    const v: ProjectVersion = {
      id: `v_${Date.now()}`,
      label,
      summary: summary?? '',
      createdAt: new Date().toISOString(),
      clips: clips as any,
      tracks: tracks as any,
    } as any;
    setVersions(p => [v,...p]);
  }, [clips, tracks]);

  const verifyBiometric = useCallback(async () => { setIsBiometricLocked(false); return true; }, []);
  const lockWorkspace = useCallback(() => setIsBiometricLocked(true), []);
  const syncNow = useCallback(() => {
    setCloudSyncStatus('syncing');
    setTimeout(() => setCloudSyncStatus('synced'), 1200);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'KeyV') setActiveTool('select');
      if (e.code === 'KeyC') setActiveTool('razor');
      if (e.code === 'KeyS' &&!e.metaKey &&!e.ctrlKey) { e.preventDefault(); setSnapping(v =>!v); }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') { e.preventDefault(); splitClipAtPlayhead(); }
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipId) { e.preventDefault(); deleteClip(selectedClipId); }
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(v =>!v); }
      if (e.code === 'Escape') { setSelectedClipId(null); setActiveTool('select'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedClipId, splitClipAtPlayhead, deleteClip]);

  const value: ProjectContextType = {
    currentTime, duration, isPlaying, play, pause, togglePlay, seek, stepFrame,
    tracks, clips, activeTool, setActiveTool, snapping, setSnapping, zoom, setZoom,
    selectedClipId, setSelectedClipId, splitClipAtPlayhead, deleteClip, updateClip, moveClip, trimClip, addClip,
    toggleTrackMute, toggleTrackSolo, toggleTrackLock, setTrackVolume,
    transcript, removeFillerWords, deleteTranscriptWord, overdubTranscriptWord, generateTranscriptFromClips,
    aspectRatio, setAspectRatio, showSafeMargins, setShowSafeMargins, captionStyle, setCaptionStyle,
    generateAIVideo, isAIGenerating, colorGrading, setColorGrading, audioChannels, updateAudioChannel,
    isStudioSoundActive, toggleStudioSound: () => setIsStudioSoundActive(p =>!p),
    masterVolume, setMasterVolume: setMasterVolumeState,
    collaborators, comments, addComment, resolveComment, versions, restoreVersion, createVersionSnapshot, userRole, setUserRole,
    analytics, isBiometricLocked, verifyBiometric, lockWorkspace, isEndToEndEncrypted, encryptionFingerprint, cloudSyncStatus, syncNow,
    activeTab, setActiveTab, showExportModal, setShowExportModal, showSecurityModal, setShowSecurityModal, theme, setTheme,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
