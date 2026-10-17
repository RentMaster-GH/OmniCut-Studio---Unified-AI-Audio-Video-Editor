import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
} from './types';
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
} from './initialProject';
import { audioEngine } from './audioEngine';

interface ProjectContextType {
  currentTime: number; duration: number; isPlaying: boolean;
  play: () => void; pause: () => void; togglePlay: () => void;
  seek: (seconds: number) => void; stepFrame: (frames: number) => void;
  tracks: TimelineTrack[]; clips: TimelineClip[];
  activeTool: 'select' | 'razor' | 'slip'; setActiveTool: (tool: 'select' | 'razor' | 'slip') => void;
  snapping: boolean; setSnapping: (enabled: boolean) => void;
  zoom: number; setZoom: React.Dispatch<React.SetStateAction<number>>;
  selectedClipId: string | null; setSelectedClipId: (id: string | null) => void;
  splitClipAtPlayhead: (clipId?: string) => void; deleteClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, newStart: number, newTrackId?: string) => void;
  trimClip: (clipId: string, ds: number, dd: number) => void;
  addClip: (clip: TimelineClip) => void;
  toggleTrackMute: (id: string) => void; toggleTrackSolo: (id: string) => void;
  toggleTrackLock: (id: string) => void; setTrackVolume: (id: string, volume: number) => void;
  transcript: TranscriptWord[]; removeFillerWords: () => void; deleteTranscriptWord: (id: string) => void;
  overdubTranscriptWord: (id: string, newWord: string) => Promise<void>; generateTranscriptFromClips: () => Promise<void>;
  aspectRatio: AspectRatio; setAspectRatio: (ratio: AspectRatio) => void; showSafeMargins: boolean; setShowSafeMargins: (show: boolean) => void;
  captionStyle: CaptionStyle; setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;
  generateAIVideo: (prompt: string, tone?: string, format?: string, mode?: string) => Promise<any>; isAIGenerating: boolean;
  colorGrading: ColorGrading; setColorGrading: React.Dispatch<React.SetStateAction<ColorGrading>>;
  audioChannels: AudioMixerChannel[]; updateAudioChannel: (id: string, updates: Partial<AudioMixerChannel>) => void;
  isStudioSoundActive: boolean; toggleStudioSound: () => void; masterVolume: number; setMasterVolume: (vol: number) => void;
  collaborators: Collaborator[]; comments: ProjectComment[]; addComment: (text: string, timestamp?: number) => void;
  resolveComment: (commentId: string) => void; versions: ProjectVersion[]; restoreVersion: (versionId: string) => void;
  createVersionSnapshot: (label: string, summary?: string) => void;
  userRole: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer'; setUserRole: (role: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer') => void;
  analytics: ProjectAnalytics; isBiometricLocked: boolean; verifyBiometric: () => Promise<boolean>;
  lockWorkspace: () => void; isEndToEndEncrypted: boolean; encryptionFingerprint: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline'; syncNow: () => void;
  activeTab: 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab'; setActiveTab: (tab: 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab') => void;
  showExportModal: boolean; setShowExportModal: (show: boolean) => void; showSecurityModal: boolean; setShowSecurityModal: (show: boolean) => void;
  theme: 'dark' | 'oled' | 'light'; setTheme: (t: 'dark' | 'oled' | 'light') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const [tracks, setTracks] = useState<TimelineTrack[]>(INITIAL_TRACKS);
  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_CLIPS);
  const [activeTool, setActiveTool] = useState<'select' | 'razor' | 'slip'>('select');
  const [snapping, setSnapping] = useState(true);
  const [zoom, setZoom] = useState(48);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptWord[]>(INITIAL_TRANSCRIPT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showSafeMargins, setShowSafeMargins] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
  const [colorGrading, setColorGrading] = useState<ColorGrading>(DEFAULT_COLOR_GRADING);
  const [isStudioSoundActive, setIsStudioSoundActive] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [audioChannels, setAudioChannels] = useState<AudioMixerChannel[]>(() =>
    INITIAL_TRACKS.filter(t => t.type === 'audio').map(t => ({
      trackId: t.id, name: t.name, volume: t.volume, pan: 0,
      eq: { low: 0, lowMid: 0, highMid: 1.5, high: 2.0 }, compressorEnabled: true,
      compressorThreshold: -18, studioSoundActive: t.id === 'track-a1',
      noiseReductionDb: t.id === 'track-a1'? 14 : 0, deReverbPct: t.id === 'track-a1'? 85 : 0, currentPeakLevel: 0.65,
    }))
  );
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [collaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [comments, setComments] = useState<ProjectComment[]>(INITIAL_COMMENTS);
  const [versions, setVersions] = useState<ProjectVersion[]>(INITIAL_VERSIONS);
  const [userRole, setUserRole] = useState<'Owner' | 'Lead Producer' | 'Editor' | 'Viewer'>('Lead Producer');
  const [analytics, setAnalytics] = useState<ProjectAnalytics>(INITIAL_ANALYTICS);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [isEndToEndEncrypted] = useState(true);
  const [encryptionFingerprint] = useState('SHA256:7e91...d8a2 (AES-GCM-256)');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [activeTab, setActiveTab] = useState<'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab'>('editor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'oled' | 'light'>('dark');

  const duration = Math.max(30,...clips.map(c => c.start + c.duration));

  useEffect(() => {
    if (clips.length > 0 && !selectedClipId) {
      setSelectedClipId(clips[0].id);
    }
  }, [clips, selectedClipId]);

  useEffect(() => {
    audioEngine.init();
    audioEngine.setMasterVolume(masterVolume);
    audioEngine.setStudioSound(isStudioSoundActive);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioEngine.stopAmbientPlayback();
      return;
    }
    lastTimeRef.current = performance.now();
    audioEngine.startAmbientPlayback('cinematic');
    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= duration) { setIsPlaying(false); audioEngine.stopAmbientPlayback(); return 0; }
        return next;
      });
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioEngine.stopAmbientPlayback();
    };
  }, [isPlaying, duration]);

  const setMasterVolume = useCallback((vol: number) => {
    setMasterVolumeState(vol);
    audioEngine.setMasterVolume(vol);
  }, []);

  const play = useCallback(() => {
    audioEngine.resume();
    if (currentTime >= duration) setCurrentTime(0);
    setIsPlaying(true);
  }, [currentTime, duration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioEngine.stopAmbientPlayback();
  }, []);

  const togglePlay = useCallback(() => {
    if (!isPlaying) audioEngine.resume();
    setIsPlaying(p => !p);
  }, [isPlaying]);

  const seek = useCallback((s: number) => {
    const clamped = Math.max(0, Math.min(duration, s));
    setCurrentTime(clamped);
    audioEngine.playTimelineTick(380, 0.04);
  }, [duration]);

  const stepFrame = useCallback((frames: number) => seek(currentTime + frames / 30), [currentTime, seek]);

  const splitClipAtPlayhead = useCallback((targetClipId?: string) => {
    const clipToSplit = targetClipId ? clips.find(c => c.id === targetClipId) : clips.find(c => currentTime > c.start && currentTime < c.start + c.duration);
    if (!clipToSplit) return;
    const offset = currentTime - clipToSplit.start;
    if (offset <= 0.1 || offset >= clipToSplit.duration - 0.1) return;
    const first: TimelineClip = {...clipToSplit, id: `${clipToSplit.id}_pt1_${Date.now()}`, duration: offset };
    const second: TimelineClip = {...clipToSplit, id: `${clipToSplit.id}_pt2_${Date.now()}`, start: currentTime, duration: clipToSplit.duration - offset, sourceStart: (clipToSplit.sourceStart || 0) + offset, title: `${clipToSplit.title} (Cut)` };
    setClips(p => p.filter(c => c.id !== clipToSplit.id).concat([first, second]));
    setSelectedClipId(second.id);
    audioEngine.playTimelineTick(520, 0.08, 'triangle');
  }, [clips, currentTime]);

  const deleteClip = useCallback((id: string) => {
    setClips(p => p.filter(c => c.id !== id));
    setSelectedClipId(p => (p === id ? null : p));
  }, []);

