import { ROADMAP_PHASES, ROADMAP_VISION } from "@/lib/roadmap";

const statusStyles = {
  current: {
    dot: "bg-indigo-600 ring-indigo-100",
    card: "border-indigo-200 bg-indigo-50/50",
    badge: "bg-indigo-600 text-white",
  },
  upcoming: {
    dot: "bg-zinc-300 ring-zinc-100",
    card: "border-zinc-200 bg-white",
    badge: "bg-zinc-100 text-zinc-600",
  },
} as const;

export function RoadmapSection() {
  return (
    <section id="roadmap" className="mt-24 scroll-mt-24">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
          Roadmap
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          From hackathon to startup
        </h2>
        <p className="mt-4 text-lg leading-8 text-zinc-600">{ROADMAP_VISION}</p>
      </div>

      <div className="relative mt-12">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-200 sm:left-[15px]"
          aria-hidden
        />

        <ol className="space-y-8">
          {ROADMAP_PHASES.map((phase) => {
            const styles = statusStyles[phase.status];
            return (
              <li key={phase.id} className="relative pl-10 sm:pl-12">
                <span
                  className={`absolute left-0 top-6 h-[22px] w-[22px] rounded-full ring-4 sm:h-[30px] sm:w-[30px] ${styles.dot}`}
                  aria-hidden
                />

                <article
                  className={`rounded-2xl border p-6 shadow-sm ${styles.card}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {phase.label}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
                    >
                      {phase.timeframe}
                    </span>
                    {phase.status === "current" && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-zinc-700">{phase.goal}</p>

                  <ul className="mt-4 space-y-2">
                    {phase.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-zinc-600"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {phase.footer && (
                    <p className="mt-4 border-t border-zinc-200/80 pt-4 text-sm text-zinc-500">
                      {phase.footer}
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
