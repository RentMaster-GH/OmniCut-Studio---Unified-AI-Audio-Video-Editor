import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { X, Keyboard, Sparkles, Command, HelpCircle } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setShowShortcutsModal } = useProject();

  if (!showShortcutsModal) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Timeline Playback' },
    { key: 'J / L', desc: 'Step Back 1 Frame / Step Forward 1 Frame' },
    { key: 'V', desc: 'Select Tool (Move & Arrange Clips)' },
    { key: 'C', desc: 'Razor Tool (Split Clips at Cursor)' },
    { key: 'Ctrl + K / Cmd + K', desc: 'Split Selected Clip at Playhead' },
    { key: 'Delete / Backspace', desc: 'Delete Selected Clip' },
    { key: 'S', desc: 'Toggle Magnetic Timeline Snapping' },
    { key: 'M', desc: 'Toggle Mute / Unmute Video & Master Audio' },
    { key: 'Ctrl + E / Cmd + E', desc: 'Open Export 4K & Download Modal' },
    { key: 'Ctrl + U / Cmd + U', desc: 'Open Import Media & Documents Modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Keyboard className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Keyboard Shortcuts & Navigation Guide
              </h2>
              <p className="text-xs text-zinc-400">
                Pro editing shortcuts inspired by Premiere Pro & Descript
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowShortcutsModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs"
            >
              <span className="text-zinc-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 font-mono text-[11px] font-semibold shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-end">
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
