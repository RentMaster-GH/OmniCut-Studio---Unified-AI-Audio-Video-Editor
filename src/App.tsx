/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FreeProxyBadge } from './components/FreeProxyBadge';
import { ProjectProvider, useProject } from "./context/ProjectContext";
import { HeaderNavBar } from "./components/common/HeaderNavBar";
import { VideoPlayerCanvas } from "./components/player/VideoPlayerCanvas";
import { MultitrackTimeline } from "./components/timeline/MultitrackTimeline";
import { TranscriptEditor } from "./components/transcript/TranscriptEditor";
import { CaptionsStudio } from "./components/captions/CaptionsStudio";
import { AIStudioGenerator } from "./components/invideo/AIStudioGenerator";
import { AudioMixerSuite } from "./components/audio/AudioMixerSuite";
import { AnalyticsDashboard } from "./components/analytics/AnalyticsDashboard";
import { CollaborativeWorkspace } from "./components/collab/CollaborativeWorkspace";
import { AvatarsStudio } from "./components/avatars/AvatarsStudio";
import { SyntheticMediaStudio } from "./components/synthetic/SyntheticMediaStudio";
import { ExportModal } from "./components/export/ExportModal";
import { SecurityModal } from "./components/security/SecurityModal";
import { MediaUploadModal } from "./components/upload/MediaUploadModal";
import { ShortcutsModal } from "./components/common/ShortcutsModal";
import {
  FileText,
  Type,
  Film,
  Sparkles,
  Sliders,
  BarChart3,
  Users,
  Fingerprint,
} from 'lucide-react';

function StudioContent() {
  const { activeTab, isBiometricLocked, verifyBiometric } = useProject();
  const [editorSidebarTab, setEditorSidebarTab] = useState<'transcript' | 'captions'>('transcript');

  // If biometric locked, display security vault screen
  if (isBiometricLocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-center">
        <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-4 animate-pulse">
          <Fingerprint className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">OmniCut Studio Locked</h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          Biometric hardware authentication required to resume editing sensitive project assets.
        </p>
        <button
          onClick={verifyBiometric}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl transition transform active:scale-95 flex items-center gap-2"
        >
          <Fingerprint className="w-4 h-4" />
          Authenticate with TouchID / FaceID
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-2.5 sm:p-3 overflow-hidden gap-2.5 bg-zinc-950">
      {/* 1. Main Unified Editor Mode */}
      {activeTab === 'editor' && (
        <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
          {/* Top Half: Sidebar Tools + Composite Video Player */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-[360px] overflow-hidden">
            {/* Left Sidebar (Descript Transcript vs VEED Subtitles) */}
            <div className="lg:col-span-5 flex flex-col bg-zinc-950 rounded-xl overflow-hidden">
              {/* Sidebar Mode Pill Header */}
              <div className="flex items-center bg-zinc-900 border-b border-zinc-800 p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => setEditorSidebarTab('transcript')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    editorSidebarTab === 'transcript'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Descript Transcript</span>
                </button>

                <button
                  onClick={() => setEditorSidebarTab('captions')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    editorSidebarTab === 'captions'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>VEED Subtitles</span>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden">
                {editorSidebarTab === 'transcript' ? <TranscriptEditor /> : <CaptionsStudio />}
              </div>
            </div>

            {/* Right: Interactive Canvas Video Player & Stage */}
            <div className="lg:col-span-7 flex flex-col overflow-hidden">
              <VideoPlayerCanvas />
            </div>
          </div>

          {/* Bottom Half: Adobe Premiere Pro Multitrack Timeline */}
          <div className="h-[280px] sm:h-[300px] shrink-0">
            <MultitrackTimeline />
          </div>
        </div>
      )}

      {/* 2. Invideo AI Prompt-to-Video Studio Mode */}
      {activeTab === 'invideo_ai' && (
        <div className="flex-1 overflow-hidden">
          <AIStudioGenerator />
        </div>
      )}

      {/* 3. AI Avatars & Digital Twins Studio Mode */}
      {activeTab === 'avatars' && (
        <div className="flex-1 overflow-hidden">
          <AvatarsStudio />
        </div>
      )}

      {/* 4. Synthetic Media Studio Mode */}
      {activeTab === 'synthetic_media' && (
        <div className="flex-1 overflow-hidden">
          <SyntheticMediaStudio />
        </div>
      )}

      {/* 5. Audio Mixing & EQ Suite Mode */}
      {activeTab === 'audio_mixer' && (
        <div className="flex-1 overflow-hidden">
          <AudioMixerSuite />
        </div>
      )}

      {/* 4. Analytics & Retention Metrics Mode */}
      {activeTab === 'analytics' && (
        <div className="flex-1 overflow-hidden">
          <AnalyticsDashboard />
        </div>
      )}

      {/* 5. Team Collaboration & Version Control Mode */}
      {activeTab === 'collab' && (
        <div className="flex-1 overflow-hidden">
          <CollaborativeWorkspace />
        </div>
      )}
    </main>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-blue-600 selection:text-white">
        <HeaderNavBar />
        <StudioContent />
        <ExportModal />
        <MediaUploadModal />
        <ShortcutsModal />
        <SecurityModal />
        <FreeProxyBadge />
      </div>
    </ProjectProvider>
  );
}
