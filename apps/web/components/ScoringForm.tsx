"use client";

import { useState } from "react";
import type { ScoringInput } from "@/lib/types";

const DEFAULT: ScoringInput = {
  annual_income: 80_000,
  total_debt: 10_000,
  months_on_time_payments: 36,
  credit_utilization_pct: 20,
};

interface ScoringFormProps {
  onSubmit: (input: ScoringInput) => void;
  disabled?: boolean;
}

export function ScoringForm({ onSubmit, disabled }: ScoringFormProps) {
  const [input, setInput] = useState<ScoringInput>(DEFAULT);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(input);
      }}
      className={`space-y-4 rounded-2xl border transition-all duration-300 ${
        disabled
          ? "border-zinc-300 bg-zinc-100 opacity-50"
          : "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
      } p-6`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Applicant Data</h2>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
          Demo Data
        </span>
      </div>

      <p className="text-sm text-zinc-600">
        Synthetic inputs for deterministic scoring in the zkVM. Not real credit data.
      </p>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="flex items-center gap-2">
            Annual income (USD)
            <span className="text-zinc-400 text-xs">(higher = better)</span>
          </span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={input.annual_income}
            disabled={disabled}
            onChange={(e) =>
              setInput((prev) => ({ ...prev, annual_income: Number(e.target.value) }))
            }
          />
        </label>

        <label className="block text-sm">
          <span className="flex items-center gap-2">
            Total debt (USD)
            <span className="text-zinc-400 text-xs">(lower = better)</span>
          </span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={input.total_debt}
            disabled={disabled}
            onChange={(e) =>
              setInput((prev) => ({ ...prev, total_debt: Number(e.target.value) }))
            }
          />
        </label>

        <label className="block text-sm">
          <span className="flex items-center gap-2">
            Months of on-time payments
            <span className="text-zinc-400 text-xs">(longer = better)</span>
          </span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 bg-white transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={input.months_on_time_payments}
            disabled={disabled}
            onChange={(e) =>
              setInput((prev) => ({ ...prev, months_on_time_payments: Number(e.target.value) }))
            }
          />
        </label>

        <label className="block text-sm">
          <span className="flex items-center gap-2">
            Credit utilization (%)
            <span className="text-zinc-400 text-xs">(lower = better)</span>
          </span>
          <div className="mt-1">
            <input
              type="range"
              min={0}
              max={100}
              className="w-full h-2 rounded-lg bg-zinc-200 accent-indigo-600"
              value={input.credit_utilization_pct}
              disabled={disabled}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, credit_utilization_pct: Number(e.target.value) }))
              }
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>0%</span>
              <span className="font-medium text-indigo-600">{input.credit_utilization_pct}%</span>
              <span>100%</span>
            </div>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className={`w-full rounded-xl px-4 py-3 font-medium transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed bg-zinc-300 text-zinc-500"
            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        }`}
      >
        {disabled ? "Processing..." : "Request Verified Score"}
      </button>
    </form>
  );
}