import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Film,
  Sparkles,
  Sliders,
  BarChart3,
  Users,
  Download,
  ShieldCheck,
  Cloud,
  Fingerprint,
  Lock,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';

export const HeaderNavBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setShowExportModal,
    setShowSecurityModal,
    collaborators,
    cloudSyncStatus,
    isEndToEndEncrypted,
    isBiometricLocked,
    theme,
    setTheme,
  } = useProject();

  return (
    <header className="w-full bg-zinc-950/95 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-300 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Left: Brand & Studio Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5 font-sans">
              OmniCut Studio
              <span className="text-[10px] font-mono font-normal text-blue-400 bg-blue-950/70 border border-blue-800/60 px-1.5 py-0.2 rounded">
                PRO AI
              </span>
            </h1>
          </div>
        </div>

        {/* Central Workspace Modes Switcher */}
        <nav className="hidden md:flex items-center bg-zinc-900/90 rounded-xl p-1 border border-zinc-800 ml-3">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Editor Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('invideo_ai')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              activeTab === 'invideo_ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Invideo AI</span>
          </button>

          <button
            onClick={() => setActiveTab('audio_mixer')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              activeTab === 'audio_mixer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-300" />
            <span>Audio & EQ</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('collab')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium ${
              activeTab === 'collab'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>Team & Versions</span>
          </button>
        </nav>
      </div>

      {/* Right: Security indicators, Team avatars, Export CTA */}
      <div className="flex items-center gap-2.5">
        {/* Security & Cloud status badges */}
        <button
          onClick={() => setShowSecurityModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition"
          title="Security, Biometrics & End-to-End Encryption"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono">E2EE Locked</span>
        </button>

        <button
          onClick={() => setShowSecurityModal(true)}
          className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px]"
          title="Cloud Backup Status"
        >
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span>{cloudSyncStatus === 'synced' ? 'Cloud Synced' : 'Syncing...'}</span>
        </button>

        {/* Live Collaborators Stack */}
        <div
          onClick={() => setActiveTab('collab')}
          className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition pl-1"
          title="Click to view active team collaborators"
        >
          {collaborators.slice(0, 3).map(user => (
            <img
              key={user.id}
              src={user.avatar}
              alt={user.name}
              className="w-6 h-6 rounded-full border border-zinc-950 object-cover"
            />
          ))}
          {collaborators.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[9px] text-zinc-300 font-bold">
              +{collaborators.length - 3}
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 4K</span>
        </button>
      </div>
    </header>
  );
};
