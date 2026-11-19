import React, { useState, useEffect } from 'react';
import { AdminDashboardModal } from '../admin/AdminDashboardModal';
import { useProject } from "../../context/ProjectContext";
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
  Upload,
  Keyboard,
  Volume2,
  VolumeX,
  Dna,
  Cpu,
  FolderOpen,
  Check,
  Plus,
  Trash2,
  Copy,
  LogOut,
  Shield,
} from 'lucide-react';

export const HeaderNavBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setShowExportModal,
    setShowSecurityModal,
    setShowUploadModal,
    setShowShortcutsModal,
    collaborators,
    cloudSyncStatus,
    syncNow,
    projectTitle,
    setProjectTitle,
    savedProjects,
    loadSavedProject,
    createNewProject,
    deleteProject,
    duplicateProject,
    isEndToEndEncrypted,
    isBiometricLocked,
    masterVolume,
    setMasterVolume,
    theme,
    setTheme,
  } = useProject();
  const [showProjectsMenu, setShowProjectsMenu] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('omnicut_jwt');
      if (token) {
        const segments = token.split('.');
        if (segments.length === 3) {
          const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          setIsAdmin(payload?.role === 'admin' || payload?.email === 'papastickle@gmail.com');
        }
      }
    } catch {}
  }, []);

  return (
    <>
      <header className="w-full bg-zinc-950/95 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-300 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Left: Brand & Studio Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
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

        {/* Central Workspace Modes Switcher - accessible on all screens */}
        <nav className="flex items-center bg-zinc-900/90 rounded-xl p-1 border border-zinc-800 ml-1.5 sm:ml-3 overflow-x-auto max-w-[50vw] sm:max-w-none">
          <button
            onClick={() => setActiveTab('editor')}
            title="Editor (Unified Multitrack & Player)"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden sm:inline">Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('invideo_ai')}
            title="Invideo Prompt-to-Video Engine"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'invideo_ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Invideo</span>
          </button>

          <button
            onClick={() => setActiveTab('avatars')}
            title="Avatars & Digital Twins (Human, Animal & Organism Biology)"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'avatars'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden sm:inline">Avatars</span>
          </button>

          <button
            onClick={() => setActiveTab('synthetic_media')}
            title="Synthetic Studio (Neural Video, Diffusion & Audio Alteration)"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'synthetic_media'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Synthetic</span>
          </button>

          <button
            onClick={() => setActiveTab('audio_mixer')}
            title="Audio Suite"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'audio_mixer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Audio</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            title="Analytics & Retention"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('collab')}
            title="Team & Versions"
            className={`px-2.5 sm:px-2 py-1 rounded-lg flex items-center gap-1.5 transition font-medium shrink-0 ${
              activeTab === 'collab'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline">Team</span>
          </button>
        </nav>
      </div>

      {/* Right: Security indicators, Team avatars, Export CTA */}
      <div className="flex items-center gap-1.5">
        {/* Security & Cloud status badges */}
        <button
          onClick={() => setShowSecurityModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition"
          title="Security, Biometrics & End-to-End Encryption"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-mono">E2EE Locked</span>
        </button>

                {/* Live PostgreSQL Sync & Saved Projects */}
        <div className="relative hidden lg:flex items-center gap-1.5">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="w-16 xl:w-24 px-1.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-zinc-200 text-[11px] outline-none"
            title="Click to rename project"
          />
          <button
            onClick={() => syncNow()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-blue-600 text-zinc-300 text-[11px] transition"
            title="Click to save project to HP Laptop PostgreSQL now"
          >
            <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'synced' ? 'text-emerald-400' : cloudSyncStatus === 'syncing' ? 'text-blue-400 animate-pulse' : 'text-red-400'}`} />
            
          </button>
          <button
            onClick={() => setShowProjectsMenu(!showProjectsMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] transition"
            title="Load saved project from PostgreSQL"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Projects</span>
          </button>

          {showProjectsMenu && (
            <div className="absolute right-0 top-9 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-800 mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  PostgreSQL Projects
                </span>
                <button
                  onClick={() => {
                    createNewProject();
                    setShowProjectsMenu(false);
                  }}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> New Project
                </button>
              </div>
              {savedProjects.length === 0 ? (
                <div className="text-xs text-zinc-500 px-2 py-3">No saved projects yet.</div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-zinc-200 flex items-center justify-between gap-1 group"
                    >
                      <button
                        onClick={() => {
                          loadSavedProject(proj);
                          setShowProjectsMenu(false);
                        }}
                        className="flex-1 text-left truncate"
                      >
                        {proj.title}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateProject(proj);
                          }}
                          title="Duplicate Project"
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 transition"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(proj.id);
                          }}
                          title="Delete Project"
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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

        {/* Quick Audio Mute / Unmute Header Toggle */}
        <button
          onClick={() => setMasterVolume(masterVolume === 0 ? 0.85 : 0)}
          className={`p-1.5 rounded-lg border transition ${
            masterVolume > 0
              ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-red-950/50 border-red-800/60 text-red-400 hover:bg-red-900/60'
          }`}
          title={masterVolume === 0 ? 'Unmute Video & Audio' : 'Mute Video & Audio'}
        >
          {masterVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Shortcuts & Guide */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition text-xs"
          title="Keyboard Shortcuts & User Guide"
        >
          <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Shortcuts</span>
        </button>

        {/* Upload / Import Media & Docs CTA */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-white font-semibold text-xs shadow transition flex items-center gap-1.5"
          title="Upload Video, Audio, Documents, Scripts & Subtitles"
        >
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span>Import</span>
        </button>

        {/* Admin Dashboard Button (Admin Role Only) */}
        {isAdmin && (
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 text-[11px] font-semibold transition"
            title="Open HP Laptop Admin Dashboard"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}

        {/* Sign Out / Lock Studio */}
        <button
          onClick={() => {
            localStorage.removeItem('omnicut_jwt');
            window.location.reload();
          }}
          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-700 text-zinc-400 hover:text-red-400 transition"
          title="Lock Studio & Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>

        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
      <AdminDashboardModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </>
  );
};
