import React, { useState, useEffect, useRef } from 'react';
import { useProject } from "./ProjectContext";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Activity,
  Mic,
  Music,
  Zap,
  Check,
  Disc,
} from 'lucide-react';
import { audioEngine } from "./audioEngine";

export const AudioMixerSuite: React.FC = () => {
  const {
    audioChannels,
    updateAudioChannel,
    isStudioSoundActive,
    toggleStudioSound,
    masterVolume,
    setMasterVolume,
    isPlaying,
    currentTime,
    clips,
  } = useProject();

  const [livePeak, setLivePeak] = useState<number>(0.65);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [isDucked, setIsDucked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    audioEngine.getAvailableOutputDevices().then(devices => {
      if (devices && devices.length > 0) {
        setOutputDevices(devices);
      }
    });
  }, []);

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await audioEngine.setOutputDevice(deviceId);
  };

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        const peak = audioEngine.getPeakLevel();
        setLivePeak(peak > 0.05 ? peak : 0.4 + Math.random() * 0.4);
      }, 100);
    } else {
      setLivePeak(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Track ducking state for UI
  useEffect(() => {
    if (!isPlaying) { setIsDucked(false); return; }
    const active = clips.some(
      (clip: any) =>
        (clip.trackId === 'track-v1' || clip.trackId === 'track-a1') &&
        currentTime >= clip.start &&
        currentTime <= clip.start + clip.duration &&
        clip.text && clip.text.trim().length > 0
    );
    setIsDucked(active);
  }, [currentTime, isPlaying, clips]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    const zeroY = h / 2;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    const freqs = [
      { label: '60Hz', x: w * 0.15 },
      { label: '250Hz', x: w * 0.38 },
      { label: '2.5kHz', x: w * 0.65 },
      { label: '10kHz', x: w * 0.88 },
    ];
    ctx.fillStyle = '#71717a';
    ctx.font = '10px JetBrains Mono';
    freqs.forEach(f => {
      ctx.beginPath();
      ctx.moveTo(f.x, 0);
      ctx.lineTo(f.x, h);
      ctx.stroke();
      ctx.fillText(f.label, f.x - 14, h - 8);
    });
    const dialogChannel = audioChannels.find(c => c.trackId === 'track-a1');
    const eq = dialogChannel?.eq || { low: 0, lowMid: 0, highMid: 1.5, high: 2.0 };
    ctx.beginPath();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 12;
    for (let x = 0; x <= w; x += 4) {
      const normX = x / w;
      let gain = 0;
      if (normX < 0.25) gain += eq.low * (1 - normX / 0.25);
      if (normX >= 0.2 && normX <= 0.5) gain += eq.lowMid * Math.sin(((normX - 0.2) / 0.3) * Math.PI);
      if (normX >= 0.45 && normX <= 0.8) gain += eq.highMid * Math.sin(((normX - 0.45) / 0.35) * Math.PI);
      if (normX > 0.7) gain += eq.high * ((normX - 0.7) / 0.3);
      const y = zeroY - gain * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [audioChannels]);

  // Helper to handle music volume with preferred tracking
  const handleMusicVolumeChange = (vol: number) => {
    // When user drags slider, set BOTH actual and preferred
    // Ducking loop will use preferred as restore point
    updateAudioChannel('track-a2', { 
      volume: vol, 
      userPreferredVolume: vol 
    } as any);
  };

  const musicChan = audioChannels.find(c => c.trackId === 'track-a2') as any;
  const preferredVol = musicChan?.userPreferredVolume ?? musicChan?.volume ?? 0.4;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide">
              OmniCut Unified Audio Manager & Mixer
            </h3>
            <p className="text-[10px] text-zinc-400">
              Auto-ducking • userPreferredVolume sync • parametric EQ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px]">
            <Disc className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-zinc-400 text-[10px] hidden sm:inline">Output:</span>
            <select
              value={selectedDeviceId}
              onChange={e => handleDeviceChange(e.target.value)}
              className="bg-transparent text-white text-[11px] font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="default" className="bg-zinc-900 text-white">Browser Default Audio Device</option>
              {outputDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId} className="bg-zinc-900 text-white">
                  {d.label || `Audio Device (${d.deviceId.slice(0, 8)})`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleStudioSound}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
              isStudioSoundActive ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Studio Sound AI: {isStudioSoundActive ? 'Active' : 'Bypass'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6 text-xs text-zinc-300">
        <div className="space-y-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Dialogue (A1) 4-Band Parametric EQ
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">EBU R128 (-14.0 LUFS Target)</span>
          </div>
          <canvas ref={canvasRef} width={720} height={140} className="w-full h-28 rounded-lg bg-zinc-950 border border-zinc-800 shadow-inner" />
          <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
            {[
              { label: 'Low (60Hz)', key: 'low', min: -12, max: 12 },
              { label: 'Low-Mid (250Hz)', key: 'lowMid', min: -12, max: 12 },
              { label: 'High-Mid (2.5kHz)', key: 'highMid', min: -12, max: 12 },
              { label: 'High (10kHz)', key: 'high', min: -12, max: 12 },
            ].map(b => (
              <div key={b.key} className="flex flex-col items-center bg-zinc-950/60 p-2 rounded border border-zinc-800">
                <span className="text-zinc-400 text-[10px]">{b.label}</span>
                <input
                  type="range"
                  min={b.min}
                  max={b.max}
                  step="0.5"
                  value={(audioChannels.find(c => c.trackId === 'track-a1')?.eq as any)?.[b.key] || 0}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    const dialogChan = audioChannels.find(c => c.trackId === 'track-a1');
                    if (dialogChan) updateAudioChannel('track-a1', { eq: { ...dialogChan.eq, [b.key]: val } });
                  }}
                  className="w-full accent-emerald-500 h-1 my-1.5"
                />
                <span className="font-mono text-[10px] text-emerald-400">
                  {((audioChannels.find(c => c.trackId === 'track-a1')?.eq as any)?.[b.key] || 0).toFixed(1)} dB
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between items-center text-center">
            <span className="text-[11px] font-bold text-blue-400">V1 • Video Audio</span>
            <span className="text-[9px] text-zinc-400">AI Video Clips</span>
            <div className="w-4 h-28 bg-zinc-950 rounded-full my-3 p-0.5 flex flex-col justify-end overflow-hidden border border-zinc-800">
              <div style={{ height: `${livePeak * 95}%` }} className="w-full bg-gradient-to-t from-blue-500 via-indigo-400 to-purple-400 rounded-full transition-all duration-75" />
            </div>
            <input type="range" min="0" max="1" step="0.05" value={audioChannels.find(c => c.trackId === 'track-v1')?.volume ?? 1} onChange={e => updateAudioChannel('track-v1', { volume: parseFloat(e.target.value) })} className="w-full accent-blue-500 h-1 my-1" />
            <span className="font-mono text-[10px] text-zinc-400">{((audioChannels.find(c => c.trackId === 'track-v1')?.volume ?? 1) * 100).toFixed(0)}%</span>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between items-center text-center">
            <span className="text-[11px] font-bold text-emerald-400">A1 • Dialogue</span>
            <span className="text-[9px] text-zinc-400">Studio Voice</span>
            <div className="w-4 h-28 bg-zinc-950 rounded-full my-3 p-0.5 flex flex-col justify-end overflow-hidden border border-zinc-800">
              <div style={{ height: `${livePeak * 100}%` }} className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-full transition-all duration-75" />
            </div>
            <input type="range" min="0" max="1" step="0.05" value={audioChannels.find(c => c.trackId === 'track-a1')?.volume || 0.95} onChange={e => updateAudioChannel('track-a1', { volume: parseFloat(e.target.value) })} className="w-full accent-emerald-500 h-1 my-1" />
            <span className="font-mono text-[10px] text-zinc-400">0.0 dB</span>
          </div>

          <div className={`bg-zinc-900/80 p-3 rounded-xl border flex flex-col justify-between items-center text-center transition-all ${isDucked ? 'border-amber-500/50 bg-amber-950/20' : 'border-zinc-800'}`}>
            <span className="text-[11px] font-bold text-purple-400">A2 • Music</span>
            <span className={`text-[9px] flex items-center gap-0.5 justify-center ${isDucked ? 'text-amber-400' : 'text-emerald-400'}`}>
              <Zap className="w-2.5 h-2.5" /> {isDucked ? `Ducked -12dB` : 'Auto Ducking'}
            </span>
            <div className="w-4 h-28 bg-zinc-950 rounded-full my-3 p-0.5 flex flex-col justify-end overflow-hidden border border-zinc-800 relative">
              <div style={{ height: `${preferredVol * 95}%` }} className="absolute bottom-0.5 w-full opacity-20 bg-purple-400 rounded-full" />
              <div style={{ height: `${(musicChan?.volume ?? 0.35) * 95}%` }} className="w-full bg-gradient-to-t from-purple-500 to-blue-400 rounded-full transition-all duration-300" />
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferredVol}
              onChange={e => handleMusicVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1 my-1"
            />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-zinc-400">{(preferredVol * 100).toFixed(0)}% pref</span>
              <span className={`font-mono text-[9px] ${isDucked ? 'text-amber-400' : 'text-zinc-500'}`}>{((musicChan?.volume ?? 0.35) * 100).toFixed(0)}% now {isDucked ? '(-12dB)' : ''}</span>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between items-center text-center">
            <span className="text-[11px] font-bold text-cyan-400">A3 • Sound FX</span>
            <span className="text-[9px] text-zinc-400">Hits & Whoosh</span>
            <div className="w-4 h-28 bg-zinc-950 rounded-full my-3 p-0.5 flex flex-col justify-end overflow-hidden border border-zinc-800">
              <div style={{ height: `${livePeak * 60}%` }} className="w-full bg-gradient-to-t from-cyan-500 to-teal-300 rounded-full transition-all duration-75" />
            </div>
            <input type="range" min="0" max="1" step="0.05" value={audioChannels.find(c => c.trackId === 'track-a3')?.volume || 0.6} onChange={e => updateAudioChannel('track-a3', { volume: parseFloat(e.target.value) })} className="w-full accent-cyan-500 h-1 my-1" />
            <span className="font-mono text-[10px] text-zinc-400">-4.5 dB</span>
          </div>

          <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-700 flex flex-col justify-between items-center text-center ring-1 ring-zinc-700">
            <span className="text-[11px] font-bold text-white">Master Bus</span>
            <span className="text-[9px] text-amber-400 font-mono">-14 LUFS</span>
            <div className="flex gap-1 my-3">
              <div className="w-2.5 h-28 bg-zinc-950 rounded-full p-0.5 flex flex-col justify-end overflow-hidden border border-zinc-800">
                <div style={{ height: `${livePeak * 90}%` }} className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-75" />
              </div>
              <div className="w-2.5 h-28 bg-zinc-950 rounded-full p-0.5 flex flex-col justify-end overflow-hidden border border-zinc-800">
                <div style={{ height: `${livePeak * 85}%` }} className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-75" />
              </div>
            </div>
            <input type="range" min="0" max="1" step="0.05" value={masterVolume} onChange={e => setMasterVolume(parseFloat(e.target.value))} className="w-full accent-blue-500 h-1 my-1" />
            <span className="font-mono text-[10px] text-white">{(masterVolume * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
