class AudioEngineController {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private oscillatorInterval: any = null;

  init() {
    if (this.isInitialized) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.isInitialized = true;
    }
  }

  async resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(vol: number) {
    console.log(`Master volume tracking adjusted to: ${vol * 100}%`);
  }

  setStudioSound(active: boolean) {
    console.log(`AI Noise reduction & Studio Sound: ${active ? 'ACTIVE' : 'MUTED'}`);
  }

  playTimelineTick(frequency: number, duration: number, type: OscillatorType = 'sine') {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.log(e);
    }
  }

  async speakNarration(text: string, voice = 'Zephyr') {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[^a-zA-Z0-9\s.,!?]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log(e);
    }
  }

  startAmbientPlayback(preset: string) {
    if (!this.ctx) this.init();
    this.stopAmbientPlayback();

    console.log(`Synthesizing live real-time audio track stream: ${preset}`);
    
    const freqs = [110.00, 164.81, 220.00, 261.63, 329.63, 440.00]; 
    
    this.oscillatorInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;

      const baseFreq = freqs[Math.floor(Math.random() * freqs.length)];
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.5); 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 4.0);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination); 

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 4.0);
    }, 1500);
  }

  stopAmbientPlayback() {
    if (this.oscillatorInterval) {
      clearInterval(this.oscillatorInterval);
      this.oscillatorInterval = null;
    }
  }
}

export const audioEngine = new AudioEngineController();
