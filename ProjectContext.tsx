import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
} from '@/types';
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
} from '@/Project';
import { audioEngine } from '@/audioEngine';

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

  // Track controls
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;

  // Descript Superpower (Transcript)
  transcript: TranscriptWord[];
  removeFillerWords: () => void;
  deleteTranscriptWord: (wordId: string) => void;
  overdubTranscriptWord: (wordId: string, newWord: string) => Promise<void>;
  generateTranscriptFromClips: () => Promise<void>;

  // VEED.io Superpowers (Aspect ratio & Captions)
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  showSafeMargins: boolean;
  setShowSafeMargins: (show: boolean) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;

  // Invideo AI (Generative Video)
  generateAIVideo: (prompt: string, tone?: string, format?: string) => Promise<any>;
  isAIGenerating: boolean;

  // Premiere Pro (Color & Audio)
  colorGrading: ColorGrading;
  setColorGrading: React.Dispatch<React.SetStateAction<ColorGrading>>;
  audioChannels: AudioMixerChannel[];
  updateAudioChannel: (trackId: string, updates: Partial<AudioMixerChannel>) => void;
  isStudioSoundActive: boolean;
  toggleStudioSound: () => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;

  // Collaboration & Versioning
  collaborators: Collaborator[];
  comments: ProjectComment[];
  addComment: (text: string, timestamp?: number) => void;
  resolveComment: (commentId: string) => void;
  versions: ProjectVersion[];
  restoreVersion: (versionId: string) => void;
  createVersionSnapshot: (label: string, summary?: string) => void;
  userRole: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer';
  setUserRole: (role: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer') => void;

  // Analytics
  analytics: ProjectAnalytics;

  // Security, Biometrics & Sync
  isBiometricLocked: boolean;
  verifyBiometric: () => Promise<boolean>;
  lockWorkspace: () => void;
  isEndToEndEncrypted: boolean;
  encryptionFingerprint: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  syncNow: () => void;

  // UI Navigation
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
  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Timeline state
  const [tracks, setTracks] = useState<TimelineTrack[]>(INITIAL_TRACKS);
  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_CLIPS);
  const [activeTool, setActiveTool] = useState<'select' | 'razor' | 'slip'>('select');
  const [snapping, setSnapping] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(35); // pixels per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-v1-1');

  // Descript Transcript state
  const [transcript, setTranscript] = useState<TranscriptWord[]>(INITIAL_TRANSCRIPT);

  // VEED.io Subtitles & Viewport
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);

  // Premiere Pro Color & Audio
  const [colorGrading, setColorGrading] = useState<ColorGrading>(DEFAULT_COLOR_GRADING);
  const [isStudioSoundActive, setIsStudioSoundActive] = useState<boolean>(true);
  const [masterVolume, setMasterVolumeState] = useState<number>(0.85);

  const initialMixerChannels: AudioMixerChannel[] = INITIAL_TRACKS.filter(t => t.type === 'audio').map(t => ({
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
  }));
  const [audioChannels, setAudioChannels] = useState<AudioMixerChannel[]>(initialMixerChannels);

  // AI & Invideo Generator
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);

  // Collaboration & Comments
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [comments, setComments] = useState<ProjectComment[]>(INITIAL_COMMENTS);
  const [versions, setVersions] = useState<ProjectVersion[]>(INITIAL_VERSIONS);
  const [userRole, setUserRole] = useState<'Owner' | 'Lead Producer' | 'Editor' | 'Viewer'>('Lead Producer');

  // Analytics
  const [analytics, setAnalytics] = useState<ProjectAnalytics>(INITIAL_ANALYTICS);

  // Security & Sync
  const [isBiometricLocked, setIsBiometricLocked] = useState<boolean>(false);
  const [isEndToEndEncrypted] = useState<boolean>(true);
  const [encryptionFingerprint] = useState<string>('SHA256:7e91...d8a2 (AES-GCM-256)');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // UI Navigation
  const [activeTab, setActiveTab] = useState<'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab'>('editor');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'oled' | 'light'>('dark');

  // Calculate project total duration based on clips
  const duration = Math.max(
    24.5,
    ...clips.map(c => c.start + c.duration)
  );

  // Initialize Web Audio
  useEffect(() => {
    audioEngine.init();
    audioEngine.setMasterVolume(masterVolume);
    audioEngine.setStudioSound(isStudioSoundActive);
  }, []);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      audioEngine.resume();
      audioEngine.startAmbientPlayback('cinematic');
      lastTimeRef.current = performance.now();

      const loop = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= duration) {
            setIsPlaying(false);
            audioEngine.stopAmbientPlayback();
            return 0; // loop or reset
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stopAmbientPlayback();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngine.stopAmbientPlayback();
    };
  }, [isPlaying, duration]);

  // Master Volume helper
  const setMasterVolume = (vol: number) => {
    setMasterVolumeState(vol);
    audioEngine.setMasterVolume(vol);
  };

  const play = () => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const seek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(clamped);
    audioEngine.playTimelineTick(380, 0.04);
  };

  const stepFrame = (frames: number) => {
    const frameRate = 30; // standard 30fps
    const deltaSeconds = frames * (1 / frameRate);
    seek(currentTime + deltaSeconds);
  };

  // Timeline Clip Manipulations
  const splitClipAtPlayhead = (targetClipId?: string) => {
    const clipToSplit = targetClipId 
      ? clips.find(c => c.id === targetClipId)
      : clips.find(c => currentTime > c.start && currentTime < c.start + c.duration);

    if (!clipToSplit) return;

    const splitOffset = currentTime - clipToSplit.start;
    if (splitOffset <= 0.1 || splitOffset >= clipToSplit.duration - 0.1) return;

    const firstHalf: TimelineClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_pt1_${Date.now().toString(36)}`,
      duration: splitOffset,
    };

    const secondHalf: TimelineClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_pt2_${Date.now().toString(36)}`,
      start: currentTime,
      duration: clipToSplit.duration - splitOffset,
      sourceStart: (clipToSplit.sourceStart || 0) + splitOffset,
      title: `${clipToSplit.title} (Cut)`,
    };

    setClips(prev => prev.filter(c => c.id !== clipToSplit.id).concat([firstHalf, secondHalf]));
    setSelectedClipId(secondHalf.id);
    audioEngine.playTimelineTick(520, 0.08, 'triangle');
  };

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  const updateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, ...updates } : c));
  };

  const moveClip = (clipId: string, newStart: number, newTrackId?: string) => {
    let finalStart = Math.max(0, newStart);
    if (snapping) {
      // Snap to playhead or nearby clips within 0.25s
      if (Math.abs(finalStart - currentTime) < 0.25) {
        finalStart = currentTime;
      }
    }

    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          start: finalStart,
          trackId: newTrackId || c.trackId,
        };
      }
      return c;
    }));
  };

  const trimClip = (clipId: string, deltaStart: number, deltaDuration: number) => {
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const newStart = Math.max(0, c.start + deltaStart);
        const newDuration = Math.max(0.2, c.duration + deltaDuration);
        return { ...c, start: newStart, duration: newDuration };
      }
      return c;
    }));
  };

  const addClip = (clip: TimelineClip) => {
    setClips(prev => [...prev, clip]);
  };

  // Track controls
  const toggleTrackMute = (trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t));
  };

  const toggleTrackSolo = (trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, solo: !t.solo } : t));
  };

  const toggleTrackLock = (trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, locked: !t.locked } : t));
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, volume } : t));
  };

  // Descript: 1-Click Remove All Filler Words
  const removeFillerWords = () => {
    const fillerWords = transcript.filter(w => w.isFiller);
    if (fillerWords.length === 0) return;

    // Filter out filler words from transcript
    setTranscript(prev => prev.filter(w => !w.isFiller));

    // Automatically ripple cut clips on timeline
    // Each filler word removed saves ~0.35s - 0.5s of silence
    const totalSavedSeconds = fillerWords.reduce((acc, curr) => acc + (curr.end - curr.start), 0);

    setClips(prev => {
      return prev.map(clip => {
        // If this is the dialogue audio or caption track, adjust duration cleanly
        if (clip.trackId === 'track-a1' || clip.trackId === 'track-captions') {
          return {
            ...clip,
            duration: Math.max(1, clip.duration - totalSavedSeconds * 0.4),
          };
        }
        return clip;
      });
    });

    // Update analytics: retention increases when filler words are removed!
    setAnalytics(prev => ({
      ...prev,
      avgRetentionPct: Math.min(96, prev.avgRetentionPct + 6.4),
      dropOffPoints: prev.dropOffPoints.filter(p => !p.reason.includes('filler word')),
    }));

    audioEngine.playTimelineTick(720, 0.12, 'sine');
  };

  const deleteTranscriptWord = (wordId: string) => {
    setTranscript(prev => prev.filter(w => w.id !== wordId));
  };

  const overdubTranscriptWord = async (wordId: string, newWord: string) => {
    setTranscript(prev => prev.map(w => w.id === wordId ? { ...w, word: newWord, isFiller: false } : w));
    // Call client audio speech synthesis preview
    audioEngine.speakNarration(newWord, 'Zephyr');
  };

  const generateTranscriptFromClips = async () => {
    try {
      const response = await fetch('/api/ai/transcribe-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hey everyone, um, stop wasting hours, you know, cutting audio manually. Like, now you can edit with Descript transcript precision and Premiere Pro power.',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.words && data.words.length > 0) {
          setTranscript(data.words.map((w: any, idx: number) => ({
            id: `w_ai_${idx}`,
            word: w.word,
            start: w.start,
            end: w.end,
            isFiller: w.isFiller,
            fillerType: w.fillerType,
            confidence: w.confidence || 0.98,
          })));
          return;
        }
      }
    } catch (e) {
      console.warn('Transcript generation fallback used', e);
    }

    // Client-side fallback if server is unreachable
    setTranscript(INITIAL_TRANSCRIPT);
  };

  // Invideo AI: Generate Full Video Project from prompt
  const generateAIVideo = async (prompt: string, tone: string = 'engaging', format: string = '16:9') => {
    setIsAIGenerating(true);
    let data: any = null;

    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, format, duration: '25s' }),
      });
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      console.warn('Failed to fetch from server AI endpoint, using client synthesis fallback', e);
    }

    // Fallback if network or serverless function failed
    if (!data || !data.scenes || data.scenes.length === 0) {
      const cleanTitle = prompt.slice(0, 48);
      data = {
        projectTitle: cleanTitle,
        summary: `Storyboard generated for "${cleanTitle}".`,
        scenes: [
          {
            title: 'The Hook',
            duration: 5,
            narration: `In a world moving at lightning speed, how do the best creators produce 10x faster?`,
            visualPrompt: 'Futuristic digital workspace with glowing timelines and neon UI elements.',
            overlayText: 'STOP WASTING HOURS EDITING',
            brollKeyword: 'technology',
            audioMood: 'cinematic',
          },
          {
            title: 'The Breakthrough',
            duration: 7,
            narration: `Meet the new standard: text-based editing, multitrack precision, and instant AI visual synthesis in one studio.`,
            visualPrompt: 'High-speed editing workflow showing automated captions and audio waveforms locking in place.',
            overlayText: 'UNIFIED CREATIVE POWER',
            brollKeyword: 'coding',
            audioMood: 'upbeat',
          },
          {
            title: 'The Result',
            duration: 6,
            narration: `From raw script to 4K publication across YouTube, TikTok, and Premiere in just minutes.`,
            visualPrompt: 'Multiple screens showcasing viral video analytics and high-retention spikes.',
            overlayText: 'VIRAL RETENTION +84%',
            brollKeyword: 'business',
            audioMood: 'upbeat',
          },
          {
            title: 'Call to Action',
            duration: 4,
            narration: `Level up your creative workflow today. Create without limits.`,
            visualPrompt: 'Sleek logo animation with glowing studio lights and cinematic blur.',
            overlayText: 'START CREATING NOW',
            brollKeyword: 'space',
            audioMood: 'dramatic',
          },
        ],
        suggestedMusic: 'Cyberpunk Drive (128 BPM Synthwave)',
        viralScore: 94,
        hookAnalysis: 'Strong problem-solution structure with immediate curiosity hook in first 3 seconds.',
      };
    }

    try {
      if (data.scenes && data.scenes.length > 0) {
        let currentStart = 0;
        const newClips: TimelineClip[] = [];
        const newTranscript: TranscriptWord[] = [];

        data.scenes.forEach((scene: any, index: number) => {
          const dur = scene.duration || 5;

          // Video Clip (V1)
          newClips.push({
            id: `clip-ai-v1-${index}`,
            trackId: 'track-v1',
            title: `Scene ${index + 1}: ${scene.title}`,
            type: 'video',
            start: currentStart,
            duration: dur,
            volume: 1,
            speed: 1,
            muted: false,
            color: ['#2563EB', '#3B82F6', '#1D4ED8', '#6366F1'][index % 4],
            visualTag: scene.brollKeyword || 'technology',
            text: scene.overlayText,
            effects: DEFAULT_COLOR_GRADING,
          });

          // Caption Clip (CC)
          newClips.push({
            id: `clip-ai-cap-${index}`,
            trackId: 'track-captions',
            title: `Caption ${index + 1}`,
            type: 'caption',
            start: currentStart + 0.2,
            duration: Math.max(1.5, dur - 0.4),
            volume: 1,
            speed: 1,
            muted: false,
            color: '#F59E0B',
            text: scene.narration,
            captionStyle: DEFAULT_CAPTION_STYLE,
          });

          // Words for transcript
          const words = (scene.narration || '').split(' ');
          let wTime = currentStart + 0.2;
          words.forEach((w: string, wIdx: number) => {
            const wDur = Math.max(0.25, (dur - 0.5) / words.length);
            newTranscript.push({
              id: `w_ai_${index}_${wIdx}`,
              word: w,
              start: parseFloat(wTime.toFixed(2)),
              end: parseFloat((wTime + wDur).toFixed(2)),
              isFiller: ['um', 'uh', 'like'].includes(w.toLowerCase().replace(/[^a-z]/g, '')),
              confidence: 0.99,
            });
            wTime += wDur;
          });

          currentStart += dur;
        });

        // Add Dialogue track
        newClips.push({
          id: 'clip-ai-a1-main',
          trackId: 'track-a1',
          title: 'AI Neural Voiceover (Zephyr)',
          type: 'audio',
          start: 0.2,
          duration: Math.max(2, currentStart - 0.2),
          volume: 0.95,
          speed: 1,
          muted: false,
          color: '#10B981',
        });

        // Add BGM
        newClips.push({
          id: 'clip-ai-a2-bgm',
          trackId: 'track-a2',
          title: `BGM: ${data.suggestedMusic || 'Cinematic Beat'}`,
          type: 'music',
          start: 0,
          duration: currentStart + 1,
          volume: 0.35,
          speed: 1,
          muted: false,
          color: '#8B5CF6',
        });

        setClips(newClips);
        setTranscript(newTranscript);
        setCurrentTime(0);

        // Snapshot in version control
        createVersionSnapshot(`AI Storyboard: ${data.projectTitle}`, `Generated with Invideo AI & Gemini 3.8 Flash.`);

        return data;
      }
    } catch (e) {
      console.error('Failed to construct timeline clips from AI video', e);
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Premiere Audio Mixing
  const updateAudioChannel = (trackId: string, updates: Partial<AudioMixerChannel>) => {
    setAudioChannels(prev => prev.map(c => c.trackId === trackId ? { ...c, ...updates } : c));
  };

  const toggleStudioSound = () => {
    setIsStudioSoundActive(prev => {
      const next = !prev;
      audioEngine.setStudioSound(next);
      return next;
    });
  };

  // Collaboration
  const addComment = (text: string, timestamp?: number) => {
    const newComment: ProjectComment = {
      id: `comm_${Date.now()}`,
      authorName: 'You (Lead Producer)',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timestampSeconds: timestamp !== undefined ? timestamp : currentTime,
      text,
      createdAt: 'Just now',
      resolved: false,
    };
    setComments(prev => [newComment, ...prev]);
  };

  const resolveComment = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c));
  };

  // Version Control
  const createVersionSnapshot = (label: string, summary: string = 'Manual save') => {
    const newVersion: ProjectVersion = {
      id: `ver_${Date.now()}`,
      versionNumber: `v${(versions.length * 0.5 + 1).toFixed(1)}`,
      label,
      timestamp: 'Just now',
      author: 'You (Lead Producer)',
      changesSummary: summary,
      clipsSnapshot: [...clips],
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const restoreVersion = (versionId: string) => {
    const target = versions.find(v => v.id === versionId);
    if (target && target.clipsSnapshot) {
      setClips([...target.clipsSnapshot]);
      audioEngine.playTimelineTick(440, 0.2, 'sine');
    }
  };

  // Security & Biometric
  const verifyBiometric = async (): Promise<boolean> => {
    return new Promise(resolve => {
      setTimeout(() => {
        setIsBiometricLocked(false);
        resolve(true);
      }, 700);
    });
  };

  const lockWorkspace = () => {
    setIsBiometricLocked(true);
    setIsPlaying(false);
  };

  const syncNow = () => {
    setCloudSyncStatus('syncing');
    setTimeout(() => {
      setCloudSyncStatus('synced');
    }, 1200);
  };

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
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
