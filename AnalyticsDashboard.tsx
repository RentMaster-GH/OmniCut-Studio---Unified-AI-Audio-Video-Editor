import React, { useRef, useEffect } from 'react';
import { useProject } from '@/projectContext';
import {
  TrendingUp,
  Users,
  Clock,
  Zap,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  BarChart3,
  ThumbsUp,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { analytics, seek, setActiveTab } = useProject();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Retention Curve Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    [100, 75, 50, 25].forEach(pct => {
      const y = h - (pct / 100) * (h - 30) - 15;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();

      ctx.fillStyle = '#71717a';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`${pct}%`, 5, y + 3);
    });

    // Draw retention curve
    const points = analytics.retentionCurve;
    if (points.length < 2) return;

    const startX = 40;
    const endX = w - 20;
    const stepX = (endX - startX) / (points.length - 1);

    // Gradient fill under curve
    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = startX + idx * stepX;
      const y = h - (p.pct / 100) * (h - 30) - 15;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(endX, h - 15);
    ctx.lineTo(startX, h - 15);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, 0, 0, h);
    areaGrad.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    areaGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    points.forEach((p, idx) => {
      const x = startX + idx * stepX;
      const y = h - (p.pct / 100) * (h - 30) - 15;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Points & markers
    points.forEach((p, idx) => {
      const x = startX + idx * stepX;
      const y = h - (p.pct / 100) * (h - 30) - 15;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Time marker along bottom
      if (idx % 2 === 0) {
        ctx.fillStyle = '#71717a';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${p.second}s`, x - 6, h - 4);
      }
    });
  }, [analytics]);

  const jumpToDropOff = (sec: number) => {
    seek(sec);
    setActiveTab('editor');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Project Analytics & Audience Engagement Metrics
            </h2>
            <p className="text-xs text-zinc-400">
              Second-by-second retention curve, drop-off diagnostics, and viral prediction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
            <Zap className="w-3.5 h-3.5" /> Viral Score: {analytics.viralScore}/100
          </span>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-zinc-300">
        {/* Top Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] block">Total Views (Estimated)</span>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1">
              {analytics.views.toLocaleString()}
              <span className="text-[10px] text-emerald-400 font-semibold">+18.2%</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Cross-platform aggregate</span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] block">Avg Viewer Retention</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 flex items-baseline gap-1">
              {analytics.avgRetentionPct.toFixed(1)}%
              <span className="text-[10px] text-emerald-400 font-semibold">Top 5%</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Benchmark: 55% average</span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] block">Hook Strength (First 3s)</span>
            <div className="text-xl font-bold text-blue-400 mt-1 flex items-baseline gap-1">
              {analytics.hookStrengthScore}/100
              <span className="text-[10px] text-blue-400 font-semibold">Excellent</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">94% stay past 3 seconds</span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] block">Predicted Click-Through</span>
            <div className="text-xl font-bold text-purple-400 mt-1 flex items-baseline gap-1">
              {analytics.predictedCTR}%
              <span className="text-[10px] text-purple-400 font-semibold">High CTR</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Based on thumbnail & hook</span>
          </div>
        </div>

        {/* Audience Retention Graph */}
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Second-by-Second Audience Retention Curve
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              Retention target: 70%+ at end of video
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={840}
            height={180}
            className="w-full h-44 rounded-lg bg-zinc-950 border border-zinc-800 shadow-inner"
          />
        </div>

        {/* Drop-off Feedback Loop Alerts */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-zinc-300 block">
            AI Drop-Off Diagnostics & Feedback Loop Actions:
          </label>
          <div className="space-y-2">
            {analytics.dropOffPoints.map((drop, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-200 font-bold">{drop.time}s</span>
                      <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-1.5 py-0.2 rounded">
                        {drop.severity} severity
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{drop.reason}</p>
                  </div>
                </div>

                <button
                  onClick={() => jumpToDropOff(drop.time)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center gap-1 transition shrink-0"
                >
                  Jump to {drop.time}s & Fix
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Sentiment */}
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-white block">Audience Sentiment Analysis:</span>
              <span className="text-[11px] text-zinc-400">
                88% Positive reaction to pacing and audio clarity
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400 font-bold">{analytics.feedbackSentiment.positive}% Positive</span>
            <span className="text-zinc-400">{analytics.feedbackSentiment.neutral}% Neutral</span>
            <span className="text-red-400">{analytics.feedbackSentiment.negative}% Critique</span>
          </div>
        </div>
      </div>
    </div>
  );
};
