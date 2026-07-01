/* Enhanced PipelineVisualizer with animations and better UX */

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

const statusIcons: Record<PipelineStep["status"], React.ReactNode> = {
  pending: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  ),
  active: (
    <svg className="h-6 w-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeWidth="2"
        d="M12 2v4m0 16v4M4.93 4.93l2.12 2.12m8.48 8.48L19.07 19.07M4.93 19.07l2.12-2.12m8.48-8.48L19.07 4.93M12 18a6 6 0 100-12 6 6 0 000 12z"
      />
    </svg>
  ),
  done: (
    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

export function PipelineVisualizer({ steps, elapsedSeconds }: PipelineVisualizerProps) {
  const completedCount = steps.filter((s) => s.status === "done").length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pipeline Progress</h2>
        {elapsedSeconds !== undefined && (
          <div className="text-right">
            <span className="text-sm text-zinc-500">{elapsedSeconds}s elapsed</span>
            <div className="w-24 h-1 bg-zinc-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
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
            className={`rounded-xl border px-4 py-3 ${statusStyles[step.status]} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  step.status === "done"
                    ? "bg-emerald-100 text-emerald-700"
                    : step.status === "active"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-white text-zinc-400"
                }`}
              >
                {step.status === "done" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === "active" ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeWidth="2"
                      d="M12 2v4m0 16v4M4.93 4.93l2.12 2.12m8.48 8.48L19.07 19.07M4.93 19.07l2.12-2.12m8.48-8.48L19.07 4.93M12 18a6 6 0 100-12 6 6 0 000 12z"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <div className="flex-1">
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