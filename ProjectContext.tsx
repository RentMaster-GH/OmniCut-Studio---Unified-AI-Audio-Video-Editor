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
} from '@/types'; //  Updated to path alias
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
} from '@/utils/initialProject'; //  Updated to path alias
import { audioEngine } from '@/utils/audioEngine'; //  Updated to path alias

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
        // ... (remaining loop mechanism)
      };
    }
  }, [isPlaying]);

  return (
    <ProjectContext.Provider value={{
      currentTime, duration, isPlaying, play: () => setIsPlaying(true), pause: () => setIsPlaying(false),
      togglePlay: () => setIsPlaying(!isPlaying), seek: setCurrentTime, stepFrame: () => {},
      tracks, clips, activeTool, setActiveTool, snapping, setSnapping, zoom, setZoom,
      selectedClipId, setSelectedClipId, splitClipAtPlayhead: () => {}, deleteClip: () => {},
      updateClip: () => {}, moveClip: () => {}, trimClip: () => {}, addClip: () => {},
      toggleTrackMute: () => {}, toggleTrackSolo: () => {}, toggleTrackLock: () => {}, setTrackVolume: () => {},
      transcript, removeFillerWords: () => {}, deleteTranscriptWord: () => {}, overdubTranscriptWord: async () => {},
      generateTranscriptFromClips: async () => {}, aspectRatio, setAspectRatio, showSafeMargins, setShowSafeMargins,
      captionStyle, setCaptionStyle, generateAIVideo: async () => {}, isAIGenerating, colorGrading, setColorGrading,
      audioChannels, updateAudioChannel: () => {}, isStudioSoundActive, toggleStudioSound: () => setIsStudioSoundActive(!isStudioSoundActive),
      masterVolume, setMasterVolume: setMasterVolumeState, collaborators, comments, addComment: () => {}, resolveComment: () => {},
      versions, restoreVersion: () => {}, createVersionSnapshot: () => {}, userRole, setUserRole, analytics,
      isBiometricLocked, verifyBiometric: async () => true, lockWorkspace: () => setIsBiometricLocked(true),
      isEndToEndEncrypted, encryptionFingerprint, cloudSyncStatus, syncNow: () => {},

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
