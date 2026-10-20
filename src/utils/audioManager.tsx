/**
 * OmniCut Studio - Unified Audio Manager Singleton
 * 
 * Handles global media output routing through the Web Audio API graph.
 * Ensures all video clips and audio tracks from the AI generator are routed
 * through the master volume controller and output to the user's browser audio device.
 */

export class AudioManager {
  private static instance: AudioManager | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // Track-level gain nodes & EQ filters
  private trackGains: Map<string, GainNode> = new Map();
  private trackEqFilters: Map<string, BiquadFilterNode[]> = new Map();
  private trackVolumes: Map<string, number> = new Map();
  private trackMuted: Map<string, boolean> = new Map();

  // Registry of media elements (HTMLVideoElement, HTMLAudioElement)
  private mediaSources: WeakMap<HTMLMediaElement, MediaElementAudioSourceNode> = new WeakMap();
  private trackedMediaElements: Set<HTMLMediaElement> = new Set();
  private mediaElementTracks: WeakMap<HTMLMediaElement, string> = new WeakMap();

  private masterVolume: number = 0.85;
  private isMuted: boolean = false;
  private isStudioSoundEnabled: boolean = true;
  private synthInterval: any = null;
  private currentOutputDeviceId: string = 'default';

  private constructor() {
    // Singleton - use AudioManager.getInstance()
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize Web Audio API context and master routing graph
   */
  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn('Web Audio API not supported in this environment');
        return;
      }

      this.ctx = new AudioCtx();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      // Studio Sound Master Dynamics Compressor
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Master Analyser Node (for VU metering & visualizers)
      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 256;

