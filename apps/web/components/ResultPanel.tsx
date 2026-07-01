"use client";

import { stellarExpertTxUrl } from "@/lib/stellar";
import type { DemoResult } from "@/lib/types";

interface ResultPanelProps {
  result: DemoResult | null;
  error?: string | null;
}

export function ResultPanel({ result, error }: ResultPanelProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-2">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold">Forge Error</h2>
        </div>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-zinc-500 glass-card">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.03]">
            <svg className="h-8 w-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <p className="text-sm">
          Prepare applicant data and heat the forge to generate a verified score.
        </p>
      </div>
    );
  }

  const isSuccess = result.verified && result.outcome === "ThresholdMet";

  return (
    <div className={`space-y-6 rounded-2xl border p-6 transition-all duration-500 animate-in zoom-in-95 forge-card ${
      isSuccess ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/5"
    }`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Forge Outcome</h2>
        {isSuccess && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30 animate-chain-wiggle">
            Verified & Settled
          </span>
        )}
      </div>

      <dl className="grid gap-6 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Verified Score</dt>
          <dd className={`text-4xl font-bold ${result.score >= 600 ? "text-emerald-400" : "text-red-400"}`}>
            {result.score}
          </dd>
          <dd className="text-xs text-zinc-500">Deterministic ZK-Proof</dd>
        </div>

        <div className="space-y-1">
          <dt className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Chain Status</dt>
          <dd className="flex items-center gap-2 text-lg font-medium text-white">
            {result.verified ? (
              <>
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </>
            ) : (
              <>
                <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Unverified
              </>
            )}
          </dd>
          <dd className="text-xs text-zinc-500">Soroban Groth16 Verifier</dd>
        </div>

        {result.outcome && (
          <div className="sm:col-span-2 rounded-xl bg-white/[0.03] p-4 border border-white/10">
            <dt className="text-zinc-500 font-mono text-xs uppercase tracking-wider mb-2">Settlement Action</dt>
            <dd className="text-base font-medium text-zinc-200">
              {result.outcome === "ThresholdMet"
                ? "✅ Funds disbursed from escrow to borrower"
                : "❌ Funds returned to lender (provider fee processed)"}
            </dd>
          </div>
        )}
      </dl>

      {result.txHash && (
        <div className="pt-4 border-t border-white/10">
          <a
            href={stellarExpertTxUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Inspect on Stellar Explorer
          </a>
        </div>
      )}
    </div>
  );
}