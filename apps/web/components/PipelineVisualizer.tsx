"use client";

import type { PipelineStep } from "@/lib/types";

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  elapsedSeconds?: number;
}

const statusStyles: Record<PipelineStep["status"], string> = {
  pending: "border-white/10 bg-white/[0.02] text-zinc-500",
  active: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
};

const statusIcons: Record<PipelineStep["status"], React.ReactNode> = {
  pending: (
    <svg className="h-5 w-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  ),
  active: (
    <svg className="h-5 w-5 animate-spin text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M12 2v4m0 16v4M5 12a7 7 0 0114 0" />
    </svg>
  ),
  done: (
    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export function PipelineVisualizer({ steps, elapsedSeconds }: PipelineVisualizerProps) {
  const completedCount = steps.filter((s) => s.status === "done").length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="forge-card rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="font-mono text-sm uppercase tracking-widest text-zinc-400">
            Verification Forge
          </h2>
        </div>
        {elapsedSeconds !== undefined && (
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-500">{elapsedSeconds}s elapsed</span>
            <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full forge-progress transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`rounded-xl border px-4 py-3 transition-all duration-300 ${statusStyles[step.status]} ${
              step.status === "active" ? "scale-[1.02] shadow-lg" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                step.status === "done" ? "bg-emerald-500/20" :
                step.status === "active" ? "bg-indigo-500/20" : "bg-white/5"
              }`}>
                {statusIcons[step.status]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{step.label}</p>
                  {step.status === "active" && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 animate-forge-pulse">
                      Forging
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-70">{step.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}