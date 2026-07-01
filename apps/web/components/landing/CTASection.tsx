import Link from "next/link";

export function CTASection() {
  return (
    <section className="section-reveal py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-violet-950/60 to-[#060608] p-10 sm:p-16">
          <div
            className="glow-orb -right-20 -top-20 h-[300px] w-[300px] bg-indigo-500/30"
            aria-hidden
          />
          <div
            className="glow-orb -bottom-20 -left-20 h-[250px] w-[250px] bg-violet-500/20"
            aria-hidden
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              See it work on Stellar testnet
            </h2>
            <p className="mt-4 text-lg text-zinc-300">
              Submit synthetic applicant data, watch the full pipeline — prove, verify, settle —
              and inspect the on-chain transaction yourself.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/demo"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white"
              >
                Launch the demo
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#roadmap"
                className="inline-flex items-center rounded-xl border border-white/15 px-8 py-4 text-base font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06]"
              >
                View roadmap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
