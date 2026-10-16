import React from 'react';
import { useProject } from '@/ProjectContext';
import { HeaderNavBar } from '@/HeaderNavBar';
import { TranscriptEditor } from '@/TranscriptEditor';
import { AIStudioGenerator } from '@/AIStudioGenerator';
import { AudioMixerSuite } from '@/AudioMixerSuite';
import { AnalyticsDashboard } from '@/AnalyticsDashboard';
import { CollaborativeWorkspace } from '@/CollaborativeWorkspace';

export default function App() {
  const { activeTab } = useProject();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <HeaderNavBar />
      
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-y-auto">
        {activeTab === 'editor' && <TranscriptEditor />}
        {activeTab === 'invideo_ai' && <AIStudioGenerator />}
        {activeTab === 'audio_mixer' && <AudioMixerSuite />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'collab' && <CollaborativeWorkspace />}
      </main>
    </div>
  );
}
