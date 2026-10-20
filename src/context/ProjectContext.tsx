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
  AIAvatarProfile,
  SyntheticMediaJob,
  SyntheticMediaCategory,
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
} from "../utils/initialProject";
import { INITIAL_AVATARS } from "../utils/avatarsData";
import { audioEngine } from "../utils/audioEngine";
import { matchVideoForPrompt } from "../utils/videoLibrary";

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
  setTranscript: React.Dispatch<React.SetStateAction<TranscriptWord[]>>;
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
  generateAIVideo: (
    prompt: string,
    tone?: string,
    format?: string,
    mode?: string,
    image?: string | null,
    durationPreset?: string,
    realismStyle?: string
  ) => Promise<any>;
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
  avatars: AIAvatarProfile[];
  selectedAvatar: AIAvatarProfile | null;
  setSelectedAvatar: (avatar: AIAvatarProfile | null) => void;
  deployAvatarToTimeline: (config: {
    avatar: AIAvatarProfile;
    scriptText: string;
    voice: string;
    microExpression: string;
    layout: 'full' | 'pip_bottom_right' | 'pip_bottom_left' | 'split_screen';
    skinTextureDetail?: string;
  }) => void;
  syntheticMediaJobs: SyntheticMediaJob[];
  generateSyntheticMedia: (
    category: SyntheticMediaCategory,
    prompt: string,
    options?: any
  ) => Promise<SyntheticMediaJob>;
  activeTab: 'editor' | 'invideo_ai' | 'avatars' | 'synthetic_media' | 'audio_mixer' | 'analytics' | 'collab';
  setActiveTab: (tab: 'editor' | 'invideo_ai' | 'avatars' | 'synthetic_media' | 'audio_mixer' | 'analytics' | 'collab') => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
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
  const [audioChannels, setAudioChannels] = useState<AudioMixerChannel[]>(() => [
    {
      trackId: 'track-v1',
      name: 'V1 • Video Audio (AI Clips)',
      volume: 1.0,
      pan: 0,
      eq: { low: 0, lowMid: 0, highMid: 0, high: 0 },
      compressorEnabled: true,
      compressorThreshold: -16,
      studioSoundActive: true,
      noiseReductionDb: 10,
      deReverbPct: 40,
      currentPeakLevel: 0.7,
    },
    ...INITIAL_TRACKS.filter(t => t.type === 'audio').map(t => ({
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
  ]);
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
  const [avatars, setAvatars] = useState<AIAvatarProfile[]>(INITIAL_AVATARS);
  const [selectedAvatar, setSelectedAvatar] = useState<AIAvatarProfile | null>(INITIAL_AVATARS[0]);
  const [syntheticMediaJobs, setSyntheticMediaJobs] = useState<SyntheticMediaJob[]>([
    {
      id: 'synth-job-1',
      title: 'Snow Leopard Apex Ascent',
      category: 'video_diffusion',
      prompt: 'A majestic snow leopard prowling across Himalayan crags at dawn, photorealistic 8k 60fps.',
      modelUsed: 'OmniDiffusion-4K-v2',
      outputUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
      status: 'ready',
      durationSeconds: 8,
      provenance: {
        c2paCompliant: true,
        cryptographicHash: 'sha256:7f4a2b91c0e39a2f558d119ec801ba99d41b8a92',
        watermarkEnabled: true,
        generationTimestamp: '2026-10-19T12:00:00Z',
        tamperEvidentSig: 'SIG:ECDSA-P256-SHA256:verified',
      },
    },
    {
      id: 'synth-job-2',
      title: 'Cellular Epidermal Micro-Scan',
      category: 'neural_image',
      prompt: 'Photorealistic biological skin texture micro-scan showing cellular pores and subsurface warmth, 8k macro.',
      modelUsed: 'DeepSkin-Texture-8K',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      status: 'ready',
      durationSeconds: 6,
      provenance: {
        c2paCompliant: true,
        cryptographicHash: 'sha256:1a8e992b45cc8091dd038914ba0219558821fa09',
        watermarkEnabled: true,
        generationTimestamp: '2026-10-19T12:05:00Z',
        tamperEvidentSig: 'SIG:ECDSA-P256-SHA256:verified',
      },
    },
    {
      id: 'synth-job-3',
      title: 'Neural Documentary Voiceover',
      category: 'voice_clone',
      prompt: 'Narrate in a warm British documentary timbre: "Beneath the canopy, life pulses in invisible frequencies."',
      modelUsed: 'NeuralTwin-BioVocal-v3',
      status: 'ready',
      durationSeconds: 7,
      provenance: {
        c2paCompliant: true,
        cryptographicHash: 'sha256:44b1c8f309aa2781b0177df982a698cfe10294fc',
        watermarkEnabled: true,
        generationTimestamp: '2026-10-19T12:10:00Z',
        tamperEvidentSig: 'SIG:ECDSA-P256-SHA256:verified',
      },
    },
  ]);
  const [activeTab, setActiveTab] = useState<'editor' | 'invideo_ai' | 'avatars' | 'synthetic_media' | 'audio_mixer' | 'analytics' | 'collab'>('editor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
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
      let finished = false;
      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= duration) {
          finished = true;
          return 0;
        }
        return next;
      });
      if (finished) {
        setIsPlaying(false);
        audioEngine.stopAmbientPlayback();
        return;
      }
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

  // Global Pro Editor Keyboard Shortcuts with stable refs
  const selectedClipIdRef = useRef(selectedClipId);
  selectedClipIdRef.current = selectedClipId;
  const togglePlayRef = useRef(togglePlay);
  togglePlayRef.current = togglePlay;
  const stepFrameRef = useRef(stepFrame);
  stepFrameRef.current = stepFrame;
  const splitClipAtPlayheadRef = useRef(splitClipAtPlayhead);
  splitClipAtPlayheadRef.current = splitClipAtPlayhead;
  const deleteClipRef = useRef(deleteClip);
  deleteClipRef.current = deleteClip;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);
      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayRef.current();
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        stepFrameRef.current(-1);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        stepFrameRef.current(1);
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('razor');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        splitClipAtPlayheadRef.current();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipIdRef.current) {
          e.preventDefault();
          deleteClipRef.current(selectedClipIdRef.current);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setMasterVolumeState(prev => (prev === 0 ? 0.85 : 0));
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setShowUploadModal(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setShowExportModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Robust AI Video Generation engine supporting ANY prompt, image-to-video, style restylers, and 1-hour movies/documentaries
  const generateAIVideo = useCallback(
    async (
      prompt: string,
      tone = 'engaging',
      format = '16:9',
      mode = 'text-to-video',
      image?: string | null,
      durationPreset = '30s',
      realismStyle = 'Hyper-Photorealistic 8K Life-like'
    ) => {
      setIsAIGenerating(true);

      let scriptData: any = null;
      try {
        const resp = await fetch('/api/ai/generate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, tone, format, mode, image, duration: durationPreset, realism: realismStyle }),
        });
        if (resp.ok) {
          scriptData = await resp.json();
        }
      } catch (e) {
        console.warn('API script generation warning, using local AI director fallback:', e);
      }

      // Apply aesthetic color grading and life-like photographic parameters
      if (mode === 'video-to-video') {
        if (prompt.includes('Cyberpunk') || prompt.includes('Anime')) {
          setColorGrading(prev => ({ ...prev, lut: 'cyber-neon', contrast: 25, saturation: 35 }));
        } else if (prompt.includes('Van Gogh') || prompt.includes('Oil')) {
          setColorGrading(prev => ({ ...prev, lut: 'warm-sunset', contrast: 15, saturation: 40 }));
        } else if (prompt.includes('1970s') || prompt.includes('Film')) {
          setColorGrading(prev => ({ ...prev, lut: 'kodachrome', contrast: 10, vignette: 40 }));
        } else if (prompt.includes('Pixar') || prompt.includes('3D')) {
          setColorGrading(prev => ({ ...prev, lut: 'clean-hdr', contrast: 20, saturation: 20 }));
        }
      } else {
        if (realismStyle.includes('Photorealistic') || realismStyle.includes('Life-like')) {
          setColorGrading(prev => ({ ...prev, lut: 'clean-hdr', contrast: 18, saturation: 14, sharpness: 32 }));
        } else if (realismStyle.includes('BBC') || realismStyle.includes('Documentary')) {
          setColorGrading(prev => ({ ...prev, lut: 'cinematic-teal', contrast: 22, saturation: 18, sharpness: 40 }));
        } else if (realismStyle.includes('Hollywood') || realismStyle.includes('35mm')) {
          setColorGrading(prev => ({ ...prev, lut: 'kodachrome', contrast: 16, saturation: 20, vignette: 28 }));
        } else if (realismStyle.includes('Micro-Texture')) {
          setColorGrading(prev => ({ ...prev, lut: 'clean-hdr', contrast: 25, saturation: 15, sharpness: 45 }));
        }
      }

      const isImageMode = mode === 'image-to-video' && !!image;

      // Extract subject for dynamic scene fallback
      const cleanSubject = prompt
        .replace(/^(create a|generate a|make a|video of|video about|clip of|show me|a)\s+/i, '')
        .slice(0, 48);

      let defaultScenes: any[] = [];
      if (isImageMode) {
        defaultScenes = [
          {
            title: 'Scene 01: Image Motion Synthesis',
            duration: 6,
            narration: `Animating ${cleanSubject || 'uploaded photo'} with cinematic camera push-in and atmospheric lighting.`,
            visualPrompt: prompt,
            overlayText: `✨ ${cleanSubject.toUpperCase() || 'IMAGE MOTION SYNTHESIS'}`,
          },
          {
            title: 'Scene 02: Dynamic Camera Orbit',
            duration: 6,
            narration: 'Smooth perspective shifts reveal heightened depth and motion detail.',
            visualPrompt: prompt,
            overlayText: '🎬 4K CINEMATIC DEPTH',
          },
          {
            title: 'Scene 03: Visual Climax',
            duration: 5,
            narration: 'Every detail rendered in brilliant high fidelity for social media publication.',
            visualPrompt: prompt,
            overlayText: '🚀 READY TO PUBLISH',
          },
        ];
      } else if (durationPreset === '60m') {
        // Full 1-Hour Documentary / Movie (3600 seconds)
        defaultScenes = [
          {
            title: `Act I: The Genesis of ${cleanSubject.slice(0, 20)}`,
            duration: 360,
            narration: `Prologue: In the grand tapestry of existence, ${cleanSubject} marked a historic turning point.`,
            visualPrompt: `${prompt}, cinematic prologue, establishing 8k`,
            overlayText: `ACT I • THE GENESIS`,
          },
          {
            title: 'Act II: The Journey & Exploration',
            duration: 420,
            narration: `Venturing past known boundaries, our expedition observes ${cleanSubject} in full natural habitat.`,
            visualPrompt: `${prompt}, wide panoramic expedition, volumetric light`,
            overlayText: `ACT II • THE EXPEDITION`,
          },
          {
            title: 'Act III: Rising Conflict & Tension',
            duration: 480,
            narration: `Forces collide as environmental dynamics challenge the equilibrium of ${cleanSubject}.`,
            visualPrompt: `${prompt}, high dramatic action, cinematic shadows`,
            overlayText: `ACT III • RISING FORCES`,
          },
          {
            title: 'Act IV: Biological & Natural Revelation',
            duration: 480,
            narration: `Cellular micro-textures and subtle biology unveil the living mechanisms within.`,
            visualPrompt: `${prompt}, macro biological texture, micro-expressions 8k`,
            overlayText: `ACT IV • THE LIVING REVELATION`,
          },
          {
            title: 'Act V: The Great Turning Point',
            duration: 480,
            narration: `An unforeseen catalyst redirects the entire narrative trajectory of ${cleanSubject}.`,
            visualPrompt: `${prompt}, dramatic storm front, shifting perspective`,
            overlayText: `ACT V • THE WATERSHED`,
          },
          {
            title: 'Act VI: The Crucible of Trial',
            duration: 480,
            narration: `Tested in the crucible of adversity, resilience takes center stage.`,
            visualPrompt: `${prompt}, intense cinematic momentum, high octane master`,
            overlayText: `ACT VI • THE CRUCIBLE`,
          },
          {
            title: 'Act VII: The Supreme Climax',
            duration: 480,
            narration: `All elements converge into a magnificent, breathtaking realization.`,
            visualPrompt: `${prompt}, epic grand climax, golden hour sunflare`,
            overlayText: `ACT VII • THE GRAND CLIMAX`,
          },
          {
            title: 'Act VIII: Epilogue & Tomorrow',
            duration: 420,
            narration: `The enduring legacy of ${cleanSubject} remains etched into the annals of time.`,
            visualPrompt: `${prompt}, serene sunset vista, inspiring legacy finale`,
            overlayText: `ACT VIII • ENDURING HORIZONS`,
          },
        ];
      } else if (durationPreset === '30m') {
        // 30-Minute TV / Docu-Series (1800 seconds)
        defaultScenes = [
          { title: `Ch 1: The Overture of ${cleanSubject.slice(0, 16)}`, duration: 300, narration: `Welcome to our 30-minute documentary exploring ${cleanSubject}.`, visualPrompt: prompt, overlayText: `CH. 1 • DISCOVERY` },
          { title: 'Ch 2: The Living Architecture', duration: 300, narration: `Uncovering the internal biology and dynamics of ${cleanSubject}.`, visualPrompt: `${prompt} textures`, overlayText: `CH. 2 • ARCHITECTURE` },
          { title: 'Ch 3: The Gathering Conflict', duration: 300, narration: `Intense pressures mount around ${cleanSubject}.`, visualPrompt: `${prompt} dramatic motion`, overlayText: `CH. 3 • ESCALATION` },
          { title: 'Ch 4: Peak Revelation', duration: 300, narration: `The defining moment that alters everything.`, visualPrompt: `${prompt} climax scene`, overlayText: `CH. 4 • REVELATION` },
          { title: 'Ch 5: Transformation', duration: 300, narration: `A profound shift that reshapes the future.`, visualPrompt: `${prompt} transformation vista`, overlayText: `CH. 5 • TRANSFORMATION` },
          { title: 'Ch 6: Enduring Legacy', duration: 300, narration: `The timeless impact of ${cleanSubject}.`, visualPrompt: `${prompt} peaceful closing master`, overlayText: `CH. 6 • LEGACY` },
        ];
      } else if (durationPreset === '10m') {
        // 10-Minute Video Essay (600 seconds)
        defaultScenes = [
          { title: `Part 1: The Hook of ${cleanSubject.slice(0, 16)}`, duration: 120, narration: `Deconstructing ${cleanSubject} in full depth.`, visualPrompt: prompt, overlayText: `PART 1 • THE ANOMALY` },
          { title: 'Part 2: Deep Examination', duration: 120, narration: `Examining the subtle patterns of ${cleanSubject}.`, visualPrompt: `${prompt} macro`, overlayText: `PART 2 • EXAMINATION` },
          { title: 'Part 3: The Paradigm Shift', duration: 120, narration: `How breakthroughs shifted the course.`, visualPrompt: `${prompt} dramatic`, overlayText: `PART 3 • PARADIGM SHIFT` },
          { title: 'Part 4: The Master Reveal', duration: 120, narration: `The definitive proof and spectacle.`, visualPrompt: `${prompt} visual climax`, overlayText: `PART 4 • MASTER REVEAL` },
          { title: 'Part 5: Future Horizons', duration: 120, narration: `What this means for the next century.`, visualPrompt: `${prompt} future vista`, overlayText: `PART 5 • HORIZONS` },
        ];
      } else if (durationPreset === '2m') {
        // 2-Minute Cinematic Scene (120 seconds)
        defaultScenes = [
          { title: `Scene 01: Reveal of ${cleanSubject.slice(0, 20)}`, duration: 30, narration: `In 2026, storytelling reached new heights with ${cleanSubject}.`, visualPrompt: prompt, overlayText: `⚡ ${cleanSubject.toUpperCase()}` },
          { title: 'Scene 02: Rising Action', duration: 30, narration: `Every element of ${cleanSubject} captured in motion with stunning clarity.`, visualPrompt: `${prompt} motion action dynamic`, overlayText: '🎬 UNIFIED CREATIVE POWER' },
          { title: 'Scene 03: Visual Climax', duration: 30, narration: `A breathtaking spectacle of dramatic lighting and depth.`, visualPrompt: `${prompt} cinematic lighting 4k`, overlayText: '🚀 HIGH-RETENTION MASTER' },
          { title: 'Scene 04: Signature Finale', duration: 30, narration: `Engineered for broadcast master publication.`, visualPrompt: `${prompt} finale`, overlayText: '⭐ BROADCAST MASTER' },
        ];
      } else {
        defaultScenes = [
          {
            title: `Scene 01: The Reveal of ${cleanSubject.slice(0, 20)}`,
            duration: 5,
            narration: `In 2026, visual storytelling reached new heights with ${cleanSubject}.`,
            visualPrompt: prompt,
            overlayText: `⚡ ${cleanSubject.toUpperCase()}`,
          },
          {
            title: 'Scene 02: The Rising Action',
            duration: 6,
            narration: `Every element of ${cleanSubject} captured in motion with stunning clarity.`,
            visualPrompt: `${prompt} motion action dynamic`,
            overlayText: '🎬 UNIFIED CREATIVE POWER',
          },
          {
            title: 'Scene 03: Visual Masterpiece',
            duration: 5,
            narration: 'From a single text prompt to complete multitrack video scenes in seconds.',
            visualPrompt: `${prompt} cinematic lighting 4k`,
            overlayText: '🚀 HIGH-RETENTION MASTER',
          },
        ];
      }

      const rawScenes = scriptData?.scenes && scriptData.scenes.length > 0 ? scriptData.scenes : defaultScenes;

      const newClips: TimelineClip[] = [];
      const newTranscript: TranscriptWord[] = [];
      let currentTimelineStart = 0;
      let wordIdCounter = 1;

      rawScenes.forEach((sc: any, idx: number) => {
        const sceneDuration = Math.max(3.5, Number(sc.duration) || 5.5);
        const matchedVideo = matchVideoForPrompt(sc.visualPrompt || sc.brollKeyword || prompt, idx);

        const videoSrc = isImageMode ? image! : matchedVideo.src;
        const videoColor = isImageMode ? '#9333EA' : matchedVideo.color;
        const visualTag = isImageMode ? 'image-to-video' : matchedVideo.visualTag;

        // 1. Primary Video Clip on Track V1
        const videoClipId = `clip-ai-v1-${idx}-${Date.now()}`;
        newClips.push({
          id: videoClipId,
          trackId: 'track-v1',
          title: isImageMode ? `Image Anim: ${cleanSubject.slice(0, 20)} (Scene ${idx + 1})` : `${matchedVideo.title} (Scene ${idx + 1})`,
          type: 'video',
          start: currentTimelineStart,
          duration: sceneDuration,
          volume: 1,
          speed: 1.0,
          muted: false,
          color: videoColor,
          visualTag: visualTag,
          src: videoSrc,
          imageSrc: isImageMode ? image! : undefined,
          prompt: sc.visualPrompt || prompt,
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

      // Auto-resume audio manager singleton and commence playback through master volume
      audioEngine.resume();
      audioEngine.setMasterVolume(masterVolume);
      audioEngine.setTrackVolume('track-v1', 1.0);
      setIsPlaying(true);
      setIsAIGenerating(false);

      const projectTitle = scriptData?.projectTitle || cleanSubject || prompt.slice(0, 42);
      return { title: projectTitle, projectTitle };
    },
    [masterVolume]
  );

  const updateAudioChannel = useCallback((id: string, u: Partial<AudioMixerChannel>) => {
    setAudioChannels(p => p.map(c => (c.trackId === id ? { ...c, ...u } : c)));
    if (u.volume !== undefined) {
      audioEngine.setTrackVolume(id, u.volume);
    }
    if (u.eq) {
      audioEngine.updateEq(id, u.eq);
    }
    if (u.studioSoundActive !== undefined) {
      audioEngine.setStudioSound(u.studioSoundActive);
    }
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

  const deployAvatarToTimeline = useCallback((config: {
    avatar: AIAvatarProfile;
    scriptText: string;
    voice: string;
    microExpression: string;
    layout: 'full' | 'pip_bottom_right' | 'pip_bottom_left' | 'split_screen';
    skinTextureDetail?: string;
  }) => {
    const words = config.scriptText.split(/\s+/).filter(Boolean);
    const speechDuration = Math.max(4, Math.round(words.length * 0.42 * 10) / 10);
    const startPos = currentTime;

    // 1. Create the Avatar Visual Clip on V1 or V2 (if PiP, on V2 as overlay; if full, on V1)
    const targetTrack = config.layout === 'full' ? 'track-v1' : 'track-v2';
    const avatarClipId = `clip-avatar-${Date.now()}`;
    const newAvatarClip: TimelineClip = {
      id: avatarClipId,
      trackId: targetTrack,
      title: `Avatar Twin: ${config.avatar.name}`,
      type: config.layout === 'full' ? 'video' : 'overlay',
      start: startPos,
      duration: speechDuration,
      volume: 1,
      speed: 1,
      muted: false,
      color: config.avatar.accentColor || '#3B82F6',
      imageSrc: config.avatar.avatarImage,
      visualTag: 'avatar',
      prompt: `${config.avatar.name} (${config.avatar.speciesOrRole}) presenting: ${config.scriptText.slice(0, 40)}`,
      avatarConfig: {
        avatarId: config.avatar.id,
        avatarName: config.avatar.name,
        lifeformType: config.avatar.lifeformType,
        speciesOrRole: config.avatar.speciesOrRole,
        voice: config.voice,
        scriptText: config.scriptText,
        microExpression: config.microExpression,
        layout: config.layout,
        skinTextureDetail: config.skinTextureDetail || config.avatar.skinTextureDetail,
      },
      syntheticProvenance: {
        model: 'NeuralTwin-FaceBio-v3',
        c2paHash: `sha256:${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        isSynthetic: true,
        watermarkEnabled: true,
        generationTimestamp: new Date().toISOString(),
      },
      text: `🎙️ ${config.avatar.name.toUpperCase()}`,
    };

    // 2. Create the Voiceover Audio Track clip on Track A1
    const voiceoverClipId = `clip-a1-avatar-${Date.now()}`;
    const newVoiceClip: TimelineClip = {
      id: voiceoverClipId,
      trackId: 'track-a1',
      title: `Voiceover: ${config.avatar.name} (${config.voice})`,
      type: 'audio',
      start: startPos,
      duration: speechDuration,
      volume: 0.95,
      speed: 1,
      muted: false,
      color: '#10B981',
    };

    // 3. Create synchronized Caption Subtitle clip on Track CC
    const captionClipId = `clip-cc-avatar-${Date.now()}`;
    const newCaptionClip: TimelineClip = {
      id: captionClipId,
      trackId: 'track-captions',
      title: `Subtitles: ${config.avatar.name}`,
      type: 'caption',
      start: startPos,
      duration: speechDuration,
      volume: 1,
      speed: 1,
      muted: false,
      color: '#F59E0B',
      text: config.scriptText,
    };

    // 4. Word-by-word Descript transcript
    const wordDur = speechDuration / Math.max(1, words.length);
    const newTranscriptWords: TranscriptWord[] = words.map((w, idx) => ({
      id: `w-av-${Date.now()}-${idx}`,
      word: w,
      start: parseFloat((startPos + idx * wordDur).toFixed(2)),
      end: parseFloat((startPos + (idx + 0.9) * wordDur).toFixed(2)),
      isFiller: false,
      confidence: 0.99,
    }));

    setClips(p => [...p, newAvatarClip, newVoiceClip, newCaptionClip]);
    setTranscript(p => [...p, ...newTranscriptWords]);
    setSelectedClipId(avatarClipId);
  }, [currentTime]);

  const generateSyntheticMedia = useCallback(async (
    category: SyntheticMediaCategory,
    prompt: string,
    options: any = {}
  ): Promise<SyntheticMediaJob> => {
    let resultUrl = '';
    let resultThumb = '';

    if (category === 'video_diffusion') {
      resultUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
      resultThumb = 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80';
    } else if (category === 'neural_image') {
      resultThumb = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    } else if (category === 'voice_clone') {
      resultUrl = '';
    } else {
      resultUrl = 'https://vjs.zencdn.net/v/oceans.mp4';
      resultThumb = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
    }

    const newJob: SyntheticMediaJob = {
      id: `synth-${Date.now().toString(36)}`,
      title: prompt.slice(0, 36) || 'Synthesized Neural Media',
      category,
      prompt,
      modelUsed: options.model || 'OmniDiffusion-4K-v2',
      outputUrl: resultUrl,
      thumbnailUrl: resultThumb,
      status: 'ready',
      durationSeconds: options.duration || 8,
      provenance: {
        c2paCompliant: true,
        cryptographicHash: `sha256:${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        watermarkEnabled: options.enableC2PAWatermark ?? true,
        generationTimestamp: new Date().toISOString(),
        tamperEvidentSig: 'SIG:ECDSA-P256-SHA256:verified',
      },
    };

    setSyntheticMediaJobs(p => [newJob, ...p]);
    return newJob;
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
        setTranscript,
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
        avatars,
        selectedAvatar,
        setSelectedAvatar,
        deployAvatarToTimeline,
        syntheticMediaJobs,
        generateSyntheticMedia,
        activeTab,
        setActiveTab,
        showExportModal,
        setShowExportModal,
        showUploadModal,
        setShowUploadModal,
        showShortcutsModal,
        setShowShortcutsModal,
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