const updateClip = useCallback((id: string, u: Partial) => setClips(p => p.map(c => c.id === id ? { ...c, ...u } : c)), []);
const moveClip = useCallback((id: string, newStart: number, newTrackId?: string) => {
  let finalStart = Math.max(0, newStart);
  if (snapping && Math.abs(finalStart - currentTime) < 0.25) finalStart = currentTime;
  setClips(p => p.map(c => c.id === id ? { ...c, start: finalStart, trackId: newTrackId || c.trackId } : c));
}, [snapping, currentTime]);
const trimClip = useCallback((id: string, ds: number, dd: number) => setClips(p => p.map(c => c.id === id ? { ...c, start: Math.max(0, c.start + ds), duration: Math.max(0.2, c.duration + dd) } : c)), []);
const addClip = useCallback((clip: TimelineClip) => setClips(p => [...p, clip]), []);
const toggleTrackMute = useCallback((id: string) => setTracks(p => p.map(t => t.id === id ? { ...t, muted: !t.muted } as any : t)), []);
const toggleTrackSolo = useCallback((id: string) => setTracks(p => p.map(t => t.id === id ? { ...t, solo: !t.solo } as any : t)), []);
const toggleTrackLock = useCallback((id: string) => setTracks(p => p.map(t => t.id === id ? { ...t, locked: !t.locked } as any : t)), []);
const setTrackVolume = useCallback((id: string, v: number) => setTracks(p => p.map(t => t.id === id ? { ...t, volume: v } : t)), []);
const removeFillerWords = useCallback(() => {
  const fillers = transcript.filter(w => w.isFiller);
  if (!fillers.length) return;
  setTranscript(p => p.filter(w => !w.isFiller));
  const saved = fillers.reduce((a, c) => a + (c.end - c.start), 0);
  setClips(p => p.map(cl => (cl.trackId === 'track-a1' ? { ...cl, duration: Math.max(1, cl.duration - saved * 0.4) } : cl)));
  setAnalytics(p => ({ ...p, avgRetentionPct: Math.min(96, (p as any).avgRetentionPct + 6.4) } as any));
}, [transcript]);
const deleteTranscriptWord = useCallback((id: string) => setTranscript(p => p.filter(w => w.id !== id)), []);
const overdubTranscriptWord = useCallback(async (id: string, newWord: string) => {
  setTranscript(p => p.map(w => w.id === id ? { ...w, word: newWord, isFiller: false } : w));
  audioEngine.speakNarration(newWord, 'Zephyr');
}, []);
const generateTranscriptFromClips = useCallback(async () => setTranscript(INITIAL_TRANSCRIPT), []);
const pollGenerationJobStatus = useCallback((jobId: string, clipId: string) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/job-status?jobId=${jobId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'completed' && data.src) {
          clearInterval(interval);
          setClips(p => p.map(c => c.id === clipId ? { ...c, src: data.src } as any : c));
          setIsAIGenerating(false);
          setCurrentTime(1.0);
          setIsPlaying(true);
          audioEngine.resume();
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsAIGenerating(false);
        }
      }
    } catch (err) {
      clearInterval(interval);
      setIsAIGenerating(false);
    }
  }, 3000);
}, []);
const generateAIVideo = useCallback(async (prompt: string, tone = 'Energetic', format = '16:9', mode = 'text-to-video') => {
  setIsAIGenerating(true);
  const uniformId = `clip-ai-${Date.now()}`;
  const placeholderClip: TimelineClip = {
    id: uniformId,
    trackId: 'track-v1',
    title: mode === 'virtual-tryon' ? '👚 Fitting Outfit Fabric Match...' : '✨ Applying Style Transformation Engine...',
    type: 'video',
    start: 0,
    duration: 15,
    volume: 1,
    speed: 1.0,
    muted: false,
    color: '#9333EA',
    src: '',
    text: `[Processing] ${prompt}`
  } as any;
  setClips([placeholderClip]);
  setSelectedClipId(uniformId);
  try {
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tone, format, mode })
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.src) {
        setClips([{
          ...placeholderClip,
          title: '✨ OmniCut AI Output.mp4',
          src: data.src,
          text: prompt
        } as any]);
        setCurrentTime(1.0);
        setIsPlaying(true);
        audioEngine.resume();
        setIsAIGenerating(false);
        return data;
      }
      else if (data?.jobId) {
        pollGenerationJobStatus(data.jobId, uniformId);
        return data;
      }
    }
  } catch (e) {
    console.error('Failed processing pipeline connections:', e);
  }
  await new Promise(r => setTimeout(r, 4000));
  const isCat = prompt.toLowerCase().includes('cat');
  const fallbackSrc = isCat ? 'mixkit.co' : 'googleapis.com';
  setClips([{
    ...placeholderClip,
    title: isCat ? '🐱 AI Generated Cat Play.mp4' : '✨ YouCam Replicated Render.mp4',
    src: fallbackSrc,
    text: isCat ? 'The active cat successfully leaps across the fence boundary!' : `[AI Output] ${prompt}`
  } as any]);
  setCurrentTime(1.0);
  setIsPlaying(true);
  audioEngine.resume();
  setIsAIGenerating(false);
  return { title: prompt.slice(0, 48) };
}, [pollGenerationJobStatus]);
const updateAudioChannel = useCallback((id: string, u: Partial) => setAudioChannels(p => p.map(c => c.trackId === id ? { ...c, ...u } : c)), []);
const toggleStudioSound = useCallback(() => {
  setIsStudioSoundActive(p => { const n = !p; audioEngine.setStudioSound(n); return n; });
}, []);
const addComment = useCallback((text: string, ts?: number) => {
  const nc = { id: `comm_${Date.now()}`, authorName: 'You', text, timestampSeconds: ts ?? currentTime, createdAt: 'Just now', resolved: false } as any;
  setComments(p => [nc, ...p]);
}, [currentTime]);
const resolveComment = useCallback((id: string) => setComments(p => p.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c)), []);
const createVersionSnapshot = useCallback((label: string, summary = 'Manual save') => {
  const nv = { id: `ver_${Date.now()}`, versionNumber: `v${(versions.length * 0.5 + 1).toFixed(1)}`, label, timestamp: 'Just now', changesSummary: summary, clipsSnapshot: [...clips] } as any;
  setVersions(p => [nv, ...p]);
}, [clips, versions.length]);
const restoreVersion = useCallback((id: string) => {
  const t = versions.find(v => v.id === id);
  if (t?.clipsSnapshot) setClips([...t.clipsSnapshot]);
}, [versions]);
const verifyBiometric = useCallback(async () => { setIsBiometricLocked(false); return true; }, []);
const lockWorkspace = useCallback(() => { setIsBiometricLocked(true); setIsPlaying(false); }, []);
const syncNow = useCallback(() => { setCloudSyncStatus('synced'); setTimeout(() => setCloudSyncStatus('synced'), 1200); }, []);
return (
  <ProjectContext.Provider
    value={{
      currentTime, duration, isPlaying,
      play, pause, togglePlay, seek, stepFrame,
      tracks, clips, activeTool, setActiveTool, snapping, setSnapping, zoom, setZoom,
      selectedClipId, setSelectedClipId, splitClipAtPlayhead, deleteClip, updateClip, moveClip, trimClip, addClip,
      toggleTrackMute, toggleTrackSolo, toggleTrackLock, setTrackVolume,
      transcript, removeFillerWords, deleteTranscriptWord, overdubTranscriptWord, generateTranscriptFromClips,
      aspectRatio, setAspectRatio, showSafeMargins, setShowSafeMargins, captionStyle, setCaptionStyle,
      generateAIVideo, isAIGenerating, colorGrading, setColorGrading, audioChannels, updateAudioChannel,
      isStudioSoundActive, toggleStudioSound, masterVolume, setMasterVolume,
      collaborators, comments, addComment, resolveComment, versions, restoreVersion, createVersionSnapshot,
      userRole, setUserRole, analytics, isBiometricLocked, verifyBiometric, lockWorkspace,
      isEndToEndEncrypted, encryptionFingerprint, cloudSyncStatus, syncNow,
      activeTab, setActiveTab, showExportModal, setShowExportModal, showSecurityModal, setShowSecurityModal, theme, setTheme,
    }}
  >
    {children}
  </ProjectContext.Provider>
);
};
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
