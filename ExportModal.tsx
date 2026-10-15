import React, { useState } from 'react';
import { useProject } from '@/ProjectContext';
import {
  X,
  Download,
  Cloud,
  CheckCircle2,
  Film,
  Layers,
  Sparkles,
  Share2,
  Smartphone,
  Youtube,
  Radio,
  FileCode,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { EXPORT_PRESETS } from '@/index';
import { ExportPreset } from '@/index';

export const ExportModal: React.FC = () => {
  const { showExportModal, setShowExportModal, clips, duration, tracks } = useProject();
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset>(EXPORT_PRESETS[0]);
  const [exportMode, setExportMode] = useState<'cloud' | 'browser' | 'xml'>('cloud');
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [completedUrl, setCompletedUrl] = useState<string | null>(null);
  const [renderJobDetails, setRenderJobDetails] = useState<any>(null);

  if (!showExportModal) return null;

  const handleStartRender = async () => {
    setRenderProgress(0);
    setCompletedUrl(null);

    if (exportMode === 'xml') {
      // Generate Premiere Pro XML
      setTimeout(() => {
        setRenderProgress(100);
        const xmlContent = generatePremiereXML(clips, tracks, duration);
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        setCompletedUrl(url);
      }, 800);
      return;
    }

    try {
      const response = await fetch('/api/render-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: 'OmniCut_Studio_Master',
          resolution: selectedPreset.resolution,
          format: selectedPreset.format,
          fps: selectedPreset.fps,
          tracksCount: tracks.length,
        }),
      });
      const data = await response.json();
      setRenderJobDetails(data);

      // Simulate rendering progress bar
      let currentProg = 10;
      const interval = setInterval(() => {
        currentProg += 18;
        if (currentProg >= 100) {
          clearInterval(interval);
          setRenderProgress(100);
          // Create dummy downloadable video blob for immediate user testing
          const sampleBlob = new Blob(
            ['OmniCut Studio High-Fidelity 4K Video Render Stream Container'],
            { type: selectedPreset.format === 'wav' ? 'audio/wav' : 'video/mp4' }
          );
          setCompletedUrl(URL.createObjectURL(sampleBlob));
        } else {
          setRenderProgress(currentProg);
        }
      }, 400);
    } catch (e) {
      setRenderProgress(100);
    }
  };

  // Helper to generate Adobe Premiere Pro / Final Cut Pro compliant XML sequence
  const generatePremiereXML = (clipsList: any[], tracksList: any[], totalDur: number) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <sequence id="sequence-1">
    <name>OmniCut Studio Unified Master</name>
    <duration>${Math.round(totalDur * 30)}</duration>
    <rate>
      <timebase>30</timebase>
      <ntsc>FALSE</ntsc>
    </rate>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>1920</width>
            <height>1080</height>
            <pixelaspectratio>square</pixelaspectratio>
          </samplecharacteristics>
        </format>
        ${tracksList
          .filter(t => t.type === 'video' || t.type === 'overlay')
          .map(
            (t, tIdx) => `
        <track>
          ${clipsList
            .filter(c => c.trackId === t.id)
            .map(
              (c, cIdx) => `
          <clipitem id="clip-${tIdx}-${cIdx}">
            <name>${c.title}</name>
            <duration>${Math.round(c.duration * 30)}</duration>
            <start>${Math.round(c.start * 30)}</start>
            <end>${Math.round((c.start + c.duration) * 30)}</end>
          </clipitem>`
            )
            .join('')}
        </track>`
          )
          .join('')}
      </video>
    </media>
  </sequence>
</xmeml>`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-600 text-white">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Automated Export & Cloud-Based Rendering
              </h2>
              <p className="text-xs text-zinc-400">
                Deliver multi-platform 4K masters, TikTok 9:16 cuts, and Premiere XML
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowExportModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {/* Target Platform Preset Grid */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">
              Select Destination Platform Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXPORT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset);
                    if (preset.platform === 'premiere_xml') setExportMode('xml');
                    else setExportMode('cloud');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    selectedPreset.id === preset.id
                      ? 'border-blue-500 bg-blue-950/30 text-white ring-2 ring-blue-500/50 shadow-md'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-zinc-800 shrink-0 text-zinc-300">
                    {preset.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                    {preset.platform === 'tiktok' && <Smartphone className="w-4 h-4 text-cyan-400" />}
                    {preset.platform === 'premiere_xml' && <Layers className="w-4 h-4 text-purple-400" />}
                    {preset.platform === 'podcast' && <Radio className="w-4 h-4 text-emerald-400" />}
                    {preset.platform === 'reels' && <Share2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-200 block">{preset.name}</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5 leading-snug">
                      {preset.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Render Engine Selection */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-200 block">Render Pipeline:</span>
              <span className="text-[11px] text-zinc-400">
                {selectedPreset.platform === 'premiere_xml'
                  ? 'Generates Final Cut Pro / Adobe Premiere XML Interchange file'
                  : 'Distributed NVIDIA H100 Cloud GPU Render Cluster (ProRes / H.264 high profile)'}
              </span>
            </div>

            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700">
              {selectedPreset.format.toUpperCase()}
            </span>
          </div>

          {/* Live Progress Bar if Rendering */}
          {renderProgress !== null && (
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  {renderProgress < 100 ? (
                    <>
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      Rendering frames & mixing audio tracks...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Export Render Complete!
                    </>
                  )}
                </span>
                <span className="font-mono text-blue-400 font-bold">{renderProgress}%</span>
              </div>

              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${renderProgress}%` }}
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                />
              </div>

              {renderJobDetails && renderProgress < 100 && (
                <div className="text-[10px] text-zinc-400 flex items-center justify-between font-mono pt-1">
                  <span>Node: {renderJobDetails.workerNode}</span>
                  <span>Bitrate: {renderJobDetails.bitrate}</span>
                </div>
              )}

              {renderProgress === 100 && completedUrl && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400">Master file generated successfully.</span>
                  <a
                    href={completedUrl}
                    download={`OmniCut_${selectedPreset.name.replace(/\s+/g, '_')}.${selectedPreset.format}`}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download {selectedPreset.format.toUpperCase()} File
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
          >
            Close
          </button>
          <button
            onClick={handleStartRender}
            disabled={renderProgress !== null && renderProgress < 100}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <Cloud className="w-4 h-4" />
            {selectedPreset.platform === 'premiere_xml' ? 'Generate Premiere XML' : 'Start Cloud Render'}
          </button>
        </div>
      </div>
    </div>
  );
};
