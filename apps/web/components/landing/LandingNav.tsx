import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#roadmap", label: "Roadmap" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060608]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
            V
          </span>
          <span className="text-lg font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
            VeriCompute
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Architecture
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:inline"
          >
            Demo
          </Link>
          <WalletConnect variant="dark" />
        </div>
      </div>
    </header>
  );
}
