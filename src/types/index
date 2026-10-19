export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type ClipType = 'video' | 'audio' | 'overlay' | 'caption' | 'music';

export type ClipStatus = 'processing' | 'ready' | 'complete' | 'queued' | 'failed';

export interface ColorGrading {
  lut: 'none' | 'cinematic-teal' | 'cyber-neon' | 'kodachrome' | 'noir' | 'warm-sunset' | 'clean-hdr';
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  vignette: number;
  exposure: number;
  sharpness: number;
}

export interface CaptionStyle {
  preset: 'hormozi' | 'minimal' | 'neon' | 'karaoke' | 'editorial';
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  backgroundPadding: number;
  borderRadius: number;
  positionY: number;
  uppercase: boolean;
  animation: 'bounce' | 'fade' | 'pop' | 'none';
}

export interface TimelineClip {
  id: string;
  trackId: string;
  title: string;
  type: ClipType;
  start: number;
  duration: number;
  sourceStart?: number;
  volume: number;
  speed: number;
  muted: boolean;
  color: string;
  src?: string;
  url?: string; // For Supabase Realtime + B-Roll Injector (alias of src)
  thumbnail?: string;
  text?: string;
  effects?: ColorGrading;
  captionStyle?: CaptionStyle;
  isFillerWordSegment?: boolean;
  visualTag?: string;
  imageSrc?: string;
  prompt?: string;
  // --- NEW FIELDS FOR B-ROLL OVERLAY / LIVE SYNC ---
  status?: ClipStatus;
  // -----------------------------------------------
  avatarConfig?: {
    avatarId: string;
    avatarName: string;
    lifeformType: 'human' | 'animal' | 'synthetic';
    speciesOrRole: string;
    voice: string;
    scriptText: string;
    microExpression: string;
    layout: 'full' | 'pip_bottom_right' | 'pip_bottom_left' | 'split_screen';
    skinTextureDetail?: string;
  };
  syntheticProvenance?: {
    model: string;
    c2paHash: string;
    isSynthetic: boolean;
    watermarkEnabled: boolean;
    generationTimestamp: string;
  };
  // Allow extra metadata from Supabase
  [key: string]: any;
}

export type AvatarLifeformType = 'human' | 'animal' | 'synthetic';

export type AvatarMicroExpression =
  | 'neutral'
  | 'warm_smile'
  | 'inquisitive_wonder'
  | 'intense_dramatic'
  | 'serious_anchor'
  | 'alert_predator';

export interface BiologicalParameters {
  breathingRateBpm: number;
  blinkFrequencyPerMin: number;
  saccadeIntensity: number;
  subsurfaceGlow: number;
  microTwitchFrequency: number;
  skinMelaninWarmth: number;
}

export interface AIAvatarProfile {
  id: string;
  name: string;
  lifeformType: AvatarLifeformType;
  speciesOrRole: string;
  skinTextureDetail: string;
  biology: BiologicalParameters;
  defaultMicroExpression: AvatarMicroExpression;
  defaultVoice: string;
  avatarImage: string;
  accentColor: string;
  bioDescription: string;
  sampleScript: string;
}

export type SyntheticMediaCategory =
  | 'video_diffusion'
  | 'voice_clone'
  | 'neural_image'
  | 'deep_restyler'
  | 'avatar_twin';

export interface SyntheticMediaJob {
  id: string;
  title: string;
  category: SyntheticMediaCategory;
  prompt: string;
  modelUsed: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  status: ClipStatus;
  provenance: {
    c2paCompliant: boolean;
    cryptographicHash: string;
    watermarkEnabled: boolean;
    generationTimestamp: string;
    tamperEvidentSig: string;
  };
  durationSeconds?: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'caption';
  muted: boolean;
  solo: boolean;
  locked: boolean;
  volume: number;
  height: number;
  color: string;
}

export interface TranscriptWord {
  id: string;
  word: string;
  start: number;
  end: number;
  isFiller: boolean;
  fillerType?: string;
  confidence: number;
  deleted?: boolean;
  clipId?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer';
  status: 'active' | 'idle' | 'editing';
  currentTrackId?: string;
  color: string;
  lastActive: string;
}

export interface ProjectComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestampSeconds: number;
  text: string;
  createdAt: string;
  resolved: boolean;
  replyCount?: number;
}

export interface ProjectVersion {
  id: string;
  versionNumber: string;
  label: string;
  timestamp: string;
  author: string;
  changesSummary: string;
  clipsSnapshot: TimelineClip[];
}

export interface ProjectAnalytics {
  views: number;
  avgRetentionPct: number;
  totalWatchTimeHours: number;
  predictedCTR: number;
  viralScore: number;
  hookStrengthScore: number;
  retentionCurve: Array<{ second: number; pct: number }>;
  dropOffPoints: Array<{ time: number; reason: string; severity: 'low' | 'medium' | 'high' }>;
  feedbackSentiment: { positive: number; neutral: number; negative: number };
}

export interface ExportPreset {
  id: string;
  platform: 'youtube' | 'tiktok' | 'reels' | 'podcast' | 'premiere_xml' | 'fcpx_xml' | 'webm';
  name: string;
  description: string;
  resolution: string;
  fps: number;
  aspectRatio: AspectRatio;
  bitrate: string;
  codec: string;
  format: 'mp4' | 'webm' | 'wav' | 'xml' | 'srt';
  icon: string;
}

export interface EqualizerBands {
  low: number;
  lowMid: number;
  highMid: number;
  high: number;
}

export interface AudioMixerChannel {
  trackId: string;
  name: string;
  volume: number;
  userPreferredVolume?: number; // For auto-ducking restoration
  pan: number;
  eq: EqualizerBands;
  compressorEnabled: boolean;
  compressorThreshold: number;
  studioSoundActive: boolean;
  noiseReductionDb: number;
  deReverbPct: number;
  currentPeakLevel: number;
  [key: string]: any;
}

// === NEW: Action type for reducer ===
export type TimelineAction =
  | {
      type: 'INJECT_B_ROLL_OVERLAY';
      payload: {
        timestamp: number;
        videoUrl: string;
        title?: string;
        duration?: number;
      };
    }
  | {
      type: 'UPDATE_TIMELINE_CLIPS_LIVE';
      payload: TimelineClip[];
    };
