import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Loader2, LogIn, UserPlus } from 'lucide-react';

// Automatically attach stored JWT token to all backend API calls
const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('omnicut_jwt');
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const apiBase = (import.meta as any).env?.VITE_API_URL || '';

  if (token && (urlStr.startsWith('/api') || (apiBase && urlStr.startsWith(apiBase)))) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return originalFetch(input, { ...init, headers });
  }
  return originalFetch(input, init);
};

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'setup' | 'login' | 'authenticated'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Studio Owner');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = (import.meta as any).env?.VITE_API_URL || '';

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('omnicut_jwt');
      if (token) {
        try {
          const meRes = await originalFetch(`${apiBase}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            setStatus('authenticated');
            return;
          }
          localStorage.removeItem('omnicut_jwt');
        } catch {
          // Proceed to status check
        }
      }

      try {
        const statusRes = await originalFetch(`${apiBase}/api/auth/status`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          setStatus(data.initialized ? 'login' : 'setup');
        } else {
          setStatus('login');
        }
      } catch {
        setStatus('login');
      }
    };
    checkSession();
  }, [apiBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const endpoint = status === 'setup' ? '/api/auth/setup' : '/api/auth/login';
    try {
      const res = await originalFetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      if (data.token) {
        localStorage.setItem('omnicut_jwt', data.token);
        setStatus('authenticated');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span>Verifying HP Laptop Studio Session...</span>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              {status === 'setup' ? 'Initialize Studio Owner Account' : 'OmniCut Studio Private Access'}
            </h1>
            <p className="text-xs text-zinc-400">
              {status === 'setup'
                ? 'Create your admin login. Public registration locks permanently afterward.'
                : 'Sign in to unlock your HP Laptop PostgreSQL & FFmpeg backend'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {status === 'setup' && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Owner Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Admin Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'setup' ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Owner & Lock Studio
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Unlock OmniCut Studio
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> HS256 JWT Protected
          </span>
          <span>HP-EliteBook-1040-G3</span>
        </div>
      </div>
    </div>
  );
};
