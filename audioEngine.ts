/**
 * OmniCut Studio Audio Engine
 * High-performance Web Audio API routing with real-time EQ, compression, VU metering, and sound synthesis.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private eqFilters: { [channelId: string]: BiquadFilterNode[] } = {};
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private isStudioSoundEnabled: boolean = false;
  private synthInterval: any = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      // Master Compressor
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported in this environment', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(val: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime);
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
  }

  public setStudioSound(enabled: boolean) {
    this.isStudioSoundEnabled = enabled;
  }

  /**
   * Get real-time peak audio level (0 to 1) for VU meters
   */
  public getPeakLevel(): number {
    if (!this.analyser) return 0;
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);

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
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * Play a simulated harmonic tone or sound effect during timeline scrub/playback
   */
  public playTimelineTick(pitch: number = 440, duration: number = 0.05, type: OscillatorType = 'sine') {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio glitches on rapid scrubbing
    }
  }

  /**
   * Play real-time generative background score during playback
   */
  public startAmbientPlayback(mood: string = 'cinematic') {
    this.stopAmbientPlayback();
    if (!this.ctx) this.init();
    this.resume();

    // Cinematic chord tones (frequencies in Hz: C3, G3, D#4, A#4)
    const chords = [
      [130.81, 196.0, 246.94, 329.63], // C min 7
      [146.83, 220.0, 261.63, 349.23], // D min 7
      [110.0, 164.81, 220.0, 293.66],  // A min
      [164.81, 246.94, 293.66, 392.0], // E min
    ];

    let chordIdx = 0;
    const playChord = () => {
      if (!this.ctx || this.isMuted) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

          const volume = this.isStudioSoundEnabled ? 0.025 : 0.04;
          gain.gain.setValueAtTime(0.0001, this.ctx!.currentTime);
          gain.gain.linearRampToValueAtTime(volume, this.ctx!.currentTime + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 2.8);

          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx!.destination);

          osc.start();
          osc.stop(this.ctx!.currentTime + 3.0);
        } catch (e) {}
      });
    };

    playChord();
    this.synthInterval = setInterval(playChord, 2800);
  }

  public stopAmbientPlayback() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  /**
   * Play speech synthesis for previewing overdubbed or generated dialogue
   */
  public speakNarration(text: string, voiceName: string = 'Zephyr', onEnd?: () => void) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = voiceName === 'Puck' ? 1.2 : voiceName === 'Fenrir' ? 0.8 : 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Enhanced'))) || voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopNarration() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new AudioEngine();
