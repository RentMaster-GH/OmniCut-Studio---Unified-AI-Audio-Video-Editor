export interface TimelineClip {
  id: string;
  trackId: string;
  start: number;
  duration: number;
  title?: string;
  type?: string;
  volume: number;
  speed: number;
  muted: boolean;
  color?: string;
  text?: string;
  prompt?: string;
  src?: string;
  imageSrc?: string;
  url?: string;
  status?: 'processing' | 'ready' | 'complete';
  visualTag?: string;
  sourceStart?: number;
  [key: string]: any;
}

export interface AudioMixerChannel {
  trackId: string;
  name: string;
  volume: number;
  userPreferredVolume?: number;
  pan: number;
  eq: any;
  compressorEnabled: boolean;
  compressorThreshold: number;
  studioSoundActive: boolean;
  noiseReductionDb: number;
  deReverbPct: number;
  currentPeakLevel: number;
  [key: string]: any;
}
