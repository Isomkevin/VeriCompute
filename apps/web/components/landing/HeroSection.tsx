import Link from "next/link";

const pipelineSteps = [
  { label: "Input", sub: "Task + data", icon: "→" },
  { label: "RISC Zero", sub: "zkVM prove", icon: "⚡" },
  { label: "Groth16", sub: "Receipt", icon: "✓" },
  { label: "Soroban", sub: "Verify", icon: "⛓" },
  { label: "Escrow", sub: "Settle", icon: "$" },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Ambient glow */}
      <div
        className="glow-orb -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 bg-indigo-600/20"
        aria-hidden
      />
      <div
        className="glow-orb top-40 -right-32 h-[300px] w-[400px] bg-violet-600/15"
        aria-hidden
      />
      <div
        className="glow-orb top-60 -left-32 h-[250px] w-[350px] bg-cyan-600/10"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-zinc-300">Stellar Hacks — Real-World ZK</span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gradient">Pay for compute.</span>
            <br />
            <span className="text-white">Only if it&apos;s proven.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Verifiable deterministic compute with conditional settlement on Stellar.
            Cryptographic receipts from RISC Zero, on-chain verification on Soroban,
            escrow that releases payment only when the proof checks out.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white"
            >
              Run the live demo
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-base font-semibold text-zinc-200 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.08]"
            >
              Read the architecture
            </Link>
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            Testnet only · No mocked verification results
          </p>
        </div>

        {/* Pipeline visual */}
        <div className="mx-auto mt-20 max-w-4xl animate-float">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                Proof → Verify → Settle
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-400">
                end-to-end
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {pipelineSteps.map((step, i) => (
                <div key={step.label} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2">
                  <div
                    className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 sm:h-20 ${
                      i === 1 ? "border-indigo-500/30 bg-indigo-500/10 animate-flow-pulse" : ""
                    }`}
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <span className="mt-1 text-sm font-semibold text-white">{step.label}</span>
                    <span className="text-xs text-zinc-500">{step.sub}</span>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <svg
                      className="hidden h-4 w-4 shrink-0 text-zinc-600 sm:block"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/30 p-4 font-mono text-xs leading-relaxed text-zinc-400">
              <span className="text-indigo-400">receipt</span>
              {" · seal + journal_digest + image_id → "}
              <span className="text-violet-400">Groth16Verifier.verify()</span>
              {" → "}
              <span className="text-emerald-400">LoanEscrow.submit_proof_and_settle()</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
