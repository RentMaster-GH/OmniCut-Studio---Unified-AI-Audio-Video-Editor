import React, { useState, useRef, useEffect } from 'react';
import { useProject } from "./ProjectContext";
import {
  Users,
  Sparkles,
  Volume2,
  Play,import React, { useState, useRef, useEffect } from 'react';
import { useProject } from './ProjectContext';
import {
  Users,
  Sparkles,
  Volume2,
  Play,
  Pause,
  Upload,
  CheckCircle2,
  Eye,
  Activity,
  Heart,
  Sliders,
  Maximize2,
  Film,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Plus,
  Smile,
  Dna,
} from 'lucide-react';
import { AIAvatarProfile, AvatarLifeformType, AvatarMicroExpression } from './types';
import { audioManager } from './audioManager';

export const AvatarsStudio: React.FC = () => {
  const {
    avatars,
    selectedAvatar,
    setSelectedAvatar,
    deployAvatarToTimeline,
    setActiveTab,
  } = useProject();

  const [activeFilter, setActiveFilter] = useState<'all' | AvatarLifeformType>('all');
  const [currentAvatar, setCurrentAvatar] = useState<AIAvatarProfile>(selectedAvatar || avatars[0]);
  const [selectedExpression, setSelectedExpression] = useState<AvatarMicroExpression>(
    currentAvatar?.defaultMicroExpression || 'warm_smile'
  );
  const [selectedVoice, setSelectedVoice] = useState<string>(currentAvatar?.defaultVoice || 'Zephyr');
  const [speechScript, setSpeechScript] = useState<string>(currentAvatar?.sampleScript || '');
  const [layoutMode, setLayoutMode] = useState<'full' | 'pip_bottom_right' | 'pip_bottom_left' | 'split_screen'>('pip_bottom_right');
  const [isSpeakingPreview, setIsSpeakingPreview] = useState<boolean>(false);
  const [showBioInspector, setShowBioInspector] = useState<boolean>(false);

  // Biological parameters state
  const [biology, setBiology] = useState(currentAvatar?.biology || {
    breathingRateBpm: 16,
    blinkFrequencyPerMin: 18,
    saccadeIntensity: 40,
    subsurfaceGlow: 75,
    microTwitchFrequency: 25,
    skinMelaninWarmth: 80,
  });

  // Custom photo avatar upload
  const [customAvatarName, setCustomAvatarName] = useState<string>('');
  const [customAvatarRole, setCustomAvatarRole] = useState<string>('');
  const [customAvatarType, setCustomAvatarType] = useState<AvatarLifeformType>('human');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Live Canvas Animation Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speakingTimerRef = useRef<any>(null);

  // Sync when selected avatar changes
  useEffect(() => {
    if (selectedAvatar) {
      setCurrentAvatar(selectedAvatar);
      setSelectedExpression(selectedAvatar.defaultMicroExpression);
      setSelectedVoice(selectedAvatar.defaultVoice);
      setSpeechScript(selectedAvatar.sampleScript);
      setBiology(selectedAvatar.biology);
    }
  }, [selectedAvatar]);

  const filteredAvatars = avatars.filter(a => {
    if (activeFilter === 'all') return true;
    return a.lifeformType === activeFilter;
  });

  const handleSelectAvatar = (avatar: AIAvatarProfile) => {
    setCurrentAvatar(avatar);
    setSelectedAvatar(avatar);
    setSelectedExpression(avatar.defaultMicroExpression);
    setSelectedVoice(avatar.defaultVoice);
    setSpeechScript(avatar.sampleScript);
    setBiology(avatar.biology);
    if (isSpeakingPreview) {
      audioManager.stopNarration();
      setIsSpeakingPreview(false);
    }
  };

  // Live Biological Simulation Loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();
    let lastBlinkTime = performance.now();
    let isBlinking = false;
    let blinkDuration = 180; // ms
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    let nextSaccadeTime = performance.now() + 2000;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentAvatar.avatarImage;

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Biological Breathing expansion cycle (sinusoidal)
      const breathingBpm = biology.breathingRateBpm || 16;
      const breathingFreq = (breathingBpm / 60) * 2 * Math.PI;
      const breathScale = 1.0 + Math.sin(elapsed * breathingFreq) * 0.018;
      const breathOffsetY = Math.cos(elapsed * breathingFreq) * 3;

      // 2. Micro-saccadic eye tracking
      if (now > nextSaccadeTime) {
        const saccadeMax = (biology.saccadeIntensity / 100) * 8;
        eyeOffsetX = (Math.random() - 0.5) * saccadeMax;
        eyeOffsetY = (Math.random() - 0.5) * saccadeMax * 0.6;
        nextSaccadeTime = now + 1200 + Math.random() * 2500;
      }

      // 3. Autonomic blinking trigger
      const blinkIntervalMs = (60 / Math.max(8, biology.blinkFrequencyPerMin)) * 1000;
      if (!isBlinking && now - lastBlinkTime > blinkIntervalMs + (Math.random() - 0.5) * 1000) {
        isBlinking = true;
        lastBlinkTime = now;
      }
      if (isBlinking && now - lastBlinkTime > blinkDuration) {
        isBlinking = false;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Gradient Studio Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#09090b');
      bgGrad.addColorStop(0.5, '#18181b');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Avatar Image with biological transformations
      ctx.save();
      ctx.translate(width / 2, height / 2 + breathOffsetY);
      ctx.scale(breathScale, breathScale);

      if (img.complete && img.naturalWidth > 0) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW = width * 0.95;
        let drawH = drawW / imgAspect;
        if (drawH < height) {
          drawH = height;
          drawW = drawH * imgAspect;
        }

        // Draw avatar portrait
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        // Subsurface scattering melanin warmth overlay
        if (biology.subsurfaceGlow > 0) {
          const warmthGrad = ctx.createRadialGradient(0, -30, 40, 0, -30, 220);
          const warmthAlpha = (biology.subsurfaceGlow / 100) * 0.28;
          warmthGrad.addColorStop(0, `rgba(251, 146, 60, ${warmthAlpha})`);
          warmthGrad.addColorStop(0.6, `rgba(234, 88, 12, ${warmthAlpha * 0.5})`);
          warmthGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = warmthGrad;
          ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        }

        // Simulated Blinking overlay
        if (isBlinking) {
          ctx.fillStyle = 'rgba(24, 24, 27, 0.75)';
          // Approximate eye band height
          ctx.fillRect(-drawW * 0.35, -drawH * 0.16, drawW * 0.7, drawH * 0.08);
        }

        // Simulated Viseme Mouth Movement when speaking
        if (isSpeakingPreview) {
          const mouthOpenPct = Math.abs(Math.sin(elapsed * 18)) * 0.7 + 0.3;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
          ctx.beginPath();
          ctx.ellipse(0, drawH * 0.14, 18, 12 * mouthOpenPct, 0, 0, Math.PI * 2);
          ctx.fill();

          // Live phoneme pulse
          ctx.strokeStyle = currentAvatar.accentColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.restore();

      // Atmospheric Vignette Frame
      ctx.save();
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Micro-Expression / Bio HUD Overlay
      if (showBioInspector) {
        ctx.save();
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.strokeStyle = currentAvatar.accentColor;
        ctx.lineWidth = 1;
        ctx.fillRect(15, 15, 260, 110);
        ctx.strokeRect(15, 15, 260, 110);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`BIOLOGY: ${currentAvatar.speciesOrRole.toUpperCase()}`, 25, 34);

        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#10B981';
        ctx.fillText(`• Respiration: ${breathingBpm} BPM (Sinus Active)`, 25, 52);
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(`• Blink Reflex: ${biology.blinkFrequencyPerMin}/min (${isBlinking ? 'BLINK' : 'OPEN'})`, 25, 70);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(`• Ocular Saccades: dx:${eyeOffsetX.toFixed(1)} dy:${eyeOffsetY.toFixed(1)}`, 25, 88);
        ctx.fillStyle = '#EC4899';
        ctx.fillText(`• Subsurface Scattering: ${biology.subsurfaceGlow}% HDR`, 25, 106);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentAvatar, biology, isSpeakingPreview, showBioInspector]);

  // Test Speak Preview
  const handleToggleSpeakPreview = () => {
    if (isSpeakingPreview) {
      audioManager.stopNarration();
      setIsSpeakingPreview(false);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    } else {
      if (!speechScript.trim()) return;
      setIsSpeakingPreview(true);
      audioManager.speakNarration(speechScript.trim(), selectedVoice, () => {
        setIsSpeakingPreview(false);
      });
    }
  };

  // Deploy Avatar directly to Multitrack Timeline
  const handleDeployToTimeline = () => {
    if (!speechScript.trim()) return;

    deployAvatarToTimeline({
      avatar: currentAvatar,
      scriptText: speechScript.trim(),
      voice: selectedVoice,
      microExpression: selectedExpression,
      layout: layoutMode,
      skinTextureDetail: currentAvatar.skinTextureDetail,
    });

    setActiveTab('editor');
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imgUrl = reader.result as string;
      const newCustomProfile: AIAvatarProfile = {
        id: `avatar-custom-${Date.now()}`,
        name: customAvatarName || file.name.replace(/\.[^/.]+$/, ''),
        lifeformType: customAvatarType,
        speciesOrRole: customAvatarRole || (customAvatarType === 'human' ? 'Custom Human Digital Twin' : 'Fauna Digital Twin'),
        skinTextureDetail: '8K High-Fidelity Custom Dermal Mapping',
        biology: {
          breathingRateBpm: 16,
          blinkFrequencyPerMin: 18,
          saccadeIntensity: 45,
          subsurfaceGlow: 70,
          microTwitchFrequency: 30,
          skinMelaninWarmth: 75,
        },
        defaultMicroExpression: 'warm_smile',
        defaultVoice: selectedVoice,
        avatarImage: imgUrl,
        accentColor: '#3B82F6',
        bioDescription: 'User-provided biological clone with personalized micro-expression physics.',
        sampleScript: 'Hello, I am your personalized digital twin, ready to deliver custom video presentations.',
      };

      handleSelectAvatar(newCustomProfile);
      setShowUploadModal(false);
      setCustomAvatarName('');
      setCustomAvatarRole('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
            <Dna className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              AI Avatars & Digital Twins Studio
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                Biological Micro-Expression Engine
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Lifelike virtual life-forms mimicking human, animal, and synthetic biology, skin textures, and facial micro-expressions
            </p>
          </div>
        </div>

        {/* Life-form filter pills */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Life-Forms ({avatars.length})
          </button>
          <button
            onClick={() => setActiveFilter('human')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'human' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Humans
          </button>
          <button
            onClick={() => setActiveFilter('animal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'animal' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Animals & Fauna
          </button>
          <button
            onClick={() => setActiveFilter('synthetic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'synthetic' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Synthetic Life-Forms
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">
        {/* Left Column: Avatar Selector Grid */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Select Virtual Life-Form
            </span>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Clone Twin
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredAvatars.map(av => {
              const isSelected = av.id === currentAvatar.id;
              return (
                <div
                  key={av.id}
                  onClick={() => handleSelectAvatar(av)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-zinc-900 border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={av.avatarImage}
                      alt={av.name}
                      className="w-13 h-13 rounded-xl object-cover border border-zinc-700"
                    />
                    <div
                      style={{ backgroundColor: av.accentColor }}
                      className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-zinc-950"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{av.name}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        {av.lifeformType}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block truncate">{av.speciesOrRole}</span>
                    <span className="text-[9px] text-zinc-500 block truncate mt-0.5 font-mono">
                      {av.skinTextureDetail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Live Biological Stage & Micro-Expression HUD */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Biological Stage
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBioInspector(!showBioInspector)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
                  showBioInspector
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {showBioInspector ? '✓ Bio HUD Active' : 'Show Bio HUD'}
              </button>
            </div>
          </div>

          {/* Interactive HTML5 Canvas Stage */}
          <div className="relative aspect-[16/10] bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full h-full object-cover"
            />

            {/* Quick Micro-expression selector overlay pill */}
            <div className="absolute top-3 right-3 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700/80 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 z-10">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Expression: {selectedExpression.replace('_', ' ').toUpperCase()}</span>
            </div>

            {/* Speaking status indicator */}
            {isSpeakingPreview && (
              <div className="absolute bottom-3 left-3 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-2 shadow-lg animate-pulse z-10">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Simulating Lip-Sync & Visemes...</span>
              </div>
            )}
          </div>

          {/* Biological Micro-Expression Controls */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                Biology & Autonomous Micro-Expressions
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Autonomic Nervous System</span>
            </div>

            {/* Expression presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'neutral', label: 'Neutral' },
                { id: 'warm_smile', label: 'Warm Smile' },
                { id: 'inquisitive_wonder', label: 'Wonder' },
                { id: 'intense_dramatic', label: 'Dramatic' },
                { id: 'serious_anchor', label: 'Serious' },
              ].map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExpression(ex.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition ${
                    selectedExpression === ex.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Biological Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Breathing Rate:</span>
                  <span className="font-mono text-emerald-400">{biology.breathingRateBpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="30"
                  value={biology.breathingRateBpm}
                  onChange={e => setBiology(p => ({ ...p, breathingRateBpm: parseInt(e.target.value, 10) }))}
                  className="w-full accent-emerald-500 h-1 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Blink Frequency:</span>
                  <span className="font-mono text-blue-400">{biology.blinkFrequencyPerMin}/min</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="30"
                  value={biology.blinkFrequencyPerMin}
                  onChange={e => setBiology(p => ({ ...p, blinkFrequencyPerMin: parseInt(e.target.value, 10) }))}
                  className="w-full accent-blue-500 h-1 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Subsurface Glow:</span>
                  <span className="font-mono text-amber-400">{biology.subsurfaceGlow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={biology.subsurfaceGlow}
                  onChange={e => setBiology(p => ({ ...p, subsurfaceGlow: parseInt(e.target.value, 10) }))}
                  className="w-full accent-amber-500 h-1 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Ocular Saccades:</span>
                  <span className="font-mono text-purple-400">{biology.saccadeIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={biology.saccadeIntensity}
                  onChange={e => setBiology(p => ({ ...p, saccadeIntensity: parseInt(e.target.value, 10) }))}
                  className="w-full accent-purple-500 h-1 mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Speech Script, Voice & Deployment Controls */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Speech & Composition
          </span>

          {/* Script Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-400 font-medium">Digital Twin Spoken Script:</label>
              <span className="text-[10px] text-zinc-500 font-mono">{speechScript.length} chars</span>
            </div>
            <textarea
              rows={5}
              value={speechScript}
              onChange={e => setSpeechScript(e.target.value)}
              placeholder="Enter narration or dialogue for this virtual life-form..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none shadow-inner"
            />
          </div>

          {/* Voice Profile Picker */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Neural Voice Timbre:</label>
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Zephyr">Zephyr (Clear & Articulate Narrator)</option>
              <option value="Kore">Kore (Warm Professional Host)</option>
              <option value="Puck">Puck (Energetic Creator)</option>
              <option value="Fenrir">Fenrir (Deep Cinematic Baritone)</option>
              <option value="Charon">Charon (Authoritative Documentary)</option>
            </select>
          </div>

          {/* Screen Layout Mode */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Video Player Layout:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'pip_bottom_right', label: 'PiP (Bottom-Right)' },
                { id: 'pip_bottom_left', label: 'PiP (Bottom-Left)' },
                { id: 'full', label: 'Full Screen Host' },
                { id: 'split_screen', label: 'Split Screen' },
              ].map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setLayoutMode(layout.id as any)}
                  className={`p-1.5 rounded-lg text-[10px] font-semibold border transition text-center ${
                    layoutMode === layout.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 mt-auto">
            <button
              onClick={handleToggleSpeakPreview}
              className={`w-full py-2.5 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                isSpeakingPreview
                  ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
              }`}
            >
              {isSpeakingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSpeakingPreview ? 'Stop Speaking Preview' : 'Test Spoken Micro-Expressions'}
            </button>

            <button
              onClick={handleDeployToTimeline}
              disabled={!speechScript.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Film className="w-4 h-4" />
              Deploy Digital Twin to Timeline
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Clone Twin Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Clone AI Avatar / Digital Twin</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Twin Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alexander Thorne"
                  value={customAvatarName}
                  onChange={e => setCustomAvatarName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Life-Form Classification:</label>
                <select
                  value={customAvatarType}
                  onChange={e => setCustomAvatarType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none"
                >
                  <option value="human">Human Digital Twin</option>
                  <option value="animal">Animal / Fauna Biological Twin</option>
                  <option value="synthetic">Synthetic / Cybernetic Life-Form</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Role / Species Specification:</label>
                <input
                  type="text"
                  placeholder="e.g. Wildlife Biologist, Siberian Husky, Bio-Android"
                  value={customAvatarRole}
                  onChange={e => setCustomAvatarRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Upload Photo / Portrait:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomAvatarUpload}
                  className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  Pause,
  Upload,
  CheckCircle2,
  Eye,
  Activity,
  Heart,
  Sliders,
  Maximize2,
  Film,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Plus,
  Smile,
  Dna,
} from 'lucide-react';
import { AIAvatarProfile, AvatarLifeformType, AvatarMicroExpression } from "./types";
import { audioManager } from "./audioManager";

export const AvatarsStudio: React.FC = () => {
  const {
    avatars,
    selectedAvatar,
    setSelectedAvatar,
    deployAvatarToTimeline,
    setActiveTab,
  } = useProject();

  const [activeFilter, setActiveFilter] = useState<'all' | AvatarLifeformType>('all');
  const [currentAvatar, setCurrentAvatar] = useState<AIAvatarProfile>(selectedAvatar || avatars[0]);
  const [selectedExpression, setSelectedExpression] = useState<AvatarMicroExpression>(
    currentAvatar?.defaultMicroExpression || 'warm_smile'
  );
  const [selectedVoice, setSelectedVoice] = useState<string>(currentAvatar?.defaultVoice || 'Zephyr');
  const [speechScript, setSpeechScript] = useState<string>(currentAvatar?.sampleScript || '');
  const [layoutMode, setLayoutMode] = useState<'full' | 'pip_bottom_right' | 'pip_bottom_left' | 'split_screen'>('pip_bottom_right');
  const [isSpeakingPreview, setIsSpeakingPreview] = useState<boolean>(false);
  const [showBioInspector, setShowBioInspector] = useState<boolean>(false);

  // Biological parameters state
  const [biology, setBiology] = useState(currentAvatar?.biology || {
    breathingRateBpm: 16,
    blinkFrequencyPerMin: 18,
    saccadeIntensity: 40,
    subsurfaceGlow: 75,
    microTwitchFrequency: 25,
    skinMelaninWarmth: 80,
  });

  // Custom photo avatar upload
  const [customAvatarName, setCustomAvatarName] = useState<string>('');
  const [customAvatarRole, setCustomAvatarRole] = useState<string>('');
  const [customAvatarType, setCustomAvatarType] = useState<AvatarLifeformType>('human');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Live Canvas Animation Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speakingTimerRef = useRef<any>(null);

  // Sync when selected avatar changes
  useEffect(() => {
    if (selectedAvatar) {
      setCurrentAvatar(selectedAvatar);
      setSelectedExpression(selectedAvatar.defaultMicroExpression);
      setSelectedVoice(selectedAvatar.defaultVoice);
      setSpeechScript(selectedAvatar.sampleScript);
      setBiology(selectedAvatar.biology);
    }
  }, [selectedAvatar]);

  const filteredAvatars = avatars.filter(a => {
    if (activeFilter === 'all') return true;
    return a.lifeformType === activeFilter;
  });

  const handleSelectAvatar = (avatar: AIAvatarProfile) => {
    setCurrentAvatar(avatar);
    setSelectedAvatar(avatar);
    setSelectedExpression(avatar.defaultMicroExpression);
    setSelectedVoice(avatar.defaultVoice);
    setSpeechScript(avatar.sampleScript);
    setBiology(avatar.biology);
    if (isSpeakingPreview) {
      audioManager.stopNarration();
      setIsSpeakingPreview(false);
    }
  };

  // Live Biological Simulation Loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();
    let lastBlinkTime = performance.now();
    let isBlinking = false;
    let blinkDuration = 180; // ms
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    let nextSaccadeTime = performance.now() + 2000;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentAvatar.avatarImage;

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Biological Breathing expansion cycle (sinusoidal)
      const breathingBpm = biology.breathingRateBpm || 16;
      const breathingFreq = (breathingBpm / 60) * 2 * Math.PI;
      const breathScale = 1.0 + Math.sin(elapsed * breathingFreq) * 0.018;
      const breathOffsetY = Math.cos(elapsed * breathingFreq) * 3;

      // 2. Micro-saccadic eye tracking
      if (now > nextSaccadeTime) {
        const saccadeMax = (biology.saccadeIntensity / 100) * 8;
        eyeOffsetX = (Math.random() - 0.5) * saccadeMax;
        eyeOffsetY = (Math.random() - 0.5) * saccadeMax * 0.6;
        nextSaccadeTime = now + 1200 + Math.random() * 2500;
      }

      // 3. Autonomic blinking trigger
      const blinkIntervalMs = (60 / Math.max(8, biology.blinkFrequencyPerMin)) * 1000;
      if (!isBlinking && now - lastBlinkTime > blinkIntervalMs + (Math.random() - 0.5) * 1000) {
        isBlinking = true;
        lastBlinkTime = now;
      }
      if (isBlinking && now - lastBlinkTime > blinkDuration) {
        isBlinking = false;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Gradient Studio Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#09090b');
      bgGrad.addColorStop(0.5, '#18181b');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Avatar Image with biological transformations
      ctx.save();
      ctx.translate(width / 2, height / 2 + breathOffsetY);
      ctx.scale(breathScale, breathScale);

      if (img.complete && img.naturalWidth > 0) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW = width * 0.95;
        let drawH = drawW / imgAspect;
        if (drawH < height) {
          drawH = height;
          drawW = drawH * imgAspect;
        }

        // Draw avatar portrait
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        // Subsurface scattering melanin warmth overlay
        if (biology.subsurfaceGlow > 0) {
          const warmthGrad = ctx.createRadialGradient(0, -30, 40, 0, -30, 220);
          const warmthAlpha = (biology.subsurfaceGlow / 100) * 0.28;
          warmthGrad.addColorStop(0, `rgba(251, 146, 60, ${warmthAlpha})`);
          warmthGrad.addColorStop(0.6, `rgba(234, 88, 12, ${warmthAlpha * 0.5})`);
          warmthGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = warmthGrad;
          ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        }

        // Simulated Blinking overlay
        if (isBlinking) {
          ctx.fillStyle = 'rgba(24, 24, 27, 0.75)';
          // Approximate eye band height
          ctx.fillRect(-drawW * 0.35, -drawH * 0.16, drawW * 0.7, drawH * 0.08);
        }

        // Simulated Viseme Mouth Movement when speaking
        if (isSpeakingPreview) {
          const mouthOpenPct = Math.abs(Math.sin(elapsed * 18)) * 0.7 + 0.3;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
          ctx.beginPath();
          ctx.ellipse(0, drawH * 0.14, 18, 12 * mouthOpenPct, 0, 0, Math.PI * 2);
          ctx.fill();

          // Live phoneme pulse
          ctx.strokeStyle = currentAvatar.accentColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.restore();

      // Atmospheric Vignette Frame
      ctx.save();
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Micro-Expression / Bio HUD Overlay
      if (showBioInspector) {
        ctx.save();
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.strokeStyle = currentAvatar.accentColor;
        ctx.lineWidth = 1;
        ctx.fillRect(15, 15, 260, 110);
        ctx.strokeRect(15, 15, 260, 110);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`BIOLOGY: ${currentAvatar.speciesOrRole.toUpperCase()}`, 25, 34);

        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#10B981';
        ctx.fillText(`• Respiration: ${breathingBpm} BPM (Sinus Active)`, 25, 52);
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(`• Blink Reflex: ${biology.blinkFrequencyPerMin}/min (${isBlinking ? 'BLINK' : 'OPEN'})`, 25, 70);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(`• Ocular Saccades: dx:${eyeOffsetX.toFixed(1)} dy:${eyeOffsetY.toFixed(1)}`, 25, 88);
        ctx.fillStyle = '#EC4899';
        ctx.fillText(`• Subsurface Scattering: ${biology.subsurfaceGlow}% HDR`, 25, 106);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentAvatar, biology, isSpeakingPreview, showBioInspector]);

  // Test Speak Preview
  const handleToggleSpeakPreview = () => {
    if (isSpeakingPreview) {
      audioManager.stopNarration();
      setIsSpeakingPreview(false);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    } else {
      if (!speechScript.trim()) return;
      setIsSpeakingPreview(true);
      audioManager.speakNarration(speechScript.trim(), selectedVoice, () => {
        setIsSpeakingPreview(false);
      });
    }
  };

  // Deploy Avatar directly to Multitrack Timeline
  const handleDeployToTimeline = () => {
    if (!speechScript.trim()) return;

    deployAvatarToTimeline({
      avatar: currentAvatar,
      scriptText: speechScript.trim(),
      voice: selectedVoice,
      microExpression: selectedExpression,
      layout: layoutMode,
      skinTextureDetail: currentAvatar.skinTextureDetail,
    });

    setActiveTab('editor');
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imgUrl = reader.result as string;
      const newCustomProfile: AIAvatarProfile = {
        id: `avatar-custom-${Date.now()}`,
        name: customAvatarName || file.name.replace(/\.[^/.]+$/, ''),
        lifeformType: customAvatarType,
        speciesOrRole: customAvatarRole || (customAvatarType === 'human' ? 'Custom Human Digital Twin' : 'Fauna Digital Twin'),
        skinTextureDetail: '8K High-Fidelity Custom Dermal Mapping',
        biology: {
          breathingRateBpm: 16,
          blinkFrequencyPerMin: 18,
          saccadeIntensity: 45,
          subsurfaceGlow: 70,
          microTwitchFrequency: 30,
          skinMelaninWarmth: 75,
        },
        defaultMicroExpression: 'warm_smile',
        defaultVoice: selectedVoice,
        avatarImage: imgUrl,
        accentColor: '#3B82F6',
        bioDescription: 'User-provided biological clone with personalized micro-expression physics.',
        sampleScript: 'Hello, I am your personalized digital twin, ready to deliver custom video presentations.',
      };

      handleSelectAvatar(newCustomProfile);
      setShowUploadModal(false);
      setCustomAvatarName('');
      setCustomAvatarRole('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
            <Dna className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              AI Avatars & Digital Twins Studio
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                Biological Micro-Expression Engine
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Lifelike virtual life-forms mimicking human, animal, and synthetic biology, skin textures, and facial micro-expressions
            </p>
          </div>
        </div>

        {/* Life-form filter pills */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Life-Forms ({avatars.length})
          </button>
          <button
            onClick={() => setActiveFilter('human')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'human' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Humans
          </button>
          <button
            onClick={() => setActiveFilter('animal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'animal' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Animals & Fauna
          </button>
          <button
            onClick={() => setActiveFilter('synthetic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilter === 'synthetic' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Synthetic Life-Forms
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">
        {/* Left Column: Avatar Selector Grid */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Select Virtual Life-Form
            </span>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Clone Twin
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredAvatars.map(av => {
              const isSelected = av.id === currentAvatar.id;
              return (
                <div
                  key={av.id}
                  onClick={() => handleSelectAvatar(av)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-zinc-900 border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={av.avatarImage}
                      alt={av.name}
                      className="w-13 h-13 rounded-xl object-cover border border-zinc-700"
                    />
                    <div
                      style={{ backgroundColor: av.accentColor }}
                      className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-zinc-950"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{av.name}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        {av.lifeformType}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block truncate">{av.speciesOrRole}</span>
                    <span className="text-[9px] text-zinc-500 block truncate mt-0.5 font-mono">
                      {av.skinTextureDetail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Live Biological Stage & Micro-Expression HUD */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Biological Stage
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBioInspector(!showBioInspector)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
                  showBioInspector
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {showBioInspector ? '✓ Bio HUD Active' : 'Show Bio HUD'}
              </button>
            </div>
          </div>

          {/* Interactive HTML5 Canvas Stage */}
          <div className="relative aspect-[16/10] bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full h-full object-cover"
            />

            {/* Quick Micro-expression selector overlay pill */}
            <div className="absolute top-3 right-3 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700/80 text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 z-10">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Expression: {selectedExpression.replace('_', ' ').toUpperCase()}</span>
            </div>

            {/* Speaking status indicator */}
            {isSpeakingPreview && (
              <div className="absolute bottom-3 left-3 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-2 shadow-lg animate-pulse z-10">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Simulating Lip-Sync & Visemes...</span>
              </div>
            )}
          </div>

          {/* Biological Micro-Expression Controls */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                Biology & Autonomous Micro-Expressions
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Autonomic Nervous System</span>
            </div>

            {/* Expression presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'neutral', label: 'Neutral' },
                { id: 'warm_smile', label: 'Warm Smile' },
                { id: 'inquisitive_wonder', label: 'Wonder' },
                { id: 'intense_dramatic', label: 'Dramatic' },
                { id: 'serious_anchor', label: 'Serious' },
              ].map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExpression(ex.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition ${
                    selectedExpression === ex.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Biological Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Breathing Rate:</span>
                  <span className="font-mono text-emerald-400">{biology.breathingRateBpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="30"
                  value={biology.breathingRateBpm}
                  onChange={e => setBiology(p => ({ ...p, breathingRateBpm: parseInt(e.target.value, 10) }))}
                  className="w-full accent-emerald-500 h-1 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Blink Frequency:</span>
                  <span className="font-mono text-blue-400">{biology.blinkFrequencyPerMin}/min</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="30"
                  value={biology.blinkFrequencyPerMin}
                  onChange={e => setBiology(p => ({ ...p, blinkFrequencyPerMin: parseInt(e.target.value, 10) }))}
                  className="w-full accent-blue-500 h-1 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Subsurface Glow:</span>
                  <span className="font-mono text-amber-400">{biology.subsurfaceGlow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={biology.subsurfaceGlow}
                  onChange={e => setBiology(p => ({ ...p, subsurfaceGlow: parseInt(e.target.value, 10) }))}
                  className="w-full accent-amber-500 h-1 mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>Ocular Saccades:</span>
                  <span className="font-mono text-purple-400">{biology.saccadeIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={biology.saccadeIntensity}
                  onChange={e => setBiology(p => ({ ...p, saccadeIntensity: parseInt(e.target.value, 10) }))}
                  className="w-full accent-purple-500 h-1 mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Speech Script, Voice & Deployment Controls */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Speech & Composition
          </span>

          {/* Script Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-400 font-medium">Digital Twin Spoken Script:</label>
              <span className="text-[10px] text-zinc-500 font-mono">{speechScript.length} chars</span>
            </div>
            <textarea
              rows={5}
              value={speechScript}
              onChange={e => setSpeechScript(e.target.value)}
              placeholder="Enter narration or dialogue for this virtual life-form..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none shadow-inner"
            />
          </div>

          {/* Voice Profile Picker */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Neural Voice Timbre:</label>
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Zephyr">Zephyr (Clear & Articulate Narrator)</option>
              <option value="Kore">Kore (Warm Professional Host)</option>
              <option value="Puck">Puck (Energetic Creator)</option>
              <option value="Fenrir">Fenrir (Deep Cinematic Baritone)</option>
              <option value="Charon">Charon (Authoritative Documentary)</option>
            </select>
          </div>

          {/* Screen Layout Mode */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Video Player Layout:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'pip_bottom_right', label: 'PiP (Bottom-Right)' },
                { id: 'pip_bottom_left', label: 'PiP (Bottom-Left)' },
                { id: 'full', label: 'Full Screen Host' },
                { id: 'split_screen', label: 'Split Screen' },
              ].map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setLayoutMode(layout.id as any)}
                  className={`p-1.5 rounded-lg text-[10px] font-semibold border transition text-center ${
                    layoutMode === layout.id
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 mt-auto">
            <button
              onClick={handleToggleSpeakPreview}
              className={`w-full py-2.5 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                isSpeakingPreview
                  ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white'
              }`}
            >
              {isSpeakingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSpeakingPreview ? 'Stop Speaking Preview' : 'Test Spoken Micro-Expressions'}
            </button>

            <button
              onClick={handleDeployToTimeline}
              disabled={!speechScript.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Film className="w-4 h-4" />
              Deploy Digital Twin to Timeline
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Clone Twin Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Clone AI Avatar / Digital Twin</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Twin Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alexander Thorne"
                  value={customAvatarName}
                  onChange={e => setCustomAvatarName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Life-Form Classification:</label>
                <select
                  value={customAvatarType}
                  onChange={e => setCustomAvatarType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none"
                >
                  <option value="human">Human Digital Twin</option>
                  <option value="animal">Animal / Fauna Biological Twin</option>
                  <option value="synthetic">Synthetic / Cybernetic Life-Form</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Role / Species Specification:</label>
                <input
                  type="text"
                  placeholder="e.g. Wildlife Biologist, Siberian Husky, Bio-Android"
                  value={customAvatarRole}
                  onChange={e => setCustomAvatarRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Upload Photo / Portrait:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomAvatarUpload}
                  className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
