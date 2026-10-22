"use client";
import { useEffect, useState } from 'react';

export function FreeProxyBadge() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState({ credits: 100, key: '' });
  
  useEffect(() => {
    setMounted(true);
    try {
      let k = localStorage.getItem('omnicut_free_key');
      if (!k) {
        k = 'omni_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('omnicut_free_key', k);
        localStorage.setItem('omnicut_credits', '100');
      }
      const c = parseInt(localStorage.getItem('omnicut_credits') || '100');
      setData({ credits: c, key: k.slice(0,12) });
    } catch {}
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div style={{
      position:'fixed', bottom:16, right:16, zIndex:9999,
      background:'#0a0a0a', color:'#00ff88', padding:'6px 10px',
      borderRadius:8, fontFamily:'monospace', fontSize:11,
      border:'1px solid #00ff88', opacity:0.9
    }}>
      FREE_PROXY: {data.credits} | {data.key}...
    </div>
  );
}
