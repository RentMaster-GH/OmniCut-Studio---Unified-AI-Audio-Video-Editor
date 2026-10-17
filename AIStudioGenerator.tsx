import React, { useState } from 'react';
import { useProject } from './ProjectContext';
import {
  Sparkles,
  Wand2,
  Volume2,
  Film,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Shirt,
  Loader2
} from 'lucide-react';
import { audioEngine } from './audioEngine';

type StudioEngineMode = 'text-to-video' | 'video-to-video' | 'virtual-tryon';

export const AIStudioGenerator: React.FC = () => {
  const { generateAIVideo, isAIGenerating, setActiveTab } = useProject();

  const [activeEngineMode, setActiveEngineMode] = useState<StudioEngineMode>('text-to-video');
  const [prompt, setPrompt] = useState<string>('');
  const [tone, setTone] = useState<string>('engaging');
  const [format, setFormat] = useState<string>('16:9');
  const [voice, setVoice] = useState<string>('Zephyr');
  const [targetAestheticStyle, setTargetAestheticStyle] = useState<string>('Cyberpunk Anime');
  const [targetOutfitType, setTargetOutfitType] = useState<string>('Futuristic Leather Jacket');
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
    if (activeEngineMode === 'text-to-video' &&!prompt.trim()) return;

    const finalizedConceptPrompt = activeEngineMode === 'text-to-video'
      ? prompt
      : activeEngineMode === 'video-to-video'
        ? `Restyled video into ${targetAestheticStyle} theme blueprint`
        : `AI Virtual Try-On outfit swap into ${targetOutfitType}`;

    const res = await generateAIVideo(finalizedConceptPrompt, tone, format, activeEngineMode);
    
    if (res?.projectTitle || res?.title) {
      setLastGeneratedTitle(res.projectTitle || res.title);
      setTimeout(() => {
        setActiveTab('editor');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              YouCam AI Generation Suite
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Deploy high-fidelity text-to-video, restyling diffusions, and digital clothing swaps
            </p>
          </div>
        </div>

        {/* Engine switcher tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() =>!isAIGenerating && setActiveEngineMode('text-to-video')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${activeEngineMode === 'text-to-video'? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Film className="w-3 h-3" />
            <span>Prompt Studio</span>
          </button>
          <button
            type="button"
            onClick={() =>!isAIGenerating && setActiveEngineMode('video-to-video')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${activeEngineMode === 'video-to-video'? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>AI Restyler</span>
          </button>
          <button
            type="button"
            onClick={() =>!isAIGenerating && setActiveEngineMode('virtual-tryon')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${activeEngineMode === 'virtual-tryon'? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Shirt className="w-3 h-3" />
            <span>AI Try-On</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-zinc-300 max-w-4xl mx-auto w-full flex flex-col justify-center">
        {/* Dynamic content rendering options */}
        {activeEngineMode === 'text-to-video' && (
          <>
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
                  disabled={isAIGenerating}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-inner resize-none"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">{prompt.length} chars</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">Quick Creative Prompts:</span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="text-left text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg transition"
                  >
                    "{p.slice(0, 48)}..."
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeEngineMode === 'video-to-video' && (
          <div className="flex flex-col gap-4 bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                Select target aesthetic diffusion filter template:
              </label>
              <select
                value={targetAestheticStyle}
                onChange={e => setTargetAestheticStyle(e.target.value)}
                disabled={isAIGenerating}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none cursor-pointer focus:border-purple-500"
              >
                <option value="Cyberpunk Anime">Cyberpunk Anime (Vibrant neon shading curves)</option>
                <option value="Van Gogh Oil Painting">Van Gogh Impressionist (Thick oil canvas textures)</option>
                <option value="Vintage 1970s Hollywood Film">Vintage 1970s Hollywood Film (Warped grain anomalies)</option>
                <option value="3D Pixar Animation Blueprint">3D Unreal Studio Rendering (Claymation modeling matrices)</option>
              </select>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              💡 YouCam Translation Node: This configuration translates active track layers frame-by-frame while utilizing temporal-consistency locks to stop image fluttering patterns.
            </p>
          </div>
        )}

        {activeEngineMode === 'virtual-tryon' && (
          <div className="flex flex-col gap-4 bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                Choose targeted digital garment item replacement:
              </label>
              <select
                value={targetOutfitType}
                onChange={e => setTargetOutfitType(e.target.value)}
                disabled={isAIGenerating}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none cursor-pointer focus:border-purple-500"
              >
                <option value="Futuristic Cyberpunk Leather Jacket">Futuristic Cyberpunk Leather Jacket</option>
                <option value="Formal Silk Red Carpet Tuxedo Plait">Formal Silk Red Carpet Tuxedo Plait</option>
                <option value="Oversized Streetwear Techwear Hoodie">Oversized Streetwear Techwear Hoodie</option>
                <option value="Bohemian Floral Summer Maxi Dress Piece">Bohemian Floral Summer Maxi Dress Piece</option>
              </select>
            </div>
            💡 YouCam VTO Module: The system automatically identifies person parameters on your timeline tracks and warps the textile textures directly to their posture dimensions.

          </div>
        )}

        {/* Global Settings Block */}

        Pacing & Tone:
        <select
          value={tone}
          onChange={e => setTone(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
        >
          Viral & High Energy (TikTok/Reels)
          Cinematic & Dramatic (YouTube 4K)
          Professional & Authoritative (B2B)
          Casual & Conversational (Podcast)

          Target Platform Aspect:
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
          >
            16:9 Landscape (YouTube & Premiere)
            9:16 Vertical (TikTok & Reels & Shorts)
            1:1 Square (LinkedIn & X Feed)

            <select
              value={voice}
              onChange={e => setVoice(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              Zephyr (Confident Studio Narrator)
              Kore (Warm & Articulate Professional)
              Puck (Energetic Youth Creator)
              Fenrir (Deep Cinematic Movie Voice)
              Charon (Authoritative Documentary)

              {/* Action Buttons */}

              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
              >
                Cancel / Back to Timeline
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isAIGenerating || (activeEngineMode === 'text-to-video' &&!prompt.trim())}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold shadow-xl transition transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isAIGenerating? (
                    <>

                      Synthesizing Storyboard & Clips...
                    </>
                  ) : (
                    <>

                      {activeEngineMode === 'text-to-video' && 'Generate Full Video Project'}
                      {activeEngineMode === 'video-to-video' && 'Bake AI Style Overlays'}
                      {activeEngineMode === 'virtual-tryon' && 'Execute Digital Garment Swap'}
                    </>
                  )}
                </button>
              </button>
            </select>
          </select>
        </select>
      </div>
    </div>
  );
};
