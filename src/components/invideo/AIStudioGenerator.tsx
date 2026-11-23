import React, { useState } from 'react';
import { Sparkles, Film, Wand2, Download } from 'lucide-react';

const CREATOR_PRESETS = [
  {
    label: '🌆 Accra Skyline Sunset',
    prompt: 'Golden hour aerial drone shot flying over Accra Independence Square and modern skyline, warm cinematic lighting, 4K'
  },
  {
    label: '🍲 Ghanaian Jollof Kitchen',
    prompt: 'Cinematic close-up of authentic Ghanaian party jollof rice steaming in a traditional pot with vibrant tomato stew, warm kitchen lighting, 4K'
  },
  {
    label: '💳 Fintech & Mobile Money Ad',
    prompt: 'Sleek modern smartphone contactless payment in a vibrant Accra cafe, shallow depth of field, crisp studio lighting, 4K'
  },
  {
    label: '🎧 Afrobeats Studio Session',
    prompt: 'Music producer mixing an Afrobeats track in a neon-lit recording studio with analog consoles and warm rim light, 4K'
  }
];

export function AIStudioGenerator() {
  const [prompt, setPrompt] = useState(CREATOR_PRESETS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const enhancePrompt = () => {
    const clean = prompt.trim();
    if (!clean) return;
    if (clean.toLowerCase().includes('4k') && clean.toLowerCase().includes('cinematic')) {
      setStatus('Prompt already optimized for cinematic 4K generation.');
      return;
    }
    setPrompt(
      `${clean}, smooth cinematic camera movement, natural volumetric lighting, rich color grading, ultra-detailed, 4K (${aspectRatio})`
    );
    setStatus('✨ Enhanced prompt with camera motion, lighting & 4K color grading.');
  };

  const generateTrueVideo = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setStatus('Please enter a scene description first.');
      return;
    }
    setLoading(true);
    setStatus(`Generating ${aspectRatio} video via Accra.ai (Veo 3.1)...`);
    try {
      const REAL_GATEWAY =
        'https://' + 'pollination-ai-decentralized-inference-gateway' + '.vercel.app/api/video/generate';
      const res = await fetch(REAL_GATEWAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${cleanPrompt} [Aspect Ratio: ${aspectRatio}]`,
          aspectRatio
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video generation failed');
      setVideoUrl(data.videoUrl);
      setStatus('Video ready! (Accra.ai - Veo 3.1)');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5" /> Accra.ai Cinematic Video Studio
        </span>
        <div className="flex items-center gap-1">
          {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => setAspectRatio(ratio)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                aspectRatio === ratio
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-black/40 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CREATOR_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setPrompt(preset.prompt);
              setStatus('');
            }}
            className="px-2.5 py-1 rounded-full text-[11px] bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your scene, camera movement, and lighting..."
        className="w-full p-3 rounded-xl bg-black/50 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={enhancePrompt}
          disabled={loading}
          className="px-3.5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-500/40 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Wand2 className="w-3.5 h-3.5" /> AI Enhance
        </button>
        <button
          type="button"
          onClick={generateTrueVideo}
          disabled={loading}
          className="flex-1 bg-white hover:bg-slate-100 text-black rounded-full py-3 font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Generating...' : 'Generate TRUE Video'}
        </button>
      </div>

      {status && <p className="text-xs text-emerald-300/90">{status}</p>}

      {videoUrl && (
        <div className="space-y-2 pt-1">
          <video src={videoUrl} controls className="w-full rounded-xl border border-slate-700" />
          <a
            href={videoUrl}
            download={`omnicut-${Date.now()}.mp4`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Download Rendered Clip
          </a>
        </div>
      )}
    </div>
  );
}

export default AIStudioGenerator;
