import { ROADMAP_PHASES, ROADMAP_VISION } from "@/lib/roadmap";

const statusStyles = {
  current: {
    dot: "bg-indigo-500 ring-indigo-500/20",
    card: "border-indigo-500/25 bg-indigo-500/[0.08]",
    badge: "bg-indigo-500/20 text-indigo-300",
  },
  upcoming: {
    dot: "bg-zinc-600 ring-zinc-600/20",
    card: "border-white/[0.08] bg-white/[0.02]",
    badge: "bg-white/[0.06] text-zinc-400",
  },
} as const;

export function RoadmapSection() {
  return (
    <section id="roadmap" className="section-reveal scroll-mt-24 py-24 sm:py-32">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
          Roadmap
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          From hackathon to startup
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">{ROADMAP_VISION}</p>
      </div>

      <div className="relative mt-12">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10 sm:left-[15px]"
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
                  className={`glass-card rounded-2xl p-6 ${styles.card}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {phase.label}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
                    >
                      {phase.timeframe}
                    </span>
                    {phase.status === "current" && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-zinc-400">{phase.goal}</p>

                  <ul className="mt-4 space-y-2">
                    {phase.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm text-zinc-500"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {phase.footer && (
                    <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm text-zinc-600">
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