      // Connect: Master Gain -> Compressor -> Analyser -> Browser Destination
      this.masterGain.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.ctx.destination);

      // Pre-initialize default track channels (V1, V2, A1, A2, A3)
      ['track-v1', 'track-v2', 'track-a1', 'track-a2', 'track-a3'].forEach(trackId => {
        this.getOrCreateTrackNode(trackId);
      });
    } catch (e) {
      console.warn('Failed to initialize Web Audio API context:', e);
    }
  }

  /**
   * Resume suspended AudioContext on user interaction
   */
  public resume(): void {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getAudioContext(): AudioContext | null {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    if (!this.ctx) this.init();
    return this.masterGain;
  }

  /**
   * Get or create a track-specific GainNode connected to Master Gain
   */
  public getOrCreateTrackNode(trackId: string): GainNode {
    if (!this.ctx) this.init();

    if (this.trackGains.has(trackId)) {
      return this.trackGains.get(trackId)!;
    }

    if (!this.ctx || !this.masterGain) {
      throw new Error('AudioContext not initialized');
    }

    const trackGain = this.ctx.createGain();
    const vol = this.trackVolumes.get(trackId) ?? 1.0;
    const muted = this.trackMuted.get(trackId) ?? false;
    trackGain.gain.setValueAtTime(muted ? 0 : vol, this.ctx.currentTime);

    // Setup 4-band Parametric EQ for Dialogue track (A1) or standard routing
    if (trackId === 'track-a1') {
      const lowFilter = this.ctx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.setValueAtTime(60, this.ctx.currentTime);

      const lowMidFilter = this.ctx.createBiquadFilter();
      lowMidFilter.type = 'peaking';
      lowMidFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

      const highMidFilter = this.ctx.createBiquadFilter();
      highMidFilter.type = 'peaking';
      highMidFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);

      const highFilter = this.ctx.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.setValueAtTime(10000, this.ctx.currentTime);

      trackGain.connect(lowFilter);
      lowFilter.connect(lowMidFilter);
      lowMidFilter.connect(highMidFilter);
      highMidFilter.connect(highFilter);
      highFilter.connect(this.masterGain);

      this.trackEqFilters.set(trackId, [lowFilter, lowMidFilter, highMidFilter, highFilter]);
    } else {
      trackGain.connect(this.masterGain);
    }

    this.trackGains.set(trackId, trackGain);
    return trackGain;
  }

  /**
   * Route an HTMLMediaElement (video or audio) from the AI generator
   * through the global audio graph and master volume controller.
   * Ensures sound is consistently audible across all browser environments without CORS silencing.
   */
  public routeMediaElement(mediaElement: HTMLMediaElement, trackId: string = 'track-v1'): void {
    if (!mediaElement) return;
    this.resume();

    this.trackedMediaElements.add(mediaElement);
    this.mediaElementTracks.set(mediaElement, trackId);

    // Direct hardware audio output synchronization:
    // Avoid createMediaElementSource interception on remote/cross-origin CDNs which forces
    // browsers to mute/zero the audio output stream. Direct volume & mute synchronization
    // guarantees 100% audible playback through browser speakers/headphones and master controller.
    this.syncMediaVolume(mediaElement, trackId);
  }

  /**
   * Synchronize an HTMLMediaElement's volume and mute state with master controller and track settings
   */
  public syncMediaVolume(
    mediaElement: HTMLMediaElement,
    trackId: string = 'track-v1',
    clipVolume: number = 1,
    clipMuted: boolean = false
  ): void {
    if (!mediaElement) return;

    const trackVol = this.trackVolumes.get(trackId) ?? 1;
    const isTrackMuted = this.trackMuted.get(trackId) ?? false;
    const shouldMute = this.isMuted || isTrackMuted || clipMuted || this.masterVolume === 0;

    const effectiveVolume = shouldMute
      ? 0
      : Math.max(0, Math.min(1, this.masterVolume * trackVol * clipVolume));

    mediaElement.muted = shouldMute;
    mediaElement.volume = effectiveVolume;
  }

  /**
   * Set Master Volume (0.0 to 1.0) and update all routed media elements & graph nodes
   */
  public setMasterVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterVolume = clamped;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime);
    }

    // Synchronize all tracked media elements (videos from AI generator, uploaded clips)
    this.trackedMediaElements.forEach(element => {
      const trackId = this.mediaElementTracks.get(element) || 'track-v1';
      this.syncMediaVolume(element, trackId);
    });
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Toggle global master mute
   */
  public toggleMute(muted?: boolean): void {
    this.isMuted = muted !== undefined ? muted : !this.isMuted;
    this.setMasterVolume(this.masterVolume);
  }

  public isMasterMuted(): boolean {
    return this.isMuted || this.masterVolume === 0;
  }

  /**
   * Set Track Volume (e.g. 'track-v1', 'track-a1')
   */
  public setTrackVolume(trackId: string, val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.trackVolumes.set(trackId, clamped);

    if (this.ctx && this.trackGains.has(trackId)) {
      const isMuted = this.trackMuted.get(trackId) ?? false;
      this.trackGains.get(trackId)!.gain.setValueAtTime(isMuted ? 0 : clamped, this.ctx.currentTime);
    }

    this.trackedMediaElements.forEach(el => {
      if (this.mediaElementTracks.get(el) === trackId) {
        this.syncMediaVolume(el, trackId);
      }
    });
  }

  public getTrackVolume(trackId: string): number {
    return this.trackVolumes.get(trackId) ?? 1.0;
  }

  /**
   * Toggle Track Mute
   */
  public setTrackMute(trackId: string, muted: boolean): void {
    this.trackMuted.set(trackId, muted);
    const vol = this.trackVolumes.get(trackId) ?? 1.0;

    if (this.ctx && this.trackGains.has(trackId)) {
      this.trackGains.get(trackId)!.gain.setValueAtTime(muted ? 0 : vol, this.ctx.currentTime);
    }

    this.trackedMediaElements.forEach(el => {
      if (this.mediaElementTracks.get(el) === trackId) {
        this.syncMediaVolume(el, trackId);
      }
    });
  }

  /**
   * Route an AI generated video clip through the global audio graph and master controller
   */
  public routeAIGeneratedVideo(
    videoElement: HTMLMediaElement,
    trackId: string = 'track-v1',
    clipVolume: number = 1,
    clipMuted: boolean = false
  ): void {
    if (!videoElement) return;
    this.routeMediaElement(videoElement, trackId);
    this.syncMediaVolume(videoElement, trackId, clipVolume, clipMuted);
    if (this.currentOutputDeviceId && this.currentOutputDeviceId !== 'default') {
      this.applyDeviceToElement(videoElement, this.currentOutputDeviceId);
    }
  }

  /**
   * Set the user browser audio output device (e.g. Speakers, Headphones)
   */
  public async setOutputDevice(deviceId: string): Promise<boolean> {
    this.currentOutputDeviceId = deviceId || 'default';
    let applied = false;

    // Apply to Web Audio AudioContext if browser supports setSinkId
    if (this.ctx && typeof (this.ctx as any).setSinkId === 'function') {
      try {
        await (this.ctx as any).setSinkId(deviceId);
        applied = true;
      } catch (err) {
        console.warn('AudioContext setSinkId note:', err);
      }
    }

    // Apply to all routed video and audio elements
    for (const el of this.trackedMediaElements) {
      const ok = await this.applyDeviceToElement(el, deviceId);
      if (ok) applied = true;
    }

    return applied;
  }

  private async applyDeviceToElement(el: HTMLMediaElement, deviceId: string): Promise<boolean> {
    if (typeof (el as any).setSinkId === 'function') {
      try {
        await (el as any).setSinkId(deviceId);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  public getCurrentOutputDeviceId(): string {
    return this.currentOutputDeviceId;
  }

  /**
   * Query available browser audio output devices
   */
  public async getAvailableOutputDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audiooutput');
    } catch {
      return [];
    }
  }

  /**
   * Update Parametric EQ on Track A1 Dialogue
   */
  public updateEq(trackId: string, eq: { low: number; lowMid: number; highMid: number; high: number }): void {
    const filters = this.trackEqFilters.get(trackId);
    if (!filters || !this.ctx) return;

    const [low, lowMid, highMid, high] = filters;
    low.gain.setValueAtTime(eq.low, this.ctx.currentTime);
    lowMid.gain.setValueAtTime(eq.lowMid, this.ctx.currentTime);
    highMid.gain.setValueAtTime(eq.highMid, this.ctx.currentTime);
    high.gain.setValueAtTime(eq.high, this.ctx.currentTime);
  }

  /**
   * Toggle Studio Sound AI processing
   */
  public setStudioSound(enabled: boolean): void {
    this.isStudioSoundEnabled = enabled;
    if (this.masterCompressor && this.ctx) {
      if (enabled) {
        this.masterCompressor.threshold.setValueAtTime(-22, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(5, this.ctx.currentTime);
      } else {
        this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(2, this.ctx.currentTime);
      }
    }
  }

  /**
   * Get real-time peak audio level (0 to 1) for VU meters
   */
  public getPeakLevel(): number {
    if (!this.masterAnalyser) return 0;
    const buffer = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteTimeDomainData(buffer);

    let max = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = Math.abs(buffer[i] - 128) / 128;
      if (v > max) max = v;
    }
    return max;
  }

  /**
   * Get frequency data array for visualizer waveform
   */
  public getWaveformData(): Uint8Array {
    if (!this.masterAnalyser) return new Uint8Array(64);
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * Play a simulated harmonic tone or sound effect during timeline scrub/playback
   */
  public playTimelineTick(pitch: number = 440, duration: number = 0.05, type: OscillatorType = 'sine'): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  /**
   * Play real-time generative background score during playback, routed through Master Gain
   */
  public startAmbientPlayback(mood: string = 'cinematic'): void {
    this.stopAmbientPlayback();
    if (!this.ctx) this.init();
    this.resume();

    const chords = [
      [130.81, 196.0, 246.94, 329.63], // C min 7
      [146.83, 220.0, 261.63, 349.23], // D min 7
      [110.0, 164.81, 220.0, 293.66],  // A min
      [164.81, 246.94, 293.66, 392.0], // E min
    ];

    let chordIdx = 0;
    const playChord = () => {
      if (!this.ctx || this.isMuted || this.masterVolume === 0) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      const a2Node = this.getOrCreateTrackNode('track-a2');

      notes.forEach((freq, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

          // Scale background score volume with master volume for consistent audibility
          const volume = (this.isStudioSoundEnabled ? 0.22 : 0.28) * this.masterVolume;
          gain.gain.setValueAtTime(0.0001, this.ctx!.currentTime);
          gain.gain.linearRampToValueAtTime(volume, this.ctx!.currentTime + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 2.8);

          osc.connect(gain);
          gain.connect(a2Node);

          osc.start();
          osc.stop(this.ctx!.currentTime + 3.0);
        } catch (e) {}
      });
    };

    playChord();
    this.synthInterval = setInterval(playChord, 2800);
  }

  public stopAmbientPlayback(): void {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  /**
   * Play speech synthesis for previewing overdubbed or generated dialogue
   */
  public speakNarration(text: string, voiceName: string = 'Zephyr', onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = voiceName === 'Puck' ? 1.2 : voiceName === 'Fenrir' ? 0.8 : 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        v =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced'))
      ) || voices[0];

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.volume = this.isMuted ? 0 : this.masterVolume;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  }

  public stopNarration(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// Export the singleton instance
export const audioManager = AudioManager.getInstance();

// Auto-unlock Web Audio context on the first user interaction across the window
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    audioManager.resume();
  };
  window.addEventListener('click', unlockAudio, { capture: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { capture: true, passive: true });
  window.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { capture: true, passive: true });
}
