import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  X,
  Upload,
  FileVideo,
  FileAudio,
  FileText,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Plus,
  Layers,
  ArrowRight,
  Music,
  FolderOpen,
} from 'lucide-react';
import { VERIFIED_STOCK_VIDEOS } from '../../utils/videoLibrary';

export const MediaUploadModal: React.FC = () => {
  const {
    showUploadModal,
    setShowUploadModal,
    addClip,
    clips,
    duration,
    transcript,
    setTranscript,
    setActiveTab,
    seek,
  } = useProject();

  const [activeTab, setActiveLocalTab] = useState<'upload' | 'samples' | 'script'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      name: string;
      size: string;
      type: 'video' | 'audio' | 'document' | 'image';
      url?: string;
      duration?: number;
      textPreview?: string;
      status: 'ready' | 'processing';
    }[]
  >([]);
  const [scriptText, setScriptText] = useState('');
  const [scriptTitle, setScriptTitle] = useState('My Uploaded Script');
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!showUploadModal) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const processFile = async (file: File) => {
    const fileName = file.name;
    const fileType = file.type;
    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // 1. Video files
    if (fileType.startsWith('video/') || /\.(mp4|webm|mov|mkv|m4v)$/i.test(fileName)) {
      const blobUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = blobUrl;

      tempVideo.onloadedmetadata = () => {
        const vidDuration = tempVideo.duration || 8;
        const newEntry = {
          name: fileName,
          size: fileSizeStr,
          type: 'video' as const,
          url: blobUrl,
          duration: vidDuration,
          status: 'ready' as const,
        };
        setUploadedFiles(prev => [newEntry, ...prev]);

        // Automatically add clip to track-v1 at the end of current clips
        const maxStart = clips.reduce((acc, c) => Math.max(acc, c.start + c.duration), 0);
        addClip({
          id: `clip-upload-v1-${Date.now()}`,
          trackId: 'track-v1',
          title: fileName.replace(/\.[^/.]+$/, ''),
          type: 'video',
          start: maxStart,
          duration: Math.round(vidDuration * 10) / 10,
          volume: 1,
          speed: 1,
          muted: false,
          color: '#2563EB',
          src: blobUrl,
          text: `⚡ ${fileName.replace(/\.[^/.]+$/, '').toUpperCase()}`,
        } as any);

        showToast(`Video "${fileName}" added to Timeline Track V1 with audible audio!`);
      };
      return;
    }

    // 2. Audio files
    if (fileType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName)) {
      const blobUrl = URL.createObjectURL(file);
      const tempAudio = document.createElement('audio');
      tempAudio.preload = 'metadata';
      tempAudio.src = blobUrl;

      tempAudio.onloadedmetadata = () => {
        const audioDuration = tempAudio.duration || 10;
        const newEntry = {
          name: fileName,
          size: fileSizeStr,
          type: 'audio' as const,
          url: blobUrl,
          duration: audioDuration,
          status: 'ready' as const,
        };
        setUploadedFiles(prev => [newEntry, ...prev]);

        // Add to audio track track-a1
        const maxStart = clips.filter(c => c.trackId === 'track-a1').reduce((acc, c) => Math.max(acc, c.start + c.duration), 0);
        addClip({
          id: `clip-upload-a1-${Date.now()}`,
          trackId: 'track-a1',
          title: `Audio: ${fileName.replace(/\.[^/.]+$/, '')}`,
          type: 'audio',
          start: maxStart,
          duration: Math.round(audioDuration * 10) / 10,
          volume: 1,
          speed: 1,
          muted: false,
          color: '#10B981',
          src: blobUrl,
        } as any);

        showToast(`Audio "${fileName}" added to Timeline Track A1!`);
      };
      return;
    }

    // 3. Document / Subtitles files (.txt, .srt, .vtt, .md, .json)
    if (/\.(txt|srt|vtt|md|json|doc|docx|pdf)$/i.test(fileName) || fileType.includes('text')) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = (e.target?.result as string) || '';

        // If SRT or VTT format
        if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
          parseSubtitlesAndImport(content, fileName);
          return;
        }

        // Standard text document / script
        const words = content.split(/\s+/).filter(Boolean);
        const newTranscriptWords = words.map((w, idx) => ({
          id: `w-doc-${Date.now()}-${idx}`,
          word: w,
          start: parseFloat((idx * 0.4).toFixed(2)),
          end: parseFloat((idx * 0.4 + 0.35).toFixed(2)),
          isFiller: ['um', 'uh', 'like', 'basically', 'you know'].includes(w.toLowerCase().replace(/[^a-z]/g, '')),
          confidence: 0.99,
        }));

        setTranscript(newTranscriptWords);

        // Also add a caption clip spanning the script
        const totalDur = Math.max(5, words.length * 0.4);
        addClip({
          id: `clip-doc-cap-${Date.now()}`,
          trackId: 'track-captions',
          title: `Script: ${fileName.replace(/\.[^/.]+$/, '')}`,
          type: 'caption',
          start: 0,
          duration: totalDur,
          volume: 1,
          speed: 1,
          muted: false,
          color: '#F59E0B',
          text: words.slice(0, 8).join(' '),
        } as any);

        setUploadedFiles(prev => [
          {
            name: fileName,
            size: fileSizeStr,
            type: 'document' as const,
            textPreview: content.slice(0, 180),
            status: 'ready' as const,
          },
          ...prev,
        ]);

        showToast(`Script "${fileName}" imported: ${words.length} words synced into Descript Editor!`);
      };
      reader.readAsText(file);
      return;
    }

    // 4. Image / Photo files
    if (fileType.startsWith('image/')) {
      const blobUrl = URL.createObjectURL(file);
      const newEntry = {
        name: fileName,
        size: fileSizeStr,
        type: 'image' as const,
        url: blobUrl,
        duration: 5,
        status: 'ready' as const,
      };
      setUploadedFiles(prev => [newEntry, ...prev]);

      addClip({
        id: `clip-upload-v2-${Date.now()}`,
        trackId: 'track-v2',
        title: `Overlay: ${fileName.replace(/\.[^/.]+$/, '')}`,
        type: 'overlay',
        start: 0,
        duration: 6,
        volume: 1,
        speed: 1,
        muted: false,
        color: '#EC4899',
        src: blobUrl,
      } as any);

      showToast(`Image "${fileName}" added as Overlay badge on Track V2!`);
    }
  };

  const parseSubtitlesAndImport = (content: string, fileName: string) => {
    // Basic SRT parser
    const blocks = content.split(/\n\s*\n/);
    const newTranscriptWords: any[] = [];
    let wordCounter = 1;

    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length >= 2) {
        const timeLine = lines.find(l => l.includes('-->'));
        if (timeLine) {
          const [startStr] = timeLine.split('-->');
          const [h, m, sMs] = startStr.trim().split(':');
          const startSeconds =
            parseInt(h || '0', 10) * 3600 +
            parseInt(m || '0', 10) * 60 +
            parseFloat((sMs || '0').replace(',', '.'));

          const textLines = lines.filter(l => !l.includes('-->') && !/^\d+$/.test(l.trim())).join(' ');
          const words = textLines.split(/\s+/).filter(Boolean);
          const wordDur = Math.max(0.3, 2.5 / Math.max(1, words.length));

          words.forEach((w, wIdx) => {
            const wStart = startSeconds + wIdx * wordDur;
            newTranscriptWords.push({
              id: `w-srt-${wordCounter++}`,
              word: w,
              start: parseFloat(wStart.toFixed(2)),
              end: parseFloat((wStart + wordDur * 0.9).toFixed(2)),
              isFiller: false,
              confidence: 1.0,
            });
          });
        }
      }
    });

    if (newTranscriptWords.length > 0) {
      setTranscript(newTranscriptWords);
      showToast(`SRT Subtitles parsed: ${newTranscriptWords.length} words added!`);
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => processFile(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(f => processFile(f));
    }
  };

  const handleAddSample = (video: (typeof VERIFIED_STOCK_VIDEOS)[0]) => {
    const maxStart = clips.reduce((acc, c) => Math.max(acc, c.start + c.duration), 0);
    addClip({
      id: `clip-sample-v1-${Date.now()}`,
      trackId: 'track-v1',
      title: video.title,
      type: 'video',
      start: maxStart,
      duration: 6.5,
      volume: 1,
      speed: 1,
      muted: false,
      color: video.color,
      visualTag: video.visualTag,
      src: video.src,
      text: `🎬 ${video.title.toUpperCase()}`,
    } as any);

    showToast(`Added "${video.title}" to Timeline Track V1!`);
  };

  const handleImportPastedScript = () => {
    if (!scriptText.trim()) return;
    const words = scriptText.trim().split(/\s+/).filter(Boolean);
    const newTranscriptWords = words.map((w, idx) => ({
      id: `w-pasted-${Date.now()}-${idx}`,
      word: w,
      start: parseFloat((idx * 0.45).toFixed(2)),
      end: parseFloat((idx * 0.45 + 0.4).toFixed(2)),
      isFiller: ['um', 'uh', 'like', 'basically', 'you know'].includes(w.toLowerCase().replace(/[^a-z]/g, '')),
      confidence: 0.98,
    }));

    setTranscript(newTranscriptWords);

    const maxStart = clips.reduce((acc, c) => Math.max(acc, c.start + c.duration), 0);
    addClip({
      id: `clip-script-cc-${Date.now()}`,
      trackId: 'track-captions',
      title: scriptTitle,
      type: 'caption',
      start: maxStart,
      duration: Math.max(6, words.length * 0.45),
      volume: 1,
      speed: 1,
      muted: false,
      color: '#F59E0B',
      text: words.slice(0, 10).join(' '),
    } as any);

    showToast(`Script with ${words.length} words imported into Transcript & Subtitles!`);
    setScriptText('');
    setShowUploadModal(false);
    setActiveTab('editor');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-600 text-white shadow-md">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Import Media & Documents Studio
              </h2>
              <p className="text-xs text-zinc-400">
                Upload video, audio, documents, scripts, and subtitles to edit in real time
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-3 bg-zinc-900/60 border-b border-zinc-800 gap-2">
          <button
            onClick={() => setActiveLocalTab('upload')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-zinc-950 text-blue-400 border-t-2 border-blue-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Upload Files (Video, Audio, Docs)
          </button>

          <button
            onClick={() => setActiveLocalTab('samples')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'samples'
                ? 'bg-zinc-950 text-purple-400 border-t-2 border-purple-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Stock Video & Music Presets
          </button>

          <button
            onClick={() => setActiveLocalTab('script')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'script'
                ? 'bg-zinc-950 text-amber-400 border-t-2 border-amber-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Script / Text Document
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs text-zinc-300">
          {notification && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Drag and drop zone */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  dragOver
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                    : 'border-zinc-700/80 hover:border-blue-500/80 bg-zinc-900/40 hover:bg-zinc-900/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,audio/*,image/*,.txt,.srt,.vtt,.md,.json,.doc,.docx,.pdf"
                  onChange={e => handleFilesSelected(e.target.files)}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  Drag & Drop Files Here or Click to Browse
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mb-3">
                  Supports <strong>MP4, WebM, MOV</strong> (Video), <strong>MP3, WAV, M4A</strong> (Audio),{' '}
                  <strong>SRT, VTT, TXT, MD, PDF</strong> (Scripts & Docs)
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">🎬 Video + Sound</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">🎙️ Audio Waves</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">📝 Descript Text</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">💬 Subtitles</span>
                </div>
              </div>

              {/* Uploaded Files Table */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-zinc-200 block text-xs">
                    Uploaded Workspace Assets ({uploadedFiles.length}):
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {f.type === 'video' && <FileVideo className="w-4 h-4 text-blue-400" />}
                          {f.type === 'audio' && <FileAudio className="w-4 h-4 text-emerald-400" />}
                          {f.type === 'document' && <FileText className="w-4 h-4 text-amber-400" />}
                          {f.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-400" />}

                          <div>
                            <span className="font-medium text-white block text-xs">{f.name}</span>
                            <span className="text-[10px] text-zinc-400">
                              {f.size} {f.duration ? `• ${f.duration.toFixed(1)}s` : ''}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ready on Timeline
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                1-Click add verified high-speed media clips with video and sound to your timeline:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VERIFIED_STOCK_VIDEOS.map(video => (
                  <div
                    key={video.id}
                    className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 hover:border-zinc-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white block text-xs">{video.title}</span>
                      <span className="text-[11px] text-zinc-400 capitalize">
                        Category: {video.category} • HD Video
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddSample(video)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Script Document Title:</label>
                <input
                  type="text"
                  value={scriptTitle}
                  onChange={e => setScriptTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white"
                  placeholder="e.g. YouTube Video Script Master"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Paste Text / Voiceover Script:
                </label>
                <textarea
                  rows={6}
                  value={scriptText}
                  onChange={e => setScriptText(e.target.value)}
                  placeholder="Paste your dialogue, spoken script, or notes here. OmniCut Studio will parse it into timed words and generate subtitles..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImportPastedScript}
                  disabled={!scriptText.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  Import to Descript Editor & Timeline
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Files are processed locally and securely in your browser.
          </span>
          <button
            onClick={() => setShowUploadModal(false)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
          >
            Done / Return to Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
