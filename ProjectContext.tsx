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
} from '../types';
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
} from '../utils/initialProject';
import { audioEngine } from '../utils/audioEngine';
import { matchVideoForPrompt } from '../utils/videoLibrary';

interface ProjectContextType {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  stepFrame: (frames: number) => void;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  activeTool: 'select' | 'razor' | 'slip';
  setActiveTool: (tool: 'select' | 'razor' | 'slip') => void;
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
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  transcript: TranscriptWord[];
  removeFillerWords: () => void;
  deleteTranscriptWord: (wordId: string) => void;
  overdubTranscriptWord: (wordId: string, newWord: string) => Promise<void>;
  generateTranscriptFromClips: () => Promise<void>;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  showSafeMargins: boolean;
  setShowSafeMargins: (show: boolean) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;
  generateAIVideo: (prompt: string, tone?: string, format?: string) => Promise<any>;
  isAIGenerating: boolean;
  colorGrading: ColorGrading;
  setColorGrading: React.Dispatch<React.SetStateAction<ColorGrading>>;
  audioChannels: AudioMixerChannel[];
  updateAudioChannel: (trackId: string, updates: Partial<AudioMixerChannel>) => void;
  isStudioSoundActive: boolean;
  toggleStudioSound: () => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  collaborators: Collaborator[];
  comments: ProjectComment[];
  addComment: (text: string, timestamp?: number) => void;
  resolveComment: (commentId: string) => void;
  versions: ProjectVersion[];
  restoreVersion: (versionId: string) => void;
  createVersionSnapshot: (label: string, summary?: string) => void;
  userRole: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer';
  setUserRole: (role: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer') => void;
  analytics: ProjectAnalytics;
  isBiometricLocked: boolean;
  verifyBiometric: () => Promise<boolean>;
  lockWorkspace: () => void;
  isEndToEndEncrypted: boolean;
  encryptionFingerprint: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  syncNow: () => void;
  activeTab: 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab';
  setActiveTab: (tab: 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab') => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  showSecurityModal: boolean;
  setShowSecurityModal: (show: boolean) => void;
  theme: 'dark' | 'oled' | 'light';
  setTheme: (t: 'dark' | 'oled' | 'light') => void;
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
  const [selectedClipId, setSelectedClipId] = useState<string | null>(INITIAL_CLIPS[0]?.id ?? 'clip-v1-1');
  const [transcript, setTranscript] = useState<TranscriptWord[]>(INITIAL_TRANSCRIPT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showSafeMargins, setShowSafeMargins] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
  const [colorGrading, setColorGrading] = useState<ColorGrading>(DEFAULT_COLOR_GRADING);
  const [isStudioSoundActive, setIsStudioSoundActive] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [audioChannels, setAudioChannels] = useState<AudioMixerChannel[]>(() =>
    INITIAL_TRACKS.filter(t => t.type === 'audio').map(t => ({
      trackId: t.id,
      name: t.name,
      volume: t.volume,
      pan: 0,
      eq: { low: 0, lowMid: 0, highMid: 1.5, high: 2.0 },
      compressorEnabled: true,
      compressorThreshold: -18,
      studioSoundActive: t.id === 'track-a1',
      noiseReductionDb: t.id === 'track-a1' ? 14 : 0,
      deReverbPct: t.id === 'track-a1' ? 85 : 0,
      currentPeakLevel: 0.65,
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

  const duration = Math.max(30, ...clips.map(c => c.start + c.duration));

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
        if (next >= duration) {
          setIsPlaying(false);
          audioEngine.stopAmbientPlayback();
          return 0;
        }
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

  // Fixed: resume audio context on user action to bypass browser auto-play blocks
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
    const clipToSplit = targetClipId
      ? clips.find(c => c.id === targetClipId)
      : clips.find(c => currentTime > c.start && currentTime < c.start + c.duration);
    if (!clipToSplit) return;
    const offset = currentTime - clipToSplit.start;
    if (offset <= 0.1 || offset >= clipToSplit.duration - 0.1) return;
    const first: TimelineClip = { ...clipToSplit, id: `${clipToSplit.id}_pt1_${Date.now()}`, duration: offset };
    const second: TimelineClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_pt2_${Date.now()}`,
      start: currentTime,
      duration: clipToSplit.duration - offset,
      sourceStart: (clipToSplit.sourceStart || 0) + offset,
      title: `${clipToSplit.title} (Cut)`,
    };
    setClips(p => p.filter(c => c.id !== clipToSplit.id).concat([first, second]));
    setSelectedClipId(second.id);
    audioEngine.playTimelineTick(520, 0.08, 'triangle');
  }, [clips, currentTime]);

  const deleteClip = useCallback((id: string) => {
    setClips(p => p.filter(c => c.id !== id));
    setSelectedClipId(p => (p === id ? null : p));
  }, []);

  const updateClip = useCallback((id: string, u: Partial<TimelineClip>) => {
    setClips(p => p.map(c => (c.id === id ? { ...c, ...u } : c)));
  }, []);

  const moveClip = useCallback((id: string, newStart: number, newTrackId?: string) => {
    let finalStart = Math.max(0, newStart);
    if (snapping && Math.abs(finalStart - currentTime) < 0.25) finalStart = currentTime;
    setClips(p => p.map(c => (c.id === id ? { ...c, start: finalStart, trackId: newTrackId || c.trackId } : c)));
  }, [snapping, currentTime]);

  const trimClip = useCallback((id: string, ds: number, dd: number) => {
    setClips(p => p.map(c => (c.id === id ? { ...c, start: Math.max(0, c.start + ds), duration: Math.max(0.2, c.duration + dd) } : c)));
  }, []);

  const addClip = useCallback((clip: TimelineClip) => setClips(p => [...p, clip]), []);
  const toggleTrackMute = useCallback((id: string) => setTracks(p => p.map(t => (t.id === id ? { ...t, muted: !t.muted } as any : t))), []);
  const toggleTrackSolo = useCallback((id: string) => setTracks(p => p.map(t => (t.id === id ? { ...t, solo: !t.solo } as any : t))), []);
  const toggleTrackLock = useCallback((id: string) => setTracks(p => p.map(t => (t.id === id ? { ...t, locked: !t.locked } as any : t))), []);
  const setTrackVolume = useCallback((id: string, v: number) => setTracks(p => p.map(t => (t.id === id ? { ...t, volume: v } : t))), []);

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
    setTranscript(p => p.map(w => (w.id === id ? { ...w, word: newWord, isFiller: false } : w)));
    audioEngine.speakNarration(newWord, 'Zephyr');
  }, []);

  const generateTranscriptFromClips = useCallback(async () => setTranscript(INITIAL_TRANSCRIPT), []);

  // Robust AI Video Generation engine with live video matching and multi-scene assembly
  const generateAIVideo = useCallback(async (prompt: string, tone = 'engaging', format = '16:9') => {
    setIsAIGenerating(true);

    let scriptData: any = null;
    try {
      const resp = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, format, duration: '20s' }),
      });
      if (resp.ok) {
        scriptData = await resp.json();
      }
    } catch (e) {
      console.warn('API script generation warning, using local AI director fallback:', e);
    }

    // Default scenes if API response is not available
    const isCat = prompt.toLowerCase().includes('cat') || prompt.toLowerCase().includes('kitten');
    const isOcean = prompt.toLowerCase().includes('ocean') || prompt.toLowerCase().includes('sea') || prompt.toLowerCase().includes('water');
    const isSunset = prompt.toLowerCase().includes('sunset') || prompt.toLowerCase().includes('drone') || prompt.toLowerCase().includes('sky');

    const defaultScenes = isCat
      ? [
          {
            title: 'Scene 01: The Feline Stalker',
            duration: 5,
            narration: 'Meet Luna the agile ginger cat, scanning the yard for her next move.',
            visualPrompt: 'cat jumping playing feline agility pet',
            overlayText: '🐱 INCOMING JUMP: 3... 2... 1...',
          },
          {
            title: 'Scene 02: Maximum Velocity Leap',
            duration: 6,
            narration: 'She coils her back legs and launches through the air with effortless grace.',
            visualPrompt: 'cat jumping backwards acrobatic leap',
            overlayText: '🚀 ACROBATIC LAUNCH ACTIVATED',
          },
          {
            title: 'Scene 03: Flawless Hero Landing',
            duration: 5,
            narration: 'Paws down, tail up, landing complete with total feline composure.',
            visualPrompt: 'cat pet cute grooming',
            overlayText: '✨ 10/10 PERFECT LANDING',
          },
        ]
      : isOcean
      ? [
          {
            title: 'Scene 01: Deep Blue Swell',
            duration: 5,
            narration: 'The rhythmic pull of the tides speaks to the soul of every explorer.',
            visualPrompt: 'ocean sea water beach coast',
            overlayText: '🌊 MAJESTIC OCEAN VISTAS',
          },
          {
            title: 'Scene 02: Rolling Coastline Waves',
            duration: 6,
            narration: 'Crystal blue waters cresting under the infinite afternoon horizon.',
            visualPrompt: 'waves surf coastal paradise',
            overlayText: '🏄 UNTAMED NATURE IN 4K',
          },
          {
            title: 'Scene 03: Sunset Over Water',
            duration: 5,
            narration: 'Where the sea meets the sky in a breathtaking symphony of light.',
            visualPrompt: 'ocean sunset drone water',
            overlayText: '✨ BREATHTAKING EXPEDITION',
          },
        ]
      : isSunset
      ? [
          {
            title: 'Scene 01: Golden Hour Horizon',
            duration: 5,
            narration: 'As golden hour hits, the sky transforms into pure cinematic wonder.',
            visualPrompt: 'sunset golden bridge drone timelapse',
            overlayText: '🌅 THE GOLDEN HOUR ASCENT',
          },
          {
            title: 'Scene 02: Skyline Silhouette',
            duration: 6,
            narration: 'Suspension cables and clouds drifting in synchronized harmony.',
            visualPrompt: 'golden gate bridge timelapse drone aerial',
            overlayText: '⚡ ICONIC AERIAL PERSPECTIVE',
          },
          {
            title: 'Scene 03: Twilight Illumination',
            duration: 5,
            narration: 'The city awakens as dusk settles over the bay.',
            visualPrompt: 'city skyline sunset timelapse',
            overlayText: '🌆 CINEMATIC DUSK MASTER',
          },
        ]
      : [
          {
            title: 'Scene 01: The Viral Hook',
            duration: 5,
            narration: `In 2026, the way content is created changed forever: ${prompt.slice(0, 40)}.`,
            visualPrompt: prompt,
            overlayText: '⚡ STOP SCROLLING: THE FUTURE IS HERE',
          },
          {
            title: 'Scene 02: Instant AI Synthesis',
            duration: 6,
            narration: 'From a single text prompt to complete multitrack video scenes in seconds.',
            visualPrompt: `${prompt} tech cyber action future`,
            overlayText: '🎬 REAL-TIME GENERATIVE VIDEO',
          },
          {
            title: 'Scene 03: High-Retention Master',
            duration: 5,
            narration: 'Text editing, automated subtitles, and 4K exports ready for every platform.',
            visualPrompt: `${prompt} visual climax showcase`,
            overlayText: '🚀 READY FOR YOUTUBE & TIKTOK',
          },
        ];

    const rawScenes = scriptData?.scenes && scriptData.scenes.length > 0 ? scriptData.scenes : defaultScenes;

    const newClips: TimelineClip[] = [];
    const newTranscript: TranscriptWord[] = [];
    let currentTimelineStart = 0;
    let wordIdCounter = 1;

    rawScenes.slice(0, 4).forEach((sc: any, idx: number) => {
      const sceneDuration = Math.max(3.5, Number(sc.duration) || 5.5);
      const matchedVideo = matchVideoForPrompt(sc.visualPrompt || sc.brollKeyword || prompt, idx);

      // 1. Primary Video Clip on Track V1
      const videoClipId = `clip-ai-v1-${idx}-${Date.now()}`;
      newClips.push({
        id: videoClipId,
        trackId: 'track-v1',
        title: `${matchedVideo.title} (Scene ${idx + 1})`,
        type: 'video',
        start: currentTimelineStart,
        duration: sceneDuration,
        volume: 1,
        speed: 1.0,
        muted: false,
        color: matchedVideo.color,
        visualTag: matchedVideo.visualTag,
        src: matchedVideo.src,
        text: sc.overlayText || `[Scene ${idx + 1}] ${prompt.slice(0, 36)}`,
      } as any);

      // 2. Graphic / Overlay Badge on Track V2
      newClips.push({
        id: `clip-ai-v2-${idx}-${Date.now()}`,
        trackId: 'track-v2',
        title: sc.title || `Scene ${idx + 1}`,
        type: 'overlay',
        start: currentTimelineStart + 0.5,
        duration: Math.max(2, sceneDuration - 1.2),
        volume: 0.8,
        speed: 1,
        muted: false,
        color: '#EC4899',
      } as any);

      // 3. Smart Captions on Track CC
      newClips.push({
        id: `clip-ai-cc-${idx}-${Date.now()}`,
        trackId: 'track-captions',
        title: `Caption ${idx + 1}`,
        type: 'caption',
        start: currentTimelineStart + 0.2,
        duration: sceneDuration - 0.4,
        volume: 1,
        speed: 1,
        muted: false,
        color: '#F59E0B',
        text: sc.overlayText || sc.narration || prompt.slice(0, 36),
      } as any);

      // 4. Voiceover & Spoken Dialogue on Track A1
      newClips.push({
        id: `clip-ai-a1-${idx}-${Date.now()}`,
        trackId: 'track-a1',
        title: `Voiceover: Scene ${idx + 1}`,
        type: 'audio',
        start: currentTimelineStart,
        duration: sceneDuration,
        volume: 0.95,
        speed: 1,
        muted: false,
        color: '#10B981',
      } as any);

      // 5. Build synchronized word-by-word Descript transcript
      const words = (sc.narration || `AI Scene ${idx + 1} generated for ${prompt}`)
        .split(/\s+/)
        .filter(Boolean);
      const wordDuration = sceneDuration / Math.max(1, words.length);

      words.forEach((w: string, wIdx: number) => {
        const wStart = currentTimelineStart + wIdx * wordDuration;
        const isFiller = ['um', 'uh', 'like', 'basically', 'you know'].includes(w.toLowerCase().replace(/[^a-z]/g, ''));
        newTranscript.push({
          id: `w-gen-${wordIdCounter++}`,
          word: w,
          start: parseFloat(wStart.toFixed(2)),
          end: parseFloat((wStart + wordDuration * 0.9).toFixed(2)),
          isFiller,
          confidence: 0.98,
        });
      });

      currentTimelineStart += sceneDuration;
    });

    // 6. Background Score on Track A2 spanning the whole duration
    newClips.push({
      id: `clip-ai-a2-${Date.now()}`,
      trackId: 'track-a2',
      title: `Soundtrack: ${tone.toUpperCase()} Ambient Score`,
      type: 'audio',
      start: 0,
      duration: currentTimelineStart,
      volume: 0.35,
      speed: 1,
      muted: false,
      color: '#8B5CF6',
    } as any);

    setClips(newClips);
    setTranscript(newTranscript);
    if (newClips[0]) setSelectedClipId(newClips[0].id);
    setCurrentTime(0);

    // Auto-resume audio engine and commence playback
    audioEngine.resume();
    setIsPlaying(true);
    setIsAIGenerating(false);

    const projectTitle = scriptData?.projectTitle || prompt.slice(0, 42);
    return { title: projectTitle, projectTitle };
  }, []);

  const updateAudioChannel = useCallback((id: string, u: Partial<AudioMixerChannel>) => {
    setAudioChannels(p => p.map(c => (c.trackId === id ? { ...c, ...u } : c)));
  }, []);

  const toggleStudioSound = useCallback(() => {
    setIsStudioSoundActive(p => {
      const n = !p;
      audioEngine.setStudioSound(n);
      return n;
    });
  }, []);

  const addComment = useCallback((text: string, ts?: number) => {
    const nc = { id: `comm_${Date.now()}`, authorName: 'You', text, timestampSeconds: ts ?? currentTime, createdAt: 'Just now', resolved: false } as any;
    setComments(p => [nc, ...p]);
  }, [currentTime]);

  const resolveComment = useCallback((id: string) => {
    setComments(p => p.map(c => (c.id === id ? { ...c, resolved: !c.resolved } : c)));
  }, []);

  const createVersionSnapshot = useCallback((label: string, summary = 'Manual save') => {
    const nv = { id: `ver_${Date.now()}`, versionNumber: `v${(versions.length * 0.5 + 1).toFixed(1)}`, label, timestamp: 'Just now', changesSummary: summary, clipsSnapshot: [...clips] } as any;
    setVersions(p => [nv, ...p]);
  }, [clips, versions.length]);

  const restoreVersion = useCallback((id: string) => {
    const t = versions.find(v => v.id === id);
    if (t?.clipsSnapshot) setClips([...t.clipsSnapshot]);
  }, [versions]);

  const verifyBiometric = useCallback(async () => {
    setIsBiometricLocked(false);
    return true;
  }, []);

  const lockWorkspace = useCallback(() => {
    setIsBiometricLocked(true);
    setIsPlaying(false);
  }, []);

  const syncNow = useCallback(() => {
    setCloudSyncStatus('syncing');
    setTimeout(() => setCloudSyncStatus('synced'), 1200);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        currentTime,
        duration,
        isPlaying,
        play,
        pause,
        togglePlay,
        seek,
        stepFrame,
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
        updateClip,
        moveClip,
        trimClip,
        addClip,
        toggleTrackMute,
        toggleTrackSolo,
        toggleTrackLock,
        setTrackVolume,
        transcript,
        removeFillerWords,
        deleteTranscriptWord,
        overdubTranscriptWord,
        generateTranscriptFromClips,
        aspectRatio,
        setAspectRatio,
        showSafeMargins,
        setShowSafeMargins,
        captionStyle,
        setCaptionStyle,
        generateAIVideo,
        isAIGenerating,
        colorGrading,
        setColorGrading,
        audioChannels,
        updateAudioChannel,
        isStudioSoundActive,
        toggleStudioSound,
        masterVolume,
        setMasterVolume,
        collaborators,
        comments,
        addComment,
        resolveComment,
        versions,
        restoreVersion,
        createVersionSnapshot,
        userRole,
        setUserRole,
        analytics,
        isBiometricLocked,
        verifyBiometric,
        lockWorkspace,
        isEndToEndEncrypted,
        encryptionFingerprint,
        cloudSyncStatus,
        syncNow,
        activeTab,
        setActiveTab,
        showExportModal,
        setShowExportModal,
        showSecurityModal,
        setShowSecurityModal,
        theme,
        setTheme,
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
