import React, { useState } from 'react';
import { useProject } from '@/ProjectContext';
import { Wand2, Type, Trash2, Sparkles, Check } from 'lucide-react';

export const TranscriptEditor: React.FC = () => {
  const { transcript, removeFillerWords, deleteTranscriptWord, overdubTranscriptWord } = useProject();
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [overdubText, setOverdubText] = useState<string>('');

  const handleStartEditing = (id: string, currentWord: string) => {
    setEditingWordId(id);
    setOverdubText(currentWord);
  };

  const handleSaveOverdub = async (id: string) => {
    if (!overdubText.trim()) return;
    if (overdubTranscriptWord) {
      await overdubTranscriptWord(id, overdubText.trim());
    }
    setEditingWordId(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-purple-500/20 text-purple-400">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">AI Text to Video Transcript Editor</h2>
            <p className="text-xs text-zinc-400">Modify narrative timeline contents, remove filler sounds, and patch voice track overdub sequences</p>
          </div>
        </div>

        <button
          type="button"
          onClick={removeFillerWords}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium transition shadow-lg shadow-purple-950/20 self-start sm:self-auto"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Strip Filler Sounds</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-900/30 rounded-xl border border-zinc-900 p-4 min-h-[200px]">
        {transcript && transcript.length > 0 ? (
          <div className="flex flex-wrap gap-x-2 gap-y-3 items-center">
            {transcript.map((item) => (
              <div
                key={item.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition relative group ${
                  item.isFiller
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-medium'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                }`}
              >
                {editingWordId === item.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={overdubText}
                      onChange={(e) => setOverdubText(e.target.value)}
                      className="bg-zinc-800 border border-purple-500 text-white px-1.5 py-0.5 rounded text-[11px] focus:outline-none w-20"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveOverdub(item.id)}
                      className="p-0.5 bg-purple-600 rounded text-white hover:bg-purple-500"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={() => handleStartEditing(item.id, item.word)}
                    className="cursor-pointer hover:text-purple-400 border-b border-dashed border-transparent hover:border-purple-400"
                  >
                    {item.word}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => deleteTranscriptWord && deleteTranscriptWord(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Sparkles className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-xs font-medium">No Voice Transcript Elements Found</p>
            <p className="text-[10px] text-zinc-600">Generate studio timeline arrays to run script index models</p>
          </div>
        )}
      </div>
    </div>
  );
};
