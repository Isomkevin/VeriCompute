import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-semibold">
          VeriCompute
        </Link>
        <Link href="/demo" className="text-sm font-medium text-indigo-600">
          Demo
        </Link>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 pb-20">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight">How VeriCompute works</h1>
          <p className="mt-4 text-lg text-zinc-600">
            A general protocol for verifiable compute and conditional payment. Credit scoring is
            one instance — the guest program is swappable behind the same proof → verify → settle
            flow.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 font-mono text-sm leading-7">
          <pre>{`Borrower / UI
   │
   ▼
zk/host (Groth16 prove) ──► seal + journal_digest + image_id
   │
   ▼
LoanEscrow.submit_proof_and_settle
   │
   ├─► Groth16Verifier.verify(seal, image_id, journal_digest)
   └─► payout: provider fee + conditional loan release`}</pre>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What is real vs simplified</h2>
          <ul className="list-disc space-y-2 pl-5 text-zinc-700">
            <li>Real: RISC Zero proof generation, Groth16 seal encoding, Soroban verification.</li>
            <li>Real: Escrow holds funds and settles based on verified score vs threshold.</li>
            <li>Simplified: Synthetic applicant data and a small rules-based score — not an LLM.</li>
            <li>Simplified: Local/WSL proving for the hackathon; optional remote prover via CI.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
