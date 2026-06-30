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
      className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(input);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Applicant data</h2>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
          Synthetic data
        </span>
      </div>
      <p className="text-sm text-zinc-600">
        Demo-only fields for a deterministic rules-based score inside the zkVM — not real credit
        bureau data and not an LLM.
      </p>

      <label className="block text-sm">
        Annual income (USD)
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={input.annual_income}
          disabled={disabled}
          onChange={(e) =>
            setInput((prev) => ({ ...prev, annual_income: Number(e.target.value) }))
          }
        />
      </label>

      <label className="block text-sm">
        Total debt (USD)
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={input.total_debt}
          disabled={disabled}
          onChange={(e) =>
            setInput((prev) => ({ ...prev, total_debt: Number(e.target.value) }))
          }
        />
      </label>

      <label className="block text-sm">
        Months of on-time payments
        <input
          type="number"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={input.months_on_time_payments}
          disabled={disabled}
          onChange={(e) =>
            setInput((prev) => ({
              ...prev,
              months_on_time_payments: Number(e.target.value),
            }))
          }
        />
      </label>

      <label className="block text-sm">
        Credit utilization (%)
        <input
          type="number"
          min={0}
          max={100}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={input.credit_utilization_pct}
          disabled={disabled}
          onChange={(e) =>
            setInput((prev) => ({
              ...prev,
              credit_utilization_pct: Number(e.target.value),
            }))
          }
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Request verified score
      </button>
    </form>
  );
}
