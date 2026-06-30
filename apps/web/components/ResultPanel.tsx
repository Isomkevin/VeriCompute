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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-zinc-500">
        Run the demo to see score, verification, and settlement results here.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Result</h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Score</dt>
          <dd className="text-2xl font-semibold">{result.score}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">On-chain verification</dt>
          <dd className="font-medium">{result.verified ? "Verified" : "Not verified"}</dd>
        </div>
        {result.outcome && (
          <div>
            <dt className="text-zinc-500">Settlement</dt>
            <dd className="font-medium">
              {result.outcome === "ThresholdMet"
                ? "Loan disbursed to borrower"
                : "Loan returned to lender (provider still paid)"}
            </dd>
          </div>
        )}
      </dl>
      {result.txHash && (
        <a
          href={stellarExpertTxUrl(result.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View transaction on Stellar Expert (testnet)
        </a>
      )}
    </div>
  );
}
