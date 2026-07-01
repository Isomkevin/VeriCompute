import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
            V
          </span>
          <span className="text-sm font-medium text-zinc-400">
            VeriCompute — verifiable compute on Stellar
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <Link href="/demo" className="transition-colors hover:text-zinc-300">
            Demo
          </Link>
          <Link href="/how-it-works" className="transition-colors hover:text-zinc-300">
            Architecture
          </Link>
          <Link href="#roadmap" className="transition-colors hover:text-zinc-300">
            Roadmap
          </Link>
          <a
            href="https://developers.stellar.org/docs/build/apps/zk"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-300"
          >
            Stellar ZK docs
          </a>
        </nav>

        <p className="text-xs text-zinc-600">Testnet only · Hackathon build</p>
      </div>
    </footer>
  );
}
