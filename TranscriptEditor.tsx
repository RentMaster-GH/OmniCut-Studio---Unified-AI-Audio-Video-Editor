import React, { useState } from 'react';
import { useProject } from '../../../context/ProjectContext';
import {
  Sparkles,
  Scissors,
  Volume2,
  Trash2,
  CheckCircle2,
  Search,
  Wand2,
  Mic,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { TranscriptWord } from '../../types';

export const TranscriptEditor: React.FC = () => {
  const {
    transcript,
    currentTime,
    seek,
    removeFillerWords,
    deleteTranscriptWord,
    overdubTranscriptWord,
    generateTranscriptFromClips,
    isStudioSoundActive,
    toggleStudioSound,
  } = useProject();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  // Count filler words
  const fillerWords = transcript.filter(w => w.isFiller);
  const totalSavedEstimate = (fillerWords.length * 0.45).toFixed(1);

  // Filter words by search
  const filteredWords = transcript.filter(w =>
    w.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWordClick = (word: TranscriptWord) => {
    seek(word.start);
  };

  const startOverdub = (word: TranscriptWord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWordId(word.id);
    setEditingValue(word.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''));
  };

  const handleOverdubSave = async (wordId: string) => {
    if (editingValue.trim()) {
      await overdubTranscriptWord(wordId, editingValue.trim());
    }
    setEditingWordId(null);
  };

  const handleReTranscribe = async () => {
    setIsTranscribing(true);
    await generateTranscriptFromClips();
    setIsTranscribing(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Transcript Header with Descript Superpowers */}
      <div className="flex flex-col gap-2 p-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20 text-blue-400">
              <Wand2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-wide">
                Descript Text-Based Editor
              </h3>
              <p className="text-[10px] text-zinc-400">
                Edit video & audio directly by deleting or changing words
              </p>
            </div>
          </div>

          {/* AI Re-transcribe */}
          <button
            onClick={handleReTranscribe}
            disabled={isTranscribing}
            title="Re-analyze audio with Gemini AI"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTranscribing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">AI Sync</span>
          </button>
        </div>

        {/* 1-Click Filler Words Removal Banner */}
        {fillerWords.length > 0 ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px]">
                <span className="font-semibold text-white">{fillerWords.length} filler words</span> detected (um, uh, you know).
                <span className="hidden sm:inline text-amber-400/80 ml-1">Saves ~{totalSavedEstimate}s of dead air.</span>
              </div>
            </div>

            <button
              onClick={removeFillerWords}
              className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Scissors className="w-3.5 h-3.5" />
              Purge All Fillers
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Pristine script: All verbal filler words removed. Pacing optimized!</span>
          </div>
        )}

        {/* Search filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search dialogue words..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Transcript Text Flow Display */}
      <div className="flex-1 p-4 overflow-y-auto bg-zinc-950/80 leading-relaxed font-sans text-sm">
        <div className="flex flex-wrap gap-1.5 items-center">
          {filteredWords.map(w => {
            const isCurrentlyPlaying = currentTime >= w.start && currentTime <= w.end;
            const isEditing = editingWordId === w.id;

            if (isEditing) {
              return (
                <div key={w.id} className="inline-flex items-center gap-1 bg-zinc-800 p-1 rounded border border-blue-500 shadow-md">
                  <input
                    type="text"
                    value={editingValue}
                    autoFocus
                    onChange={e => setEditingValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleOverdubSave(w.id);
                      if (e.key === 'Escape') setEditingWordId(null);
                    }}
                    className="w-24 bg-zinc-950 text-white text-xs px-2 py-0.5 rounded border border-zinc-700 outline-none"
                  />
                  <button
                    onClick={() => handleOverdubSave(w.id)}
                    className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-500"
                  >
                    Dub
                  </button>
                </div>
              );
            }

            return (
              <span
                key={w.id}
                onClick={() => handleWordClick(w)}
                className={`group relative inline-flex items-center px-1.5 py-0.5 rounded cursor-pointer transition select-none ${
                  isCurrentlyPlaying
                    ? 'bg-blue-600 text-white font-bold shadow-lg scale-105 ring-2 ring-blue-400'
                    : w.isFiller
                    ? 'bg-amber-500/20 text-amber-300 line-through decoration-amber-500/80 hover:bg-amber-500/30'
                    : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                <span>{w.word}</span>

                {/* Hover actions: Delete word or Overdub */}
                <span className="hidden group-hover:inline-flex items-center gap-0.5 ml-1 pl-1 border-l border-zinc-700">
                  <button
                    onClick={e => startOverdub(w, e)}
                    title="Overdub with AI Voice"
                    className="p-0.5 hover:text-blue-400 text-zinc-400"
                  >
                    <Mic className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteTranscriptWord(w.id);
                    }}
                    title="Cut from timeline"
                    className="p-0.5 hover:text-red-400 text-zinc-400"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer controls: Studio Sound AI Quick Toggle */}
      <div className="p-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Active playhead: <strong className="text-zinc-200 font-mono">{currentTime.toFixed(2)}s</strong></span>
        </div>

        <button
          onClick={toggleStudioSound}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition ${
            isStudioSoundActive
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Studio Sound AI: {isStudioSoundActive ? 'Active' : 'Off'}
        </button>
      </div>
    </div>
  );
};
