export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type ClipType = 'video' | 'audio' | 'overlay' | 'caption' | 'music';

export interface ColorGrading {
  lut: 'none' | 'cinematic-teal' | 'cyber-neon' | 'kodachrome' | 'noir' | 'warm-sunset' | 'clean-hdr';
  brightness: number; // -100 to 100 (0 default)
  contrast: number;   // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  temperature: number;// -100 to 100 (0 default)
  vignette: number;   // 0 to 100 (0 default)
  exposure: number;   // -100 to 100 (0 default)
  sharpness: number;  // 0 to 100
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
  positionY: number; // percentage from top (e.g. 78)
  uppercase: boolean;
  animation: 'bounce' | 'fade' | 'pop' | 'none';
}

export interface TimelineClip {
  id: string;
  trackId: string;
  title: string;
  type: ClipType;
  start: number;       // timeline start in seconds
  duration: number;    // duration in seconds
  sourceStart?: number;// in-point in media source
  volume: number;      // 0 to 1
  speed: number;       // 0.5 to 2.0
  muted: boolean;
  color: string;       // track clip color
  src?: string;        // media URL / base64 or video pattern
  thumbnail?: string;  // thumbnail image or visual placeholder
  text?: string;       // for captions and overlay text
  effects?: ColorGrading;
  captionStyle?: CaptionStyle;
  isFillerWordSegment?: boolean;
  visualTag?: string;  // e.g. "coding", "space", "b-roll"
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'caption';
  muted: boolean;
  solo: boolean;
  locked: boolean;
  volume: number;      // 0 to 1
  height: number;      // pixels
  color: string;
}

export interface TranscriptWord {
  id: string;
  word: string;
  start: number;       // seconds
  end: number;         // seconds
  isFiller: boolean;
  fillerType?: string; // 'um', 'uh', 'you know', 'like'
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
  low: number;      // 60Hz (-12 to +12 dB)
  lowMid: number;   // 250Hz (-12 to +12 dB)
  highMid: number;  // 2.5kHz (-12 to +12 dB)
  high: number;     // 10kHz (-12 to +12 dB)
}

export interface AudioMixerChannel {
  trackId: string;
  name: string;
  volume: number;       // 0 to 1
  pan: number;          // -1 (left) to +1 (right)
  eq: EqualizerBands;
  compressorEnabled: boolean;
  compressorThreshold: number; // dB
  studioSoundActive: boolean;
  noiseReductionDb: number;
  deReverbPct: number;
  currentPeakLevel: number; // 0 to 1 for VU meters
}
