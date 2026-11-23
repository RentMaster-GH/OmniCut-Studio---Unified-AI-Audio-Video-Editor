import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Loader2, LogIn, UserPlus, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

const API_HOST = 'https://' + 'api.' + 'credibleartisans' + '.com';

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('omnicut_jwt');
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const apiBase = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? API_HOST : '';

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
  const [status, setStatus] = useState<'checking' | 'login' | 'register' | 'forgot' | 'authenticated'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [emailedReset, setEmailedReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? API_HOST : '';

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
          // Proceed to login
        }
      }
      setStatus('login');
    };
    checkSession();
  }, [apiBase]);

  const switchMode = (nextMode: 'login' | 'register' | 'forgot') => {
    setStatus(nextMode);
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setResetToken('');
    setEmailedReset(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if ((status === 'register' || (status === 'forgot' && (resetToken || emailedReset))) && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter and confirm your password.');
      return;
    }

    setSubmitting(true);

    try {
      if (status === 'forgot') {
        if (!resetToken && !emailedReset) {
          const res = await originalFetch(`${apiBase}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not initiate password reset');
          if (data.emailed) {
            setEmailedReset(true);
          } else {
            setResetToken(data.resetToken || '');
          }
          setSuccessMsg(data.message || 'Check your email for the reset code.');
          return;
        } else {
          const res = await originalFetch(`${apiBase}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken, newPassword: password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Password reset failed');
          switchMode('login');
          setSuccessMsg(data.message || 'Password updated successfully! Please sign in.');
          return;
        }
      }

      const endpoint = status === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await originalFetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      if (status === 'register') {
        switchMode('login');
        setSuccessMsg('Account created successfully! Please sign in with your new credentials.');
      } else if (data.token) {
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
          <span>Loading OmniCut Studio...</span>
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
            {status === 'forgot' ? <KeyRound className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-base font-bold text-white">
              {status === 'register'
                ? 'Create OmniCut Studio Account'
                : status === 'forgot'
                ? 'Reset Account Password'
                : 'Sign In to OmniCut Studio'}
            </h1>
            <p className="text-xs text-zinc-400">
              {status === 'register'
                ? 'Register a workspace to edit videos, generate AI audio, and save projects.'
                : status === 'forgot'
                ? 'Verify your account email to set a new password.'
                : 'Access your cloud timeline, AI tools, and media workspace'}
            </p>
          </div>
        </div>

        {status !== 'forgot' ? (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-1.5 rounded-lg font-semibold transition ${status === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-1.5 rounded-lg font-semibold transition ${status === 'register' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {status === 'register' && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Display Name</label>
              <input
                type="text"
                required
                placeholder="Creator Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              disabled={status === 'forgot' && (Boolean(resetToken) || emailedReset)}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none disabled:opacity-60"
            />
          </div>

          {status === 'forgot' && emailedReset && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Reset Code (from email)</label>
              <input
                type="text"
                required
                placeholder="Paste reset code from your inbox"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value.trim())}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white font-mono text-[11px] outline-none"
              />
            </div>
          )}

          {(status !== 'forgot' || Boolean(resetToken) || emailedReset) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-300 font-medium">
                  {status === 'forgot' ? 'New Password' : 'Password'}
                </label>
                {status === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {(status === 'register' || (status === 'forgot' && (Boolean(resetToken) || emailedReset))) && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                {status === 'forgot' ? 'Confirm New Password' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : status === 'forgot' ? (
              <>
                <KeyRound className="w-4 h-4" /> {(resetToken || emailedReset) ? 'Update Password' : 'Send Reset Code'}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In to Studio
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-User JWT Workspace
          </span>
          <span>OmniCut Studio</span>
        </div>
      </div>
    </div>
  );
};
