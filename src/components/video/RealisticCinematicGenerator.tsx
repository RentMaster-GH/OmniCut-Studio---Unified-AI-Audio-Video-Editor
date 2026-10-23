import { useState } from "react";
import { generateRealistic, THEMES } from "@/lib/realisticVideo";

export default function RealisticCinematicGenerator({ onVideo }: { onVideo: (url:string)=>void }) {
  const [prompt, setPrompt] = useState("CEO walking from Bentley in Accra, luxury suit");
  const [theme, setTheme] = useState("mafia");
  const [model, setModel] = useState<"kling-3.0" | "runway-gen4.5">("kling-3.0");
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  async function handle() {
    setLoading(true);
    try {
      const data = await generateRealistic({ prompt, theme: theme as any, model, duration: 5 });
      setUrl(data.videoUrl);
      onVideo(data.videoUrl);
    } catch (e: any) {
      alert("Accra.ai error: " + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-4 rounded-xl border bg-black text-white space-y-3">
      <h3 className="font-bold">Accra.ai Realistic Video (via your Gateway)</h3>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full p-2 rounded bg-zinc-900" rows={3} />
      <div className="flex gap-2">
        <select value={theme} onChange={e=>setTheme(e.target.value)} className="p-2 rounded bg-zinc-900">
          {THEMES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={model} onChange={e=>setModel(e.target.value as any)} className="p-2 rounded bg-zinc-900">
          <option value="kling-3.0">accra-v1 Kling 3.0 (best motion)</option>
          <option value="runway-gen4.5">accra-v1 Runway 4.5 (best consistency)</option>
        </select>
      </div>
      <button onClick={handle} disabled={loading} className="w-full bg-white text-black py-2 rounded font-bold">
        {loading ? "Generating realistic..." : "Generate Realistic (FREE_PROXY + Accra.ai)"}
      </button>
      {url && <video src={url} controls autoPlay loop className="w-full rounded" />}
    </div>
  );
}
