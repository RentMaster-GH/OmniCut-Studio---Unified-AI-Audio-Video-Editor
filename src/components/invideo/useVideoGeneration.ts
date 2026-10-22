import { useState } from 'react';
import { generateWithFreeProxy, getDirectVideoUrl, getCredits, PROXY_BASE } from '@/lib/freeProxy';

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [progress, setProgress] = useState(0);

  const generate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setProgress(15);
    setGeneratedUrl(null);
    try {
      console.log('FREE_PROXY active - using GET to avoid CORS:', PROXY_BASE);
      setProgress(40);
      const { url } = await generateWithFreeProxy(prompt, 'video');
      setProgress(80);
      // Add cache bust to force video reload
      const finalUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      setGeneratedUrl(finalUrl);
      setProgress(100);
      console.log('TRUE MOTION VIDEO URL (no CORS):', finalUrl);
    } catch (e:any) {
      setError(e.message);
      setGeneratedUrl(getDirectVideoUrl(prompt));
    } finally {
      setIsGenerating(false);
    }
  };
  return { generate, isGenerating, generatedUrl, error, progress, credits: getCredits() };
}
