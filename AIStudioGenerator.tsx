import React, { useState } from 'react';
import { useProject } from "./ProjectContext";
import {
  Sparkles,
  Wand2,
  Play,
  Volume2,
  Film,
  Layers,
  ArrowRight,
  CheckCircle2,
  Compass,
  Zap,
} from 'lucide-react';
import { audioEngine } from "./audioEngine";

export const AIStudioGenerator: React.FC = () => {
  const { generateAIVideo, isAIGenerating, setActiveTab } = useProject();

  const [prompt, setPrompt] = useState<string>('');
  const [tone, setTone] = useState<string>('engaging');
  const [format, setFormat] = useState<string>('16:9');
  const [voice, setVoice] = useState<string>('Zephyr');
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState<string | null>(null);

  const samplePrompts = [
    'Create a 30s viral TikTok on why AI audio and video editors are replacing legacy NLE workflows.',
    'Cinematic product reveal for an ultra-fast cyberpunk smartwatch with neon B-roll and punchy hook.',
    'YouTube Shorts explaining how quantum computers break modern encryption with dramatic visuals.',
    'Educational breakdown: 3 secrets high-retention creators use to keep viewers watching past 5 seconds.',
  ];

  const handleVoicePreview = () => {
    audioEngine.speakNarration('Welcome to OmniCut Studio. Powered by Gemini AI for next generation storytelling.', voice);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const res = await generateAIVideo(prompt, tone, format);
    if (res?.projectTitle) {
      setLastGeneratedTitle(res.projectTitle);
      // Auto-switch to editor view to immediately depict the live video
      setActiveTab('editor');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              Invideo AI Prompt-to-Video Engine
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Generate entire storyboard scenes, narration, B-roll cues, and subtitles in seconds
            </p>
          </div>
        </div>

        {lastGeneratedTitle && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Assembled: <strong>{lastGeneratedTitle}</strong></span>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-zinc-300 max-w-4xl mx-auto w-full">
        {/* Main Prompt Input Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>Video Idea, Script or Topic:</span>
            <span className="text-[11px] text-zinc-500">Supports scripts, bullet points, or creative concepts</span>
          </label>
          <div className="relative">
            <textarea
              rows={4}
              placeholder="e.g. Create a 30s high-energy video for tech founders explaining why AI will transform media production in 2026..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-inner resize-none"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono">{prompt.length} chars</span>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">Quick Creative Prompts:</span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p)}
                className="text-left text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg transition"
              >
                "{p.slice(0, 48)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Generation Settings Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          {/* Tone Selector */}
          <div>
            <label className="text-zinc-400 font-medium block mb-1.5">Pacing & Tone:</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200"
            >
              <option value="engaging">Viral & High Energy (TikTok/Reels)</option>
              <option value="cinematic">Cinematic & Dramatic (YouTube 4K)</option>
              <option value="authoritative">Professional & Authoritative (B2B)</option>
              <option value="casual">Casual & Conversational (Podcast)</option>
            </select>
          </div>

          {/* Aspect Format */}
          <div>
            <label className="text-zinc-400 font-medium block mb-1.5">Target Platform Aspect:</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200"
            >
              <option value="16:9">16:9 Landscape (YouTube & Premiere)</option>
              <option value="9:16">9:16 Vertical (TikTok & Reels & Shorts)</option>
              <option value="1:1">1:1 Square (LinkedIn & X Feed)</option>
            </select>
          </div>

          {/* AI Voice Selection with Preview */}
          <div>
            <label className="text-zinc-400 font-medium block mb-1.5 flex items-center justify-between">
              <span>Neural Voiceover:</span>
              <button
                onClick={handleVoicePreview}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" /> Preview
              </button>
            </label>
            <select
              value={voice}
              onChange={e => setVoice(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200"
            >
              <option value="Zephyr">Zephyr (Confident Studio Narrator)</option>
              <option value="Kore">Kore (Warm & Articulate Professional)</option>
              <option value="Puck">Puck (Energetic Youth Creator)</option>
              <option value="Fenrir">Fenrir (Deep Cinematic Movie Voice)</option>
              <option value="Charon">Charon (Authoritative Documentary)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={() => setActiveTab('editor')}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
          >
            Cancel / Back to Timeline
          </button>

          <button
            onClick={handleGenerate}
            disabled={isAIGenerating || !prompt.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold shadow-xl transition transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAIGenerating ? 'animate-spin' : ''}`} />
            {isAIGenerating ? 'Synthesizing Live Storyboard & Video...' : 'Execute Invideo Prompt'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
