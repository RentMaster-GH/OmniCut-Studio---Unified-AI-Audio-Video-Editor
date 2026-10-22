import { useState } from 'react';
import { generateWithFreeProxy, PROXY_BASE, getCredits } from '@/lib/freeProxy';

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setProgress(10);
    setGeneratedUrl(null);

    try {
      console.log('TRUE MOTION via:', PROXY_BASE, prompt, 'Credits:', getCredits());
      setProgress(25);
      
      // FORCE video type + motion=true
      const { url, type } = await generateWithFreeProxy(prompt + ' true motion video, 5 seconds, cinematic, smooth movement', 'video', { width: 1280, height: 720 });
      
      setProgress(80);
      console.log('Generated motion URL:', url, 'type:', type);
      
      // If your proxy returns image first, convert to video endpoint
      let finalUrl = url;
      if (type === 'image' && url.includes('pollinations.ai')) {
        // Try to get video version from your gateway
        const videoUrl = `${PROXY_BASE}/api/video?prompt=${encodeURIComponent(prompt)}&motion=true&duration=5`;
        finalUrl = videoUrl;
      }
      
      setGeneratedUrl(finalUrl);
      setProgress(100);
      
    } catch (e: any) {
      console.error('Motion generation failed:', e);
      setError(e.message);
      // Still try your gateway as direct iframe
      const fallback = `${PROXY_BASE}/api/generate?prompt=${encodeURIComponent(prompt)}&type=video`;
      setGeneratedUrl(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, generatedUrl, error, progress, credits: getCredits(), proxyBase: PROXY_BASE };
}
