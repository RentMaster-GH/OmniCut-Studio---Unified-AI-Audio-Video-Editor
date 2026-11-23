import React, { useEffect, useState } from "react";

interface SsoProfile {
  authenticated: boolean;
  handle?: string;
  displayName?: string;
  soulBalance?: number;
  kycVerified?: boolean;
}

export const SovereignSsoBadge: React.FC = () => {
  const [profile, setProfile] = useState<SsoProfile | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let active = true;
    const apiBase = "https://" + "api." + "credibleartisans" + ".com";
    try {
      const params = new URLSearchParams(window.location.search);
      const incoming = params.get("soul_sso");
      if (incoming) {
        localStorage.setItem("soul_trader_token", incoming);
        params.delete("soul_sso");
        const clean = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (clean ? "?" + clean : "") + window.location.hash);
      }
    } catch {}

    const token = typeof window !== "undefined" ? localStorage.getItem("soul_trader_token") : null;
    if (!token) return;

    fetch(`${apiBase}/public/soulpay/sso/verify?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d || !d.authenticated) return;
        setProfile(d);
        try {
          localStorage.setItem("soul_active_handle", d.handle || "");
        } catch {}
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const hubUrl = "https://" + "api." + "credibleartisans" + ".com/public/aetherhost/live/id.soul";

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        title="Expand Sovereign SSO Badge"
        style={{ position: "fixed", bottom: 14, right: 14, zIndex: 9990 }}
        className="px-2.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg backdrop-blur"
      >
        {profile?.kycVerified ? "✅" : "🔐"}
      </button>
    );
  }

  return (
    <div
      style={{ position: "fixed", bottom: 14, right: 14, zIndex: 9990 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/40 text-xs font-semibold text-slate-100 shadow-xl backdrop-blur"
    >
      {profile?.authenticated ? (
        <>
          <a
            href={hubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-300 hover:text-emerald-200 font-mono"
          >
            {profile.kycVerified ? "✅" : "🪙"} {profile.handle} • {Number(profile.soulBalance || 0).toLocaleString()} SOUL
          </a>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("soul_trader_token");
              localStorage.removeItem("soul_active_handle");
              setProfile(null);
            }}
            className="text-[10px] text-slate-400 hover:text-rose-300 border-l border-slate-700 pl-2"
          >
            Sign out
          </button>
        </>
      ) : (
        <a href={hubUrl} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">
          🔐 Sovereign SSO
        </a>
      )}
      <button
        type="button"
        onClick={() => setMinimized(true)}
        aria-label="Minimize SSO badge"
        className="text-slate-400 hover:text-white border-l border-slate-700 pl-1.5 font-mono"
      >
        −
      </button>
    </div>
  );
};
