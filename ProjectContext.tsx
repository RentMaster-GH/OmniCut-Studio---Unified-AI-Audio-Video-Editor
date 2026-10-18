import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  AspectRatio,
  TimelineClip,
  TimelineTrack,
  TranscriptWord,
  Collaborator,
  ProjectComment,
  ProjectVersion,
  ProjectAnalytics,
  CaptionStyle,
  ColorGrading,
  AudioMixerChannel,
} from "./types";
import {
  INITIAL_CLIPS,
  INITIAL_TRACKS,
  INITIAL_TRANSCRIPT,
  INITIAL_COLLABORATORS,
  INITIAL_COMMENTS,
  INITIAL_VERSIONS,
  INITIAL_ANALYTICS,
  DEFAULT_CAPTION_STYLE,
  DEFAULT_COLOR_GRADING,
} from "./initialProject";
import { audioEngine } from "./audioEngine";
import { matchVideoForPrompt } from "./videoLibrary";

interface ProjectContextType {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  stepFrame: (frames: number) => void;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  activeTool: 'select' | 'razor' | 'slip';
  setActiveTool: (tool: 'select' | 'razor' | 'slip') => void;
  snapping: boolean;
  setSnapping: (enabled: boolean) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  deleteClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, newStart: number, newTrackId?: string) => void;
  trimClip: (clipId: string, deltaStart: number, deltaDuration: number) => void;
  addClip: (clip: TimelineClip) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  transcript: TranscriptWord[];
  setTranscript: React.Dispatch<React.SetStateAction<TranscriptWord[]>>;
  removeFillerWords: () => void;
  deleteTranscriptWord: (wordId: string) => void;
  overdubTranscriptWord: (wordId: string, newWord: string) => Promise<void>;
  generateTranscriptFromClips: () => Promise<void>;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  showSafeMargins: boolean;
  setShowSafeMargins: (show: boolean) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;
  generateAIVideo: (prompt: string, tone?: string, format?: string, mode?: string, image?: string | null) => Promise<any>;
  generateLongFormDocumentary: (masterPrompt: string, tone: string, format: string) => Promise<any>;
  isAIGenerating: boolean;
  colorGrading: ColorGrading;
  setColorGrading: React.Dispatch<React.SetStateAction<ColorGrading>>;
  audioChannels: AudioMixerChannel[];
  updateAudioChannel: (trackId: string, updates: Partial<AudioMixerChannel>) => void;
  isStudioSoundActive: boolean;
  toggleStudioSound: () => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  collaborators: Collaborator[];
  comments: ProjectComment[];
  addComment: (text: string, timestamp?: number) => void;
  resolveComment: (commentId: string) => void;
  versions: ProjectVersion[];
  restoreVersion: (versionId: string) => void;
  createVersionSnapshot: (label: string, summary?: string) => void;
  userRole: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer';
  setUserRole: (role: 'Owner' | 'Lead Producer' | 'Editor' | 'Viewer') => void;
  analytics: ProjectAnalytics;
  isBiometricLocked: boolean;
  verifyBiometric: () => Promise<boolean>;
  lockWorkspace: () => void;
  isEndToEndEncrypted: boolean;
  encryptionFingerprint: string;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  syncNow: () => void;
  activeTab: 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab';
  setActiveTab: (tab: 'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab') => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
  showSecurityModal: boolean;
  setShowSecurityModal: (show: boolean) => void;
  theme: 'dark' | 'oled' | 'light';
  setTheme: (t: 'dark' | 'oled' | 'light') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function hashPrompt(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 999999;
}
function parseDurationFromPrompt(prompt: string): number {
  const lower = prompt.toLowerCase();
  if (lower.includes('1 hour') || lower.includes('60 min') || lower.includes('one hour')) return 3600;
  if (lower.includes('30 min')) return 1800;
  if (lower.includes('10 min')) return 600;
  if (lower.includes('5 min')) return 300;
  if (lower.includes('2 min')) return 120;
  return 20;
}
async function tryGenerateRealVideo(prompt: string, durationSec: number): Promise<string | null> {
  const endpoints = ['http://localhost:8000/generate', 'https://api.omnicut.local/generate'];
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: durationSec }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch {}
  }
  return null;
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const [tracks, setTracks] = useState<TimelineTrack[]>(INITIAL_TRACKS);
  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_CLIPS);
  const [activeTool, setActiveTool] = useState<'select' | 'razor' | 'slip'>('select');
  const [snapping, setSnapping] = useState(true);
  const [zoom, setZoom] = useState(48);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(INITIAL_CLIPS[0]?.id ?? 'clip-v1-1');
  const [transcript, setTranscript] = useState<TranscriptWord[]>(INITIAL_TRANSCRIPT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [showSafeMargins, setShowSafeMargins] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
  const [colorGrading, setColorGrading] = useState<ColorGrading>(DEFAULT_COLOR_GRADING);
  const [isStudioSoundActive, setIsStudioSoundActive] = useState(true);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [audioChannels, setAudioChannels] = useState<AudioMixerChannel[]>(() => [
    { trackId: 'track-v1', name: 'V1 • Video Audio (AI Clips)', volume: 1.0, pan: 0, eq: { low: 0, lowMid: 0, highMid: 0, high: 0 }, compressorEnabled: true, compressorThreshold: -16, studioSoundActive: true, noiseReductionDb: 10, deReverbPct: 40, currentPeakLevel: 0.7 },
    ...INITIAL_TRACKS.filter(t => t.type === 'audio').map(t => ({ trackId: t.id, name: t.name, volume: t.volume, pan: 0, eq: { low: 0, lowMid: 0, highMid: 1.5, high: 2.0 }, compressorEnabled: true, compressorThreshold: -18, studioSoundActive: t.id === 'track-a1', noiseReductionDb: t.id === 'track-a1' ? 14 : 0, deReverbPct: t.id === 'track-a1' ? 85 : 0, currentPeakLevel: 0.65 }))
  ]);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [collaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [comments, setComments] = useState<ProjectComment[]>(INITIAL_COMMENTS);
  const [versions, setVersions] = useState<ProjectVersion[]>(INITIAL_VERSIONS);
  const [userRole, setUserRole] = useState<'Owner' | 'Lead Producer' | 'Editor' | 'Viewer'>('Lead Producer');
  const [analytics, setAnalytics] = useState<ProjectAnalytics>(INITIAL_ANALYTICS);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [isEndToEndEncrypted] = useState(true);
  const [encryptionFingerprint] = useState('SHA256:7e91...d8a2 (AES-GCM-256)');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [activeTab, setActiveTab] = useState<'editor' | 'invideo_ai' | 'audio_mixer' | 'analytics' | 'collab'>('editor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'oled' | 'light'>('dark');

  const duration = Math.max(30, ...clips.map(c => c.start + c.duration));

  useEffect(() => { audioEngine.init(); audioEngine.setMasterVolume(masterVolume); audioEngine.setStudioSound(isStudioSoundActive); }, []);
  useEffect(() => {
    if (!isPlaying) { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); audioEngine.stopAmbientPlayback(); return; }
    lastTimeRef.current = performance.now(); audioEngine.startAmbientPlayback('cinematic');
    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000; lastTimeRef.current = now; let finished = false;
      setCurrentTime(prev => { const next = prev + delta; if (next >= duration) { finished = true; return 0; } return next; });
      if (finished) { setIsPlaying(false); audioEngine.stopAmbientPlayback(); return; }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); audioEngine.stopAmbientPlayback(); };
  }, [isPlaying, duration]);

  const setMasterVolume = useCallback((vol: number) => { setMasterVolumeState(vol); audioEngine.setMasterVolume(vol); }, []);
  const play = useCallback(() => { audioEngine.resume(); if (currentTime >= duration) setCurrentTime(0); setIsPlaying(true); }, [currentTime, duration]);
  const pause = useCallback(() => { setIsPlaying(false); audioEngine.stopAmbientPlayback(); }, []);
  const togglePlay = useCallback(() => { if (!isPlaying) audioEngine.resume(); setIsPlaying(p => !p); }, [isPlaying]);
  const seek = useCallback((s: number) => { const clamped = Math.max(0, Math.min(duration, s)); setCurrentTime(clamped); audioEngine.playTimelineTick(380, 0.04); }, [duration]);
  const stepFrame = useCallback((frames: number) => seek(currentTime + frames / 30), [currentTime, seek]);

  const splitClipAtPlayhead = useCallback((targetClipId?: string) => {
    const clipToSplit = targetClipId ? clips.find(c => c.id === targetClipId) : clips.find(c => currentTime > c.start && currentTime < c.start + c.duration);
    if (!clipToSplit) return; const offset = currentTime - clipToSplit.start; if (offset <= 0.1 || offset >= clipToSplit.duration - 0.1) return;
    const first: TimelineClip = { ...clipToSplit, id: `${clipToSplit.id}_pt1_${Date.now()}`, duration: offset };
    const second: TimelineClip = { ...clipToSplit, id: `${clipToSplit.id}_pt2_${Date.now()}`, start: currentTime, duration: clipToSplit.duration - offset, sourceStart: (clipToSplit.sourceStart || 0) + offset, title: `${clipToSplit.title} (Cut)` };
    setClips(p => p.filter(c => c.id !== clipToSplit.id).concat([first, second])); setSelectedClipId(second.id); audioEngine.playTimelineTick(520, 0.08, 'triangle');
  }, [clips, currentTime]);
  const deleteClip = useCallback((id: string) => { setClips(p => p.filter(c => c.id !== id)); setSelectedClipId(p => (p === id ? null : p)); }, []);

  const selectedClipIdRef = useRef(selectedClipId); selectedClipIdRef.current = selectedClipId;
  const togglePlayRef = useRef(togglePlay); togglePlayRef.current = togglePlay;
  const stepFrameRef = useRef(stepFrame); stepFrameRef.current = stepFrame;
  const splitClipAtPlayheadRef = useRef(splitClipAtPlayhead); splitClipAtPlayheadRef.current = splitClipAtPlayhead;
  const deleteClipRef = useRef(deleteClip); deleteClipRef.current = deleteClip;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement; const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable); if (isInput) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlayRef.current(); }
      else if (e.key === 'j' || e.key === 'J') { e.preventDefault(); stepFrameRef.current(-1); }
      else if (e.key === 'l' || e.key === 'L') { e.preventDefault(); stepFrameRef.current(1); }
      else if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      else if (e.key === 'c' || e.key === 'C') setActiveTool('razor');
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); splitClipAtPlayheadRef.current(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedClipIdRef.current) { e.preventDefault(); deleteClipRef.current(selectedClipIdRef.current); } }
      else if (e.key === 'm' || e.key === 'M') setMasterVolumeState(prev => (prev === 0 ? 0.85 : 0));
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); setShowUploadModal(true); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); setShowExportModal(true); }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateClip = useCallback((id: string, u: Partial<TimelineClip>) => setClips(p => p.map(c => (c.id === id ? { ...c, ...u } : c))), []);
  const moveClip = useCallback((id: string, newStart: number, newTrackId?: string) => { let finalStart = Math.max(0, newStart); if (snapping && Math.abs(finalStart - currentTime) < 0.25) finalStart = currentTime; setClips(p => p.map(c => (c.id === id ? { ...c, start: finalStart, trackId: newTrackId || c.trackId } : c))); }, [snapping, currentTime]);
  const trimClip = useCallback((id: string, ds: number, dd: number) => setClips(p => p.map(c => (c.id === id ? { ...c, start: Math.max(0, c.start + ds), duration: Math.max(0.2, c.duration + dd) } : c))), []);
  const addClip = useCallback((clip: TimelineClip) => setClips(p => [...p, clip]), []);
  const toggleTrackMute = useCallback((id: string) => setTracks(p => p.map(t => (t.id === id ? { ...t, muted: !t.muted } as any : t))), []);
  const toggleTrackSolo = useCallback((id: string) => setTracks(p => p.map(t => (t.id === id ? { ...t, solo: !t.solo } as any : t))), []);
  const toggleTrackLock = useCallback((id: string) => setTracks(p => p.map(t => (t.id === id ? { ...t, locked: !t.locked } as any : t))), []);
  const setTrackVolume = useCallback((id: string, v: number) => setTracks(p => p.map(t => (t.id === id ? { ...t, volume: v } : t))), []);
  const removeFillerWords = useCallback(() => { const fillers = transcript.filter(w => w.isFiller); if (!fillers.length) return; setTranscript(p => p.filter(w => !w.isFiller)); const saved = fillers.reduce((a, c) => a + (c.end - c.start), 0); setClips(p => p.map(cl => (cl.trackId === 'track-a1' ? { ...cl, duration: Math.max(1, cl.duration - saved * 0.4) } : cl))); setAnalytics(p => ({ ...p, avgRetentionPct: Math.min(96, (p as any).avgRetentionPct + 6.4) } as any)); }, [transcript]);
  const deleteTranscriptWord = useCallback((id: string) => setTranscript(p => p.filter(w => w.id !== id)), []);
  const overdubTranscriptWord = useCallback(async (id: string, newWord: string) => { setTranscript(p => p.map(w => (w.id === id ? { ...w, word: newWord, isFiller: false } : w))); audioEngine.speakNarration(newWord, 'Zephyr'); }, []);
  const generateTranscriptFromClips = useCallback(async () => setTranscript(INITIAL_TRANSCRIPT), []);

  const generateAIVideo = useCallback(async (prompt: string, tone = 'engaging', format = '16:9', mode = 'text-to-video', image?: string | null) => {
    setIsAIGenerating(true);
    let scriptData: any = null;
    try { const resp = await fetch('/api/ai/generate-script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, tone, format, mode, image, duration: `${parseDurationFromPrompt(prompt)}s` }) }); if (resp.ok) scriptData = await resp.json(); } catch {}
    const isImageMode = mode === 'image-to-video' && !!image;
    const cleanSubject = prompt.replace(/^(create a|generate a|make a|video of|video about|clip of|show me|a)\s+/i, '').slice(0, 48);
    const totalDuration = parseDurationFromPrompt(prompt); const isLongMovie = totalDuration >= 300; const sceneDuration = isLongMovie ? 30 : 6; const maxScenesForUI = isLongMovie ? 120 : 4;
    const defaultScenes = isImageMode ? Array.from({ length: 3 }, (_, i) => ({ title: `Scene ${i + 1}`, duration: sceneDuration, narration: `Animating ${cleanSubject}`, visualPrompt: prompt, overlayText: `✨ ${cleanSubject.toUpperCase()}` })) : scriptData?.scenes?.length ? scriptData.scenes : Array.from({ length: isLongMovie ? 6 : 3 }, (_, i) => ({ title: `Scene ${i + 1}`, duration: sceneDuration, narration: `Chapter ${i + 1} of ${cleanSubject}`, visualPrompt: `${prompt}, cinematic, 8k, scene ${i + 1}`, overlayText: `CHAPTER ${i + 1}` }));
    const rawScenes = (scriptData?.scenes?.length ? scriptData.scenes : defaultScenes).slice(0, maxScenesForUI);
    const newClips: TimelineClip[] = []; const newTranscript: TranscriptWord[] = []; let currentTimelineStart = 0; let wordIdCounter = 1;
    for (let idx = 0; idx < rawScenes.length; idx++) {
      const sc: any = rawScenes[idx]; const thisSceneDuration = Math.max(3.5, Number(sc.duration) || sceneDuration); const searchPrompt = sc.visualPrompt || prompt; const matchedVideo = matchVideoForPrompt(searchPrompt);
      let videoSrc = ''; let imageSrc: string | undefined = undefined;
      if (isImageMode) { imageSrc = image!; } else { const realVideoUrl = await tryGenerateRealVideo(searchPrompt, thisSceneDuration); if (realVideoUrl) videoSrc = realVideoUrl; else { const seed = hashPrompt(searchPrompt + idx); const encoded = encodeURIComponent(`${searchPrompt}, photorealistic, 8k, highly detailed, National Geographic, cinematic lighting, ultra realistic`); imageSrc = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`; } }
      newClips.push({ id: `clip-ai-v1-${idx}-${Date.now()}`, trackId: 'track-v1', title: `${matchedVideo.title} (Scene ${idx + 1})`, type: 'video', start: currentTimelineStart, duration: thisSceneDuration, volume: 1, speed: 1.0, muted: false, color: matchedVideo.color, visualTag: searchPrompt, src: videoSrc, imageSrc, prompt: searchPrompt, text: sc.overlayText, } as any);
      newClips.push({ id: `clip-ai-v2-${idx}-${Date.now()}`, trackId: 'track-v2', title: sc.title || `Scene ${idx + 1}`, type: 'overlay', start: currentTimelineStart + 0.5, duration: Math.max(2, thisSceneDuration - 1.2), volume: 0.8, speed: 1, muted: false, color: '#EC4899' } as any);
      newClips.push({ id: `clip-ai-cc-${idx}-${Date.now()}`, trackId: 'track-captions', title: `Caption ${idx + 1}`, type: 'caption', start: currentTimelineStart + 0.2, duration: thisSceneDuration - 0.4, volume: 1, speed: 1, muted: false, color: '#F59E0B', text: sc.overlayText || sc.narration } as any);
      newClips.push({ id: `clip-ai-a1-${idx}-${Date.now()}`, trackId: 'track-a1', title: `Voiceover: Scene ${idx + 1}`, type: 'audio', start: currentTimelineStart, duration: thisSceneDuration, volume: 0.95, speed: 1, muted: false, color: '#10B981' } as any);
      const words = (sc.narration || `AI Scene ${idx + 1} for ${prompt}`).split(/\s+/).filter(Boolean); const wordDuration = thisSceneDuration / Math.max(1, words.length);
      words.forEach((w: string, wIdx: number) => { const wStart = currentTimelineStart + wIdx * wordDuration; const isFiller = ['um', 'uh', 'like'].includes(w.toLowerCase().replace(/[^a-z]/g, '')); newTranscript.push({ id: `w-gen-${wordIdCounter++}`, word: w, start: parseFloat(wStart.toFixed(2)), end: parseFloat((wStart + wordDuration * 0.9).toFixed(2)), isFiller, confidence: 0.98 }); });
      currentTimelineStart += thisSceneDuration;
    }
    newClips.push({ id: `clip-ai-a2-${Date.now()}`, trackId: 'track-a2', title: `Soundtrack: ${tone.toUpperCase()} - ${totalDuration}s`, type: 'audio', start: 0, duration: currentTimelineStart, volume: 0.35, speed: 1, muted: false, color: '#8B5CF6' } as any);
    setClips(newClips); setTranscript(newTranscript); if (newClips[0]) setSelectedClipId(newClips[0].id); setCurrentTime(0); audioEngine.resume(); audioEngine.setMasterVolume(masterVolume); audioEngine.setTrackVolume('track-v1', 1.0); setIsPlaying(true); setIsAIGenerating(false);
    return { title: scriptData?.projectTitle || cleanSubject, projectTitle: scriptData?.projectTitle || cleanSubject, duration: currentTimelineStart };
  }, [masterVolume]);

  // === NEW: Long Form Documentary - Premiere-style multitrack splitter ===
  const generateLongFormDocumentary = useCallback(async (masterPrompt: string, tone: string, format: string) => {
    setIsAIGenerating(true);
    try {
      let scenes: any[] = [];
      try {
        const response = await fetch('/api/ai/segment-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ masterPrompt, tone, format }),
        });
        if (response.ok) {
          const data = await response.json();
          scenes = data.scenes || [];
        }
      } catch (e) {
        console.warn('Segmenter node offline, using local splitter fallback', e);
      }

      // Fallback local splitter if API fails
      if (!scenes || scenes.length === 0) {
        const sentences = masterPrompt.split(/[.!\n]+/).filter(Boolean);
        const chunkSize = Math.ceil(sentences.length / 6) || 1;
        for (let i = 0; i < sentences.length; i += chunkSize) {
          const chunk = sentences.slice(i, i + chunkSize).join('. ');
          if (chunk.trim()) scenes.push({ sceneIndex: scenes.length, narrationText: chunk, visualPrompt: chunk, duration: 30 });
        }
        if (scenes.length === 0) scenes = [{ sceneIndex: 0, narrationText: masterPrompt, visualPrompt: masterPrompt, duration: 20 }];
      }

      let aggregatedTimelinePointer = 0;
      const newClips: TimelineClip[] = [];
      const newTranscript: TranscriptWord[] = [];
      let wordIdCounter = 1;

      for (let s = 0; s < scenes.length; s++) {
        const scene = scenes[s];
        const startOffset = aggregatedTimelinePointer;
        const dur = Math.max(5, Number(scene.duration) || 30);
        aggregatedTimelinePointer += dur;

        const matchedVideo = matchVideoForPrompt(scene.visualPrompt || masterPrompt);
        const seed = hashPrompt((scene.visualPrompt || masterPrompt) + s);
        const encoded = encodeURIComponent(`${scene.visualPrompt || masterPrompt}, documentary, photorealistic, 8k, cinematic lighting, ultra realistic`);
        const lifeLikeImage = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;
        const realVideoUrl = await tryGenerateRealVideo(scene.visualPrompt || masterPrompt, dur);

        // V1 - Main video track (Premiere style)
        newClips.push({
          id: `clip-ai-${Date.now()}-${scene.sceneIndex ?? s}`,
          trackId: 'track-v1',
          title: `Doc Scene ${s + 1}`,
          type: 'video',
          start: startOffset,
          duration: dur,
          volume: 1,
          speed: 1,
          muted: false,
          color: matchedVideo.color,
          visualTag: scene.visualPrompt,
          src: realVideoUrl || '',
          imageSrc: realVideoUrl ? undefined : lifeLikeImage,
          prompt: scene.visualPrompt,
          text: scene.narrationText?.slice(0, 60) || '',
          url: realVideoUrl || lifeLikeImage,
        } as any);

        // V2 - Overlay
        newClips.push({ id: `clip-overlay-${Date.now()}-${s}`, trackId: 'track-v2', title: `Lower Third ${s + 1}`, type: 'overlay', start: startOffset + 0.5, duration: dur - 1, volume: 0.8, speed: 1, muted: false, color: '#EC4899' } as any);
        // Captions
        newClips.push({ id: `clip-cap-${Date.now()}-${s}`, trackId: 'track-captions', title: `Caption ${s + 1}`, type: 'caption', start: startOffset + 0.2, duration: dur - 0.4, volume: 1, speed: 1, muted: false, color: '#F59E0B', text: scene.narrationText?.slice(0, 80) || '' } as any);
        // A1 - Voiceover
        newClips.push({ id: `clip-vo-${Date.now()}-${s}`, trackId: 'track-a1', title: `VO ${s + 1}`, type: 'audio', start: startOffset, duration: dur, volume: 0.95, speed: 1, muted: false, color: '#10B981' } as any);

        const words = (scene.narrationText || '').split(/\s+/).filter(Boolean);
        const wd = dur / Math.max(1, words.length);
        words.forEach((w: string, wi: number) => {
          newTranscript.push({ id: `w-doc-${wordIdCounter++}`, word: w, start: startOffset + wi * wd, end: startOffset + wi * wd + wd * 0.9, isFiller: false, confidence: 0.99 });
        });
      }

      newClips.push({ id: `clip-music-${Date.now()}`, trackId: 'track-a2', title: `Score: ${tone.toUpperCase()}`, type: 'audio', start: 0, duration: aggregatedTimelinePointer, volume: 0.35, speed: 1, muted: false, color: '#8B5CF6' } as any);

      setClips(newClips);
      setTranscript(newTranscript);
      if (newClips[0]) setSelectedClipId(newClips[0].id);
      setCurrentTime(0);
      setActiveTab('editor');
      setIsPlaying(true);
      audioEngine.resume();
      return { title: masterPrompt.slice(0, 42), duration: aggregatedTimelinePointer, scenes: newClips.length };
    } catch (err) {
      console.error('Long form project pipeline deployment failed:', err);
      throw err;
    } finally {
      setIsAIGenerating(false);
    }
  }, []);

  const updateAudioChannel = useCallback((id: string, u: Partial<AudioMixerChannel>) => { setAudioChannels(p => p.map(c => (c.trackId === id ? { ...c, ...u } : c))); if (u.volume !== undefined) audioEngine.setTrackVolume(id, u.volume); if (u.eq) audioEngine.updateEq(id, u.eq); if (u.studioSoundActive !== undefined) audioEngine.setStudioSound(u.studioSoundActive); }, []);
  const toggleStudioSound = useCallback(() => { setIsStudioSoundActive(p => { const n = !p; audioEngine.setStudioSound(n); return n; }); }, []);
  const addComment = useCallback((text: string, ts?: number) => { const nc = { id: `comm_${Date.now()}`, authorName: 'You', text, timestampSeconds: ts ?? currentTime, createdAt: 'Just now', resolved: false } as any; setComments(p => [nc, ...p]); }, [currentTime]);
  const resolveComment = useCallback((id: string) => setComments(p => p.map(c => (c.id === id ? { ...c, resolved: !c.resolved } : c))), []);
  const createVersionSnapshot = useCallback((label: string, summary = 'Manual save') => { const nv = { id: `ver_${Date.now()}`, versionNumber: `v${(versions.length * 0.5 + 1).toFixed(1)}`, label, timestamp: 'Just now', changesSummary: summary, clipsSnapshot: [...clips] } as any; setVersions(p => [nv, ...p]); }, [clips, versions.length]);
  const restoreVersion = useCallback((id: string) => { const t = versions.find(v => v.id === id); if (t?.clipsSnapshot) setClips([...t.clipsSnapshot]); }, [versions]);
  const verifyBiometric = useCallback(async () => { setIsBiometricLocked(false); return true; }, []);
  const lockWorkspace = useCallback(() => { setIsBiometricLocked(true); setIsPlaying(false); }, []);
  const syncNow = useCallback(() => { setCloudSyncStatus('syncing'); setTimeout(() => setCloudSyncStatus('synced'), 1200); }, []);

  return (
    <ProjectContext.Provider value={{
      currentTime, duration, isPlaying, play, pause, togglePlay, seek, stepFrame, tracks, clips, activeTool, setActiveTool, snapping, setSnapping, zoom, setZoom, selectedClipId, setSelectedClipId, splitClipAtPlayhead, deleteClip, updateClip, moveClip, trimClip, addClip, toggleTrackMute, toggleTrackSolo, toggleTrackLock, setTrackVolume, transcript, setTranscript, removeFillerWords, deleteTranscriptWord, overdubTranscriptWord, generateTranscriptFromClips, aspectRatio, setAspectRatio, showSafeMargins, setShowSafeMargins, captionStyle, setCaptionStyle, generateAIVideo, generateLongFormDocumentary, isAIGenerating, colorGrading, setColorGrading, audioChannels, updateAudioChannel, isStudioSoundActive, toggleStudioSound, masterVolume, setMasterVolume, collaborators, comments, addComment, resolveComment, versions, restoreVersion, createVersionSnapshot, userRole, setUserRole, analytics, isBiometricLocked, verifyBiometric, lockWorkspace, isEndToEndEncrypted, encryptionFingerprint, cloudSyncStatus, syncNow, activeTab, setActiveTab, showExportModal, setShowExportModal, showUploadModal, setShowUploadModal, showShortcutsModal, setShowShortcutsModal, showSecurityModal, setShowSecurityModal, theme, setTheme,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};

// Custom hook array to split, fetch, and load scene clips across Premiere-style multitrack
export const useProjectActions = () => {
  const project = useProject();
  return {
    generateLongFormDocumentary: project.generateLongFormDocumentary,
    generateAIVideo: project.generateAIVideo,
    isAIGenerating: project.isAIGenerating,
  };
};
