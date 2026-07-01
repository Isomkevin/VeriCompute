"use client";

import type { PipelineStep } from "@/lib/types";

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  elapsedSeconds?: number;
}

const statusStyles: Record<PipelineStep["status"], string> = {
  pending: "border-white/[0.08] bg-white/[0.03] text-zinc-500",
  active: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/20",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function PipelineVisualizer({ steps, elapsedSeconds }: PipelineVisualizerProps) {
  const completedCount = steps.filter((s) => s.status === "done").length;
  const activeStep = steps.find((s) => s.status === "active");
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-zinc-400">
          Pipeline Status
        </h2>
        {elapsedSeconds !== undefined && (
          <div className="text-right">
            <span className="text-xs text-zinc-500">{elapsedSeconds}s elapsed</span>
            <div className="w-32 h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`rounded-xl border px-4 py-3 transition-all duration-300 ${statusStyles[step.status]}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-mono transition-all duration-300 ${
                  step.status === "done"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : step.status === "active"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : step.status === "error"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/[0.06] text-zinc-500"
                }`}
              >
                {step.status === "done" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === "active" ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeWidth="2" d="M12 2v4m0 16v4M5 12a7 7 0 0114 0" />
                  </svg>
                ) : step.status === "error" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>

              <div className="flex-1">
                <p className="font-medium text-sm">{step.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
              </div>

              {step.status === "active" && (
                <span className="text-xs font-mono text-indigo-400 animate-pulse">
                  active
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}