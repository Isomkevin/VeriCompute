const problems = [
  {
    title: "Model swapping",
    description: "Providers can run a cheaper model and charge for the premium one you agreed on.",
  },
  {
    title: "Input tampering",
    description: "Your data might never reach the model — stale, wrong, or fabricated inputs go unnoticed.",
  },
  {
    title: "Trust-based payment",
    description: "Payment happens regardless of whether the work was done as specified.",
  },
] as const;

const solutions = [
  {
    title: "Cryptographic receipts",
    description: "RISC Zero proves this exact program, on this exact input hash, produced this output hash.",
    accent: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    title: "On-chain verification",
    description: "Soroban Groth16 verifier checks the proof trustlessly — no oracle, no human in the loop.",
    accent: "from-violet-500/20 to-violet-500/5",
  },
  {
    title: "Conditional escrow",
    description: "Funds release only when verification succeeds. No proof, no payment — automatically.",
    accent: "from-cyan-500/20 to-cyan-500/5",
  },
] as const;

export function ProblemSolutionSection() {
  return (
    <section className="section-reveal py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
            The trust gap
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            AI compute has no accountability layer
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            When you pay for inference today, you have to trust the provider.
            VeriCompute replaces trust with math.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Problem */}
          <div className="glass-card rounded-2xl p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                ✕
              </span>
              <h3 className="text-xl font-semibold text-white">Without verification</h3>
            </div>
            <ul className="space-y-5">
              {problems.map((p) => (
                <li key={p.title} className="border-l-2 border-red-500/30 pl-4">
                  <p className="font-medium text-zinc-200">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{p.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="glass-card rounded-2xl p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                ✓
              </span>
              <h3 className="text-xl font-semibold text-white">With VeriCompute</h3>
            </div>
            <ul className="space-y-5">
              {solutions.map((s) => (
                <li
                  key={s.title}
                  className={`rounded-xl bg-gradient-to-r ${s.accent} border border-white/[0.06] p-4`}
                >
                  <p className="font-medium text-zinc-100">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
