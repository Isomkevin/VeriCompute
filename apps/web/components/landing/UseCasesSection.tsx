const useCases = [
  {
    title: "Credit & risk scoring",
    description:
      "Flagship demo: borrower data scored inside the zkVM, proof verified on-chain, loan disburses only if score meets threshold.",
    status: "Live demo",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "📊",
  },
  {
    title: "Fraud detection",
    description:
      "Run deterministic fraud rules on transaction data. Prove the exact model and input were used before releasing insurance payouts.",
    status: "Pluggable guest",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    icon: "🛡",
  },
  {
    title: "Eligibility checks",
    description:
      "Verify compliance or KYC logic ran correctly on applicant data before granting access to regulated products.",
    status: "Pluggable guest",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    icon: "✅",
  },
  {
    title: "Content moderation",
    description:
      "Prove a specific moderation policy was applied to content before payment or platform actions execute.",
    status: "Pluggable guest",
    statusColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    icon: "🔍",
  },
] as const;

export function UseCasesSection() {
  return (
    <section id="use-cases" className="section-reveal scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
            General protocol
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One flow, many compute tasks
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            The guest program is swappable behind the same proof → verify → settle pipeline.
            Credit scoring is the compelling demo — not the ceiling.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {useCases.map((uc) => (
            <article
              key={uc.title}
              className="glass-card group rounded-2xl p-8 transition-all hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-3xl" role="img" aria-hidden>
                  {uc.icon}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${uc.statusColor}`}
                >
                  {uc.status}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{uc.title}</h3>
              <p className="mt-3 leading-relaxed text-zinc-400">{uc.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
