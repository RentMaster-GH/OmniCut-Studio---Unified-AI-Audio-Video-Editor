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
      console.log('FREE_PROXY active - bypass CORS via src:', PROXY_BASE);
      const { url } = await generateWithFreeProxy(prompt);
      setProgress(80);
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

  // 10 MINUTE JOLLOF COOKING VIDEO
  const generateLongVideo = async (topic: string, durationMinutes: number = 10, onClip?: (url: string, index: number) => void) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    const steps = [
      `${topic}, ingredients on table top view, raw rice tomatoes onions`,
      `${topic}, chopping onions in ghana kitchen closeup`,
      `${topic}, blending tomatoes and pepper in blender`,
      `${topic}, frying tomato stew in black pot oil sizzling`,
      `${topic}, adding rice to stew and stirring with wooden spoon`,
      `${topic}, covering pot with foil steaming jollof`,
      `${topic}, opening pot steam coming out aromatic`,
      `${topic}, molding jollof rice on plate perfect dome`,
      `${topic}, serving with fried chicken and plantain`,
      `${topic}, person eating happily family dinner cinematic`
    ];

    const clipsPerMinute = 6; // 10s per clip
    const totalClips = durationMinutes * clipsPerMinute;
    const urls: string[] = [];

    console.log(`Generating ${totalClips} clips for ${durationMinutes}min video...`);

    for (let i = 0; i < totalClips; i++) {
      const prompt = steps[i % steps.length];
      setCurrentStep(`Clip ${i+1}/${totalClips}: ${prompt.slice(0,50)}...`);
      setProgress(Math.round((i / totalClips) * 100));
      
      try {
        const { url } = await generateWithFreeProxy(prompt);
        const finalUrl = `${url}${url.includes('?') ? '&' : '?'}clip=${i}&t=${Date.now()}`;
        urls.push(finalUrl);
        onClip?.(finalUrl, i);
        console.log(`✅ Clip ${i+1}/${totalClips} ready`);
        // Small delay to avoid rate limit
        await new Promise(r => setTimeout(r, 800));
      } catch (e: any) {
        console.error(`❌ Clip ${i+1} failed:`, e.message);
      }
    }

    setProgress(100);
    setCurrentStep(`Done! ${urls.length} clips generated for ${durationMinutes}min video`);
    setIsGenerating(false);
    return urls;
  };

  return { generate, generateLongVideo, isGenerating, generatedUrl, error, progress, currentStep, credits: getCredits() };
}
