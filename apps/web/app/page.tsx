import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">VeriCompute</span>
        <WalletConnect />
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <section className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
            Stellar Hacks — Real-World ZK
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Pay for compute. Only pay if you can prove it ran correctly.
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-600">
            VeriCompute is a general protocol for verifiable deterministic compute with
            conditional settlement on Stellar. The flagship demo runs a rules-based credit score
            inside a RISC Zero zkVM, verifies the Groth16 receipt on Soroban, and releases escrow
            funds only when verification succeeds.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/demo"
              className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500"
            >
              Run the demo
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-zinc-300 px-5 py-3 font-medium hover:bg-zinc-50"
            >
              How it works
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
