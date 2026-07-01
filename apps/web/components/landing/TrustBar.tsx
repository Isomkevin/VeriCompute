const partners = [
  { name: "Stellar", detail: "Soroban smart contracts" },
  { name: "RISC Zero", detail: "zkVM + Groth16 proofs" },
  { name: "Soroban", detail: "On-chain verification" },
  { name: "Testnet", detail: "Real transactions" },
] as const;

export function TrustBar() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.02] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
          Built on production-grade infrastructure
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {partners.map((p) => (
            <div key={p.name} className="text-center">
              <p className="text-lg font-semibold text-zinc-200">{p.name}</p>
              <p className="mt-1 text-sm text-zinc-500">{p.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
