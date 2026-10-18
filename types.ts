export interface TimelineClip {
  id: string;
  status?: 'processing' | 'ready' | 'complete';
  url?: string;
  src?: string;
  imageSrc?: string;
  // ... your other fields
}

export interface AudioMixerChannel {
  userPreferredVolume?: number;
  volume: number;
  // ... rest
}
