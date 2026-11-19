import React, { useState, useEffect } from 'react';
import { X, Shield, Users, HardDrive, FolderKanban, Trash2, RefreshCw } from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = (import.meta as any).env?.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://omnicut.credibleartisans.com' : '');

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/admin/overview`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load admin overview');
      setOverview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchOverview();
  }, [isOpen]);

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Delete user "${email}" along with all their projects and media files?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) fetchOverview();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">HP Laptop Admin Server Monitor</h2>
              <p className="text-[11px] text-zinc-400">Registered users, PostgreSQL projects & isolated disk storage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">{error}</div>
          )}

          {overview && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <Users className="w-4 h-4 text-blue-400" /> Registered Users
                  </div>
                  <div className="text-xl font-bold text-white">{overview.totalUsers}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <FolderKanban className="w-4 h-4 text-emerald-400" /> Total DB Projects
                  </div>
                  <div className="text-xl font-bold text-white">{overview.totalProjects}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <HardDrive className="w-4 h-4 text-amber-400" /> Laptop Media Storage
                  </div>
                  <div className="text-xl font-bold text-white">
                    {overview.totalStorageMb} MB <span className="text-xs font-normal text-zinc-400">({overview.totalFiles} files)</span>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-3.5 py-2.5">User</th>
                      <th className="px-3.5 py-2.5">Role</th>
                      <th className="px-3.5 py-2.5">Projects</th>
                      <th className="px-3.5 py-2.5">Folder Usage</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {overview.users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-zinc-950/50">
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-zinc-400">{u.email}</div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-zinc-300">{u.project_count}</td>
                        <td className="px-3.5 py-2.5 text-zinc-300">
                          {u.storageMb} MB {u.role === 'admin' ? <span className="text-amber-400/80">(Unlimited)</span> : <span className="text-zinc-500">/ 500 MB</span>} <span className="text-zinc-500">({u.fileCount} files)</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition"
                              title="Delete User & Wipe Folder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
