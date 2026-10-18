import React, { useState } from 'react';
import { useProject } from "./ProjectContext";
import {
  Type,
  Sparkles,
  Palette,
  Sliders,
  AlignVerticalJustifyCenter,
  MoveVertical,
  Wand2,
  Check,
} from 'lucide-react';
import { CaptionStyle } from "./types";

export const CaptionsStudio: React.FC = () => {
  const { captionStyle, setCaptionStyle, clips, currentTime } = useProject();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active caption text for live preview
  const activeCaption = clips.find(
    c => c.trackId === 'track-captions' && currentTime >= c.start && currentTime <= c.start + c.duration
  );
  const sampleText = activeCaption?.text || 'EDIT VIDEOS 10X FASTER WITH AI';

  const applyPreset = (preset: CaptionStyle['preset']) => {
    switch (preset) {
      case 'hormozi':
        setCaptionStyle({
          preset: 'hormozi',
          fontFamily: 'Syne, sans-serif',
          fontSize: 40,
          textColor: '#FFFFFF',
          highlightColor: '#FACC15', // Vibrant yellow
          strokeColor: '#000000',
          strokeWidth: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backgroundPadding: 14,
          borderRadius: 8,
          positionY: 82,
          uppercase: true,
          animation: 'bounce',
        });
        break;
      case 'neon':
        setCaptionStyle({
          preset: 'neon',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 34,
          textColor: '#06B6D4',
          highlightColor: '#EC4899', // Hot Pink
          strokeColor: '#000000',
          strokeWidth: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backgroundPadding: 12,
          borderRadius: 12,
          positionY: 80,
          uppercase: true,
          animation: 'pop',
        });
        break;
      case 'minimal':
        setCaptionStyle({
          preset: 'minimal',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 30,
          textColor: '#FFFFFF',
          highlightColor: '#38BDF8',
          strokeColor: '#000000',
          strokeWidth: 1,
          backgroundColor: 'rgba(24, 24, 27, 0.6)',
          backgroundPadding: 10,
          borderRadius: 6,
          positionY: 84,
          uppercase: false,
          animation: 'fade',
        });
        break;
      case 'karaoke':
        setCaptionStyle({
          preset: 'karaoke',
          fontFamily: 'Syne, sans-serif',
          fontSize: 38,
          textColor: '#E2E8F0',
          highlightColor: '#10B981', // Emerald
          strokeColor: '#022C22',
          strokeWidth: 3,
          backgroundColor: 'rgba(2, 44, 34, 0.7)',
          backgroundPadding: 16,
          borderRadius: 10,
          positionY: 78,
          uppercase: true,
          animation: 'bounce',
        });
        break;
      case 'editorial':
        setCaptionStyle({
          preset: 'editorial',
          fontFamily: 'Georgia, serif',
          fontSize: 32,
          textColor: '#FEF08A',
          highlightColor: '#F59E0B',
          strokeColor: '#000000',
          strokeWidth: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backgroundPadding: 12,
          borderRadius: 4,
          positionY: 85,
          uppercase: false,
          animation: 'none',
        });
        break;
    }
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          style: captionStyle.preset,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.captions?.[0]?.suggestedColor) {
          setCaptionStyle(prev => ({
            ...prev,
            highlightColor: data.captions[0].suggestedColor,
          }));
        }
      }
    } catch (e) {
      console.warn('AI caption call failed, keeping optimized preset', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400">
            <Type className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide">
              VEED.io Smart Subtitles
            </h3>
            <p className="text-[10px] text-zinc-400">
              Viral animated caption presets & word highlighting
            </p>
          </div>
        </div>

        <button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          AI Optimize
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-5 text-xs text-zinc-300">
        {/* Style Presets Grid */}
        <div>
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Viral Caption Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'hormozi', name: 'Hormozi Viral', badge: 'High Retention', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
              { id: 'neon', name: 'Cyber Neon', badge: 'Gaming / Tech', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' },
              { id: 'minimal', name: 'Clean Minimal', badge: 'Commercial', color: 'border-zinc-700 bg-zinc-900 text-zinc-200' },
              { id: 'karaoke', name: 'Karaoke Pulse', badge: 'Word by Word', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id as any)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  captionStyle.preset === p.id
                    ? `${p.color} ring-2 ring-blue-500 shadow-md`
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-white">{p.name}</span>
                  {captionStyle.preset === p.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <span className="text-[10px] opacity-75 mt-1">{p.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Box */}
        <div>
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Live Caption Preview
          </label>
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center min-h-[90px] shadow-inner">
            <div
              style={{
                fontFamily: captionStyle.fontFamily,
                fontSize: `${Math.min(26, captionStyle.fontSize * 0.65)}px`,
                color: captionStyle.highlightColor,
                backgroundColor: captionStyle.backgroundColor,
                padding: `${captionStyle.backgroundPadding * 0.7}px`,
                borderRadius: `${captionStyle.borderRadius}px`,
                WebkitTextStroke: `${captionStyle.strokeWidth * 0.6}px ${captionStyle.strokeColor}`,
              }}
              className="font-extrabold text-center uppercase tracking-wide shadow-md"
            >
              {captionStyle.uppercase ? sampleText.toUpperCase() : sampleText}
            </div>
          </div>
        </div>

        {/* Typography & Position Sliders */}
        <div className="space-y-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Font Size:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="24"
                max="56"
                value={captionStyle.fontSize}
                onChange={e => setCaptionStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))}
                className="w-24 accent-blue-500 h-1"
              />
              <span className="font-mono text-zinc-300 w-8 text-right">{captionStyle.fontSize}px</span>
            </div>
          </div>

          {/* Vertical Position */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <MoveVertical className="w-3.5 h-3.5" /> Vertical Position:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="95"
                value={captionStyle.positionY}
                onChange={e => setCaptionStyle(prev => ({ ...prev, positionY: parseInt(e.target.value, 10) }))}
                className="w-24 accent-blue-500 h-1"
              />
              <span className="font-mono text-zinc-300 w-8 text-right">{captionStyle.positionY}%</span>
            </div>
          </div>

          {/* Outline Stroke Width */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Text Stroke Outline:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="8"
                value={captionStyle.strokeWidth}
                onChange={e => setCaptionStyle(prev => ({ ...prev, strokeWidth: parseInt(e.target.value, 10) }))}
                className="w-24 accent-blue-500 h-1"
              />
              <span className="font-mono text-zinc-300 w-8 text-right">{captionStyle.strokeWidth}px</span>
            </div>
          </div>

          {/* Highlight Color Palette */}
          <div>
            <span className="text-zinc-400 block mb-1.5">Active Highlight Color:</span>
            <div className="flex items-center gap-2">
              {[
                { name: 'Yellow', hex: '#FACC15' },
                { name: 'Green', hex: '#10B981' },
                { name: 'Cyan', hex: '#06B6D4' },
                { name: 'Pink', hex: '#EC4899' },
                { name: 'White', hex: '#FFFFFF' },
              ].map(c => (
                <button
                  key={c.hex}
                  onClick={() => setCaptionStyle(prev => ({ ...prev, highlightColor: c.hex }))}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                    captionStyle.highlightColor === c.hex ? 'border-white ring-2 ring-blue-500' : 'border-transparent'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* All Caps Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-zinc-400">Force Uppercase (All Caps)</span>
            <button
              onClick={() => setCaptionStyle(prev => ({ ...prev, uppercase: !prev.uppercase }))}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                captionStyle.uppercase ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                  captionStyle.uppercase ? 'left-5.5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
