import { useState } from 'react';
import { generateWithFreeProxy, getCredits } from '@/lib/freeProxy';

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
      console.log('Generating:', prompt, 'Credits:', getCredits());
      setProgress(30);
      
      const { url } = await generateWithFreeProxy(prompt, 'image', { width: 1280, height: 720 });
      
      setProgress(70);
      // Small delay for UX
      await new Promise(r => setTimeout(r, 800));
      
      setGeneratedUrl(url);
      setProgress(100);
      console.log('Generated URL:', url);
      
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Generation failed - trying free fallback');
      // Even on error, try direct pollinations URL
      const fallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;
      setGeneratedUrl(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, generatedUrl, error, progress, credits: getCredits() };
}
