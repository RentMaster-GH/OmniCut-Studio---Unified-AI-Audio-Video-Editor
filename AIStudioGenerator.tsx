import React, { useState } from 'react';
import { useProject } from '@/ProjectContext';
import { Sparkles, Loader2, Video, Film, Wand2, ArrowRight } from 'lucide-react';

export const AIStudioGenerator: React.FC = () => {
  const { generateAIVideo, isAIGenerating, setActiveTab } = useProject();
  const [prompt, setPrompt] = useState('Cinematic product reveal for an ultra-fast cyberpunk smartwatch with neon B-roll and punchy hook');
  const [localGenerating, setLocalGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLocalGenerating(true);
    setStatusMessage('🧠 AI Engine analyzing your prompt concept...');
    
    // Simulate generation checkpoints across the pipeline
    setTimeout(() => {
      setStatusMessage('✍️ Writing professional cyberpunk script & hooks...');
    }, 1500);

    setTimeout(() => {
      setStatusMessage('🎨 Selecting neon B-roll scenes and synthesizing video tracks...');
    }, 3000);

    setTimeout(() => {
      setStatusMessage('🎵 Mastering multitrack audio & equalizing timeline channels...');
    }, 4500);

    setTimeout(async () => {
      // Execute the context video generator hook to populate timelines
      if (generateAIVideo) {
        await generateAIVideo(prompt, 'Energetic', '16:9');
      }
      setLocalGenerating(false);
      setStatusMessage('');
      // Route the user straight back to the Editor Studio workspace to see the results live!
      setActiveTab('editor');
    }, 6000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-6">
      {/* Upper Descriptive Header Banner */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-5 mb-6">
        <div className="p-2 rounded bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">Invideo AI Prompt Studio</h2>
          <p className="text-xs text-zinc-400">Transform raw descriptive concepts into finished linear video projects instantly</p>
        </div>
      </div>

      {/* Main Core Form Inputs */}
      <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full justify-center">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-500">
            Describe your video layout idea, script theme or target topic:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={localGenerating}
            className="w-full h-32 bg-zinc-900 border border-zinc-800 focus:border-purple-500/80 rounded-xl p-3.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition resize-none font-medium leading-relaxed"
            placeholder="Type your creative concept here from scratch..."
          />
        </div>

        {/* Dynamic Status Loading Micro-Banner */}
        {localGenerating && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 animate-pulse text-xs">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
            <span className="font-medium font-mono">{statusMessage}</span>
          </div>
        )}

        {/* The Generative Command Action Trigger Button */}
        <button
          onClick={handleGenerate}
          disabled={localGenerating || !prompt.trim()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 font-bold text-xs shadow-xl shadow-purple-950/20 transition transform active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {localGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Full Video Elements...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Generate Full Video Project</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-60" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
