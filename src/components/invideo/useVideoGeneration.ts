import { useState } from 'react';
import { generateWithFreeProxy, getDirectVideoUrl, getCredits, PROXY_BASE } from '@/lib/freeProxy';

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const generate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setProgress(15);
    setGeneratedUrl(null);
    try {
      const { url } = await generateWithFreeProxy(prompt);
      const finalUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
      setGeneratedUrl(finalUrl);
      setProgress(100);
    } catch (e: any) {
      setError(e.message);
      setGeneratedUrl(getDirectVideoUrl(prompt));
    } finally {
      setIsGenerating(false);
    }
  };

  const generateLongVideo = async (topic: string, durationMinutes: number = 10, onClip?: (url: string, index: number) => void) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    const steps = [
      `${topic}, ingredients on table top view`,
      `${topic}, chopping onions in ghana kitchen`,
      `${topic}, blending tomatoes and pepper`,
      `${topic}, frying tomato stew in pot`,
      `${topic}, adding rice to stew and stirring`,
      `${topic}, covering pot with foil steaming`,
      `${topic}, opening pot steam coming out`,
      `${topic}, molding jollof rice on plate`,
      `${topic}, serving with fried chicken`,
      `${topic}, person eating happily cinematic`
    ];
    const totalClips = durationMinutes * 6;
    const urls: string[] = [];
    for (let i = 0; i < totalClips; i++) {
      const prompt = steps[i % steps.length];
      setCurrentStep(`Clip ${i+1}/${totalClips}`);
      setProgress(Math.round((i / totalClips) * 100));
      try {
        const { url } = await generateWithFreeProxy(prompt);
        const finalUrl = `${url}${url.includes('?') ? '&' : '?'}clip=${i}&t=${Date.now()}`;
        urls.push(finalUrl);
        onClip?.(finalUrl, i);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {}
    }
    setProgress(100);
    setCurrentStep(`Done! ${urls.length} clips`);
    setIsGenerating(false);
    return urls;
  };

  return { generate, generateLongVideo, isGenerating, generatedUrl, error, progress, currentStep, credits: getCredits() };
}
