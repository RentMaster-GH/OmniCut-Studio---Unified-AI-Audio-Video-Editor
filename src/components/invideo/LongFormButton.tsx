import { useVideoGeneration } from './useVideoGeneration';
export function LongFormButton({ addToTimeline }: { addToTimeline: (clip: any) => void }) {
  const { generateLongVideo, isGenerating, progress, currentStep } = useVideoGeneration();
  return (
    <div className="space-y-2 mt-3">
      <button
        disabled={isGenerating}
        onClick={() => generateLongVideo('person cooking jollof in ghana', 10, (url, i) => {
          addToTimeline({ url, duration: 10, transition: 'crossfade', index: i });
        })}
        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 px-4 rounded-lg"
      >
        {isGenerating ? `Generating ${progress}%...` : 'Generate 10 Min Video'}
      </button>
      {isGenerating && <div className="text-xs text-gray-400">{currentStep}</div>}
    </div>
  );
}
