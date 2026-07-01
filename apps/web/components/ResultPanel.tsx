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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-2">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold">Error</h2>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500">
        <div className="flex justify-center mb-4">
          <svg className="h-12 w-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm">Run the demo to see score, verification, and settlement results here.</p>
      </div>
    );
  }

  const isSuccess = result.verified && result.outcome === "ThresholdMet";

  return (
    <div className={`space-y-6 rounded-2xl border p-6 shadow-sm transition-all duration-500 animate-in zoom-in-95 ${
      isSuccess ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200 bg-white"
    }`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Result Summary</h2>
        {isSuccess && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Success
          </span>
        )}
      </div>

      <dl className="grid gap-6 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-zinc-500">Risk Score</dt>
          <dd className={`text-4xl font-bold ${result.score >= 600 ? "text-emerald-600" : "text-red-600"}`}>
            {result.score}
          </dd>
          <dd className="text-xs text-zinc-400">Out of 1000</dd>
        </div>

        <div className="space-y-1">
          <dt className="text-zinc-500">On-chain Verification</dt>
          <dd className="flex items-center gap-2 text-lg font-medium">
            {result.verified ? (
              <>
                <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </>
            ) : (
              <>
                <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Not verified
              </>
            )}
          </dd>
          <dd className="text-xs text-zinc-400">RISC Zero proof check</dd>
        </div>

        {result.outcome && (
          <div className="sm:col-span-2 rounded-xl bg-white/50 p-4 border border-zinc-100">
            <dt className="text-zinc-500 mb-1">Settlement Outcome</dt>
            <dd className="text-base font-medium">
              {result.outcome === "ThresholdMet"
                ? "✅ Loan disbursed to borrower"
                : "❌ Loan returned to lender (provider still paid)"}
            </dd>
          </div>
        )}
      </dl>

      {result.txHash && (
        <div className="pt-4 border-t border-zinc-100">
          <a
            href={stellarExpertTxUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Stellar Expert
          </a>
        </div>
      )}
    </div>
  );
}