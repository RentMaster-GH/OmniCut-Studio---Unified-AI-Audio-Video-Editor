import React, { useState } from 'react';
import { useProject } from "../../context/ProjectContext";
import { Sparkles, Film } from 'lucide-react';

export default function AIStudioGenerator() {
  const [prompt, setPrompt] = useState("person cooking jollof in ghana cinematic");
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const generateTrueVideo = async () => {
    setLoading(true);
    setStatus("Generating real video (Accra.ai veo3.1)...");
    try {
      const REAL_GATEWAY = "https://pollination-ai-decentralized-inference-gateway.vercel.app/api/video/generate";
      const res = await fetch(REAL_GATEWAY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `${prompt}, Ghanaian jollof rice in large black pot, tomato stew, steam, wooden ladle, authentic kitchen, NOT bread, 4K` 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideoUrl(data.videoUrl);
      setStatus('Video ready! (Accra.ai - veo3.1)');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full p-3 rounded bg-black/50" />
      <button onClick={generateTrueVideo} disabled={loading} className="mt-3 w-full bg-white text-black rounded-full py-3 font-bold">
        {loading ? "Generating..." : "Generate TRUE Video"}
      </button>
      <p className="mt-2 text-sm opacity-70">{status}</p>
      {videoUrl && <video src={videoUrl} controls className="mt-4 w-full rounded" />}
    </div>
  );
}
