import { useState } from 'react';
import { generateWithFreeProxy, ensureOmniKey, checkBalance, getDirectVideoUrl, getCredits, PROXY_BASE } from '@/lib/freeProxy';

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [keyInfo, setKeyInfo] = useState('');

  const generate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setProgress(5);
    setGeneratedUrl(null);

    try {
      setProgress(10);
      const key = await ensureOmniKey();
      setKeyInfo(key.slice(0, 16) + '...');
      console.log('Using omni key:', key);

      setProgress(20);
      const bal = await checkBalance(key);
      console.log('Balance:', bal, 'via', PROXY_BASE);
      
      setProgress(35);
      // TRUE MOTION VIDEO - POST /api/generate
      const { url } = await generateWithFreeProxy(prompt, 'video', { width: 1280, height: 720 });
      
      setProgress(90);
      setGeneratedUrl(url);
      setProgress(100);
      console.log('TRUE MOTION VIDEO URL:', url);

    } catch (e: any) {
      console.error(e);
      setError(e.message);
      // Fallback to direct GET video endpoint
      const direct = getDirectVideoUrl(prompt);
      console.log('Fallback direct video:', direct);
      setGeneratedUrl(direct);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, generatedUrl, error, progress, credits: getCredits(), keyInfo, proxyBase: PROXY_BASE };
}
