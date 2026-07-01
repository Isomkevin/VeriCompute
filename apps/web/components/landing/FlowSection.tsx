const steps = [
  {
    num: "01",
    title: "Specify the task",
    description:
      "Requester defines a deterministic program (the model) and input. Credit scoring is one instance — any swappable guest program works.",
    tag: "Requester",
  },
  {
    num: "02",
    title: "Prove in the zkVM",
    description:
      "Provider runs the exact program inside RISC Zero. The zkVM produces output plus a Groth16 receipt binding input hash, output hash, and image ID.",
    tag: "Provider",
  },
  {
    num: "03",
    title: "Verify on-chain",
    description:
      "The receipt is submitted to a Soroban Groth16 verifier contract. Verification is trustless — the chain checks the math, not a third party.",
    tag: "Verifier",
  },
  {
    num: "04",
    title: "Settle conditionally",
    description:
      "Escrow releases provider fees and conditional payouts (e.g., loan disbursement) only when verification succeeds and business rules pass.",
    tag: "Escrow",
  },
] as const;

export function FlowSection() {
  return (
    <section id="how-it-works" className="section-reveal scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
            Protocol flow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Four steps from input to settlement
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            A general pipeline for any deterministic computation — not just credit scoring.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {steps.map((step) => (
            <article
              key={step.num}
              className="group glass-card rounded-2xl p-8 transition-colors hover:border-indigo-500/20 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-3xl font-bold text-gradient-accent opacity-60">
                  {step.num}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400">
                  {step.tag}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-zinc-400">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
