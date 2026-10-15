import React, { useState } from 'react';
import { useProject } from '@/ProjectContext';
import {
  Users,
  GitBranch,
  History,
  MessageSquare,
  CheckCircle2,
  Clock,
  Shield,
  Plus,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Send,
} from 'lucide-react';

export const CollaborativeWorkspace: React.FC = () => {
  const {
    collaborators,
    comments,
    addComment,
    resolveComment,
    versions,
    restoreVersion,
    createVersionSnapshot,
    userRole,
    setUserRole,
    currentTime,
    seek,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'comments' | 'versions' | 'team'>('comments');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newVersionLabel, setNewVersionLabel] = useState<string>('');
  const [newVersionSummary, setNewVersionSummary] = useState<string>('');

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(newCommentText.trim());
    setNewCommentText('');
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionLabel.trim()) return;
    createVersionSnapshot(newVersionLabel.trim(), newVersionSummary.trim() || 'Manual revision point');
    setNewVersionLabel('');
    setNewVersionSummary('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Users className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Team Workspace & Version Control
            </h3>
            <p className="text-[10px] text-zinc-400">
              Live collaboration, review comments, and timeline rollback
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-zinc-800/80 rounded-lg p-0.5 border border-zinc-700/60 text-xs">
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'comments' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({comments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'versions' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versions ({versions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'team' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team ({collaborators.length})</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-zinc-300">
        {/* TAB 1: Review Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* New Comment Input */}
            <form onSubmit={handlePostComment} className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  Leave feedback at playhead: <strong className="text-zinc-200 font-mono">{currentTime.toFixed(2)}s</strong>
                </span>
                <span className="text-[10px] text-zinc-500">Visible to all editors</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Can we trim this pause or boost voiceover volume?"
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 disabled:opacity-40 transition"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-2.5">
              {comments.map(c => (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border transition ${
                    c.resolved ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60' : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <img src={c.authorAvatar} alt={c.authorName} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <span className="font-semibold text-white block text-[11px]">{c.authorName}</span>
                        <span className="text-[9px] text-zinc-400">{c.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => seek(c.timestampSeconds)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[10px] flex items-center gap-1 border border-zinc-700"
                        title="Jump timeline to this comment"
                      >
                        <Clock className="w-3 h-3 text-blue-400" />
                        {c.timestampSeconds.toFixed(1)}s
                      </button>

                      <button
                        onClick={() => resolveComment(c.id)}
                        className={`p-1 rounded transition ${
                          c.resolved ? 'text-emerald-400 bg-emerald-950/40' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={c.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-zinc-200 text-xs leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Version History & Rollback */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            {/* Create Snapshot Form */}
            <form onSubmit={handleCreateSnapshot} className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-white block">Create New Version Snapshot</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. v2.1 Color Grading Final"
                  value={newVersionLabel}
                  onChange={e => setNewVersionLabel(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newVersionLabel.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 disabled:opacity-40 transition"
                >
                  <GitBranch className="w-3.5 h-3.5" /> Snapshot
                </button>
              </div>
            </form>

            {/* Versions Timeline List */}
            <div className="space-y-3">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start justify-between hover:border-zinc-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded text-[11px]">
                        {ver.versionNumber}
                      </span>
                      <span className="font-semibold text-white text-xs">{ver.label}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{ver.changesSummary}</p>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-2 pt-0.5">
                      <span>By {ver.author}</span>
                      <span>•</span>
                      <span>{ver.timestamp}</span>
                    </div>
                  </div>

                  {idx > 0 && (
                    <button
                      onClick={() => restoreVersion(ver.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition shrink-0 ml-3"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Team & Permissions (RBAC) */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Your Active Role:</span>
                <span className="text-[11px] text-zinc-400">Controls timeline edit and export permissions</span>
              </div>
              <select
                value={userRole}
                onChange={e => setUserRole(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                <option value="Owner">Owner (Full Studio Control)</option>
                <option value="Lead Producer">Lead Producer (Audio/Video/Publish)</option>
                <option value="Editor">Editor (Timeline & Captions Only)</option>
                <option value="Viewer">Viewer (Comments Only)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider block">
                Active Live Collaborators ({collaborators.length})
              </span>
              {collaborators.map(user => (
                <div
                  key={user.id}
                  className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      <div
                        style={{ backgroundColor: user.color }}
                        className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-zinc-950"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-white block text-xs">{user.name}</span>
                      <span className="text-[10px] text-zinc-400">
                        {user.role} • {user.status === 'editing' ? 'Active on timeline' : user.status}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">{user.lastActive}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
