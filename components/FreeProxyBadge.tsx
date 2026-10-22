"use client";
import { useEffect, useState } from 'react';

export function FreeProxyBadge() {
  const [credits, setCredits] = useState<number>(100);
  const [key, setKey] = useState<string>('');

  useEffect(() => {
    const cached = localStorage.getItem('omnicut_free_key');
    const creds = localStorage.getItem('omnicut_credits');
    if (cached) setKey(cached);
    if (creds) setCredits(parseInt(creds));
    
    // Also check file cache if running in dev
    try {
      const fileCache = localStorage.getItem('.omnicut_key.json');
      if (fileCache) {
        const parsed = JSON.parse(fileCache);
        if (parsed.apiKey) setKey(parsed.apiKey);
      }
    } catch {}
  }, []);

  if (!key) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-mono border border-green-500/30">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      FREE_PROXY: {credits} credits | {key.slice(0,15)}... active
    </div>
  );
}
