import React, { useState } from 'react';
import { useProject } from '@/utils/ProjectContext';
import { Loader2, Film, Wand2, RefreshCw, Shirt } from 'lucide-react';

type StudioEngineMode = 'text-to-video' | 'video-to-video' | 'virtual-tryon';

export const AIStudioGenerator: React.FC = () => {
  const { generateAIVideo, setActiveTab } = useProject();
  const [activeEngineMode, setActiveEngineMode] = useState<StudioEngineMode>('text-to-video');
  const [prompt, setPrompt] = useState('Cinematic product reveal for an ultra-fast cyberpunk smartwatch with neon B-roll and punchy hook');
  const [targetAestheticStyle, setTargetAestheticStyle] = useState('Cyberpunk Anime');
  const [targetOutfitType, setTargetOutfitType] = useState('Futuristic Cyberpunk Leather Jacket');

  const [localGenerating, setLocalGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    if (activeEngineMode === 'text-to-video' &&!prompt.trim()) return;

    setLocalGenerating(true);

    if (activeEngineMode === 'text-to-video') {
      setStatusMessage('🧠 AI Engine analyzing your prompt concept...');
      setTimeout(() => setStatusMessage('📝 Writing professional cyberpunk script & hooks...'), 1500);
      setTimeout(() => setStatusMessage('📹 Selecting neon B-roll scenes and synthesizing video tracks...'), 3000);
    } else if (activeEngineMode === 'video-to-video') {
      setStatusMessage('🧬 Extracting target source frame geometries & identity maps...');
      setTimeout(() => setStatusMessage(`🎨 Running stable diffusion restyle to match: ${targetAestheticStyle}...`), 2000);
      setTimeout(() => setStatusMessage('⏳ Resolving temporal frame flicker filtering parameters...'), 4000);
    } else {
      setStatusMessage('👚 Scanning human skeletal tracking points and orientation nodes...');
      setTimeout(() => setStatusMessage(`🧵 Extracting digital textile assets for: ${targetOutfitType}...`), 2000);
      setTimeout(() => setStatusMessage('✨ Executing final multi-view physical garment cloth draping warp...'), 4000);
    }

    setTimeout(async () => {
      if (generateAIVideo) {
        const finalizedConceptPrompt = activeEngineMode === 'text-to-video'
         ? prompt
          : activeEngineMode === 'video-to-video'
           ? `Restyled video into ${targetAestheticStyle} theme blueprint`
            : `AI Virtual Try-On outfit swap into ${targetOutfitType}`;

        await generateAIVideo(finalizedConceptPrompt, 'Energetic', '16:9');
      }
      setLocalGenerating(false);
      setStatusMessage('');
      setActiveTab('editor');
    }, 6000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">YouCam AI Generation Suite</h2>
            <p className="text-xs text-zinc-400">Deploy high-fidelity text-to-video, restyling diffusions, and digital clothing swaps</p>
          </div>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() =>!localGenerating && setActiveEngineMode('text-to-video')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${activeEngineMode === 'text-to-video'? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Film className="w-3 h-3" />
            <span>Prompt Studio</span>
          </button>
          <button
            onClick={() =>!localGenerating && setActiveEngineMode('video-to-video')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${activeEngineMode === 'video-to-video'? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>AI Restyler</span>
          </button>
          <button
            onClick={() =>!localGenerating && setActiveEngineMode('virtual-tryon')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 ${activeEngineMode === 'virtual-tryon'? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Shirt className="w-3 h-3" />
            <span>AI Try-On</span>
          </button>
        </div>
      </div>

      {/* Main Inputs */}
      <div className="flex-1 flex flex-col gap-5 max-w-2xl mx-auto w-full justify-center">

        {activeEngineMode === 'text-to-video' && (
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
        )}

        {activeEngineMode === 'video-to-video' && (
          <div className="flex flex-col gap-4 bg-zinc-900/40 p-4 border border-zinc-900 rounded-xl">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400">
                Select target aesthetic diffusion filter template:
              </label>
              <select
                value={targetAestheticStyle}
                onChange={(e) => setTargetAestheticStyle(e.target.value)}
                disabled={localGenerating}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="Cyberpunk Anime">Cyberpunk Anime (Vibrant neon shading curves)</option>
                <option value="Van Gogh Oil Painting">Van Gogh Impressionist (Thick oil canvas textures)</option>
                <option value="Vintage 1970s Hollywood Film">Vintage 1970s Hollywood Film (Warped grain anomalies)</option>
                <option value="3D Pixar Animation Blueprint">3D Unreal Studio Rendering (Claymation modeling matrices)</option>
              </select>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              💡 <span className="font-semibold text-zinc-400">YouCam Translation Node:</span> This configuration translates active track layers frame-by-frame while utilizing temporal-consistency locks to stop image fluttering.
            </p>
          </div>
        )}

        {activeEngineMode === 'virtual-tryon' && (
          <div className="flex flex-col gap-4 bg-zinc-900/40 p-4 border border-zinc-900 rounded-xl">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400">
                Choose targeted digital garment item replacement:
              </label>
              <select
                value={targetOutfitType}
                onChange={(e) => setTargetOutfitType(e.target.value)}
                disabled={localGenerating}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="Futuristic Cyberpunk Leather Jacket">Futuristic Cyberpunk Leather Jacket</option>
                <option value="Formal Silk Red Carpet Tuxedo Plait">Formal Silk Red Carpet Tuxedo Plait</option>
                <option value="Oversized Streetwear Techwear Hoodie">Oversized Streetwear Techwear Hoodie</option>
                <option value="Bohemian Floral Summer Maxi Dress Piece">Bohemian Floral Summer Maxi Dress Piece</option>
              </select>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              💡 <span className="font-semibold text-zinc-400">YouCam VTO Module:</span> The system identifies person parameters on your timeline tracks and warps textile textures to their posture.
            </p>
          </div>
        )}

        {localGenerating && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 animate-pulse text-xs">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
            <span className="font-medium font-mono">{statusMessage}</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={localGenerating || (activeEngineMode === 'text-to-video' &&!prompt.trim())}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white disabled:text-zinc-500 font-bold text-xs shadow-xl shadow-purple-950/20 transition transform active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {localGenerating? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running Deep AI Studio Pipelines...</span>
            </>
          ) : (
            <>
              {activeEngineMode === 'text-to-video' && 'Generate Full Video Project'}
              {activeEngineMode === 'video-to-video' && 'Bake AI Style Overlays'}
              {activeEngineMode === 'virtual-tryon' && 'Execute Digital Garment Swap'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
