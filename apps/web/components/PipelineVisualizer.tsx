"use client";

import type { PipelineStep } from "@/lib/types";

interface PipelineVisualizerProps {
  steps: PipelineStep[];
  elapsedSeconds?: number;
}

const statusStyles: Record<PipelineStep["status"], string> = {
  pending: "border-zinc-200 bg-white text-zinc-500",
  active: "border-indigo-300 bg-indigo-50 text-indigo-900",
  done: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

export function PipelineVisualizer({ steps, elapsedSeconds }: PipelineVisualizerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pipeline</h2>
        {elapsedSeconds !== undefined && (
          <span className="text-sm text-zinc-500">{elapsedSeconds}s elapsed</span>
        )}
      </div>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`rounded-xl border px-4 py-3 ${statusStyles[step.status]}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{step.label}</p>
                <p className="text-sm opacity-80">{step.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
