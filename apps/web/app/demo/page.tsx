"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";
import { ResultPanel } from "@/components/ResultPanel";
import { ScoringForm } from "@/components/ScoringForm";
import {
  getConnectedAddress,
  signTransactionXdr,
  WalletConnect,
} from "@/components/WalletConnect";
import {
  buildCreateRequestTx,
  buildSubmitProofTx,
  submitSignedTransaction,
  waitForTransaction,
} from "@/lib/contracts";
import { proveScoringInput } from "@/lib/prover-client";
import { CONTRACTS_CONFIGURED } from "@/lib/stellar";
import type {
  DemoResult,
  PipelineStep,
  ScoringInput,
} from "@/lib/types";
import { scValToNative } from "@stellar/stellar-sdk";

const INITIAL_STEPS: PipelineStep[] = [
  {
    id: "input",
    label: "Submit input",
    description: "Serialize synthetic applicant data for the guest program.",
    status: "pending",
  },
  {
    id: "proving",
    label: "Prove in RISC Zero",
    description: "Run the scoring guest in the zkVM and generate a Groth16 receipt.",
    status: "pending",
  },
  {
    id: "proof",
    label: "Proof generated",
    description: "Seal, image ID, and journal digest are ready for chain submission.",
    status: "pending",
  },
  {
    id: "submitting",
    label: "Submit to Soroban",
    description: "Sign and send submit_proof_and_settle on Stellar testnet.",
    status: "pending",
  },
  {
    id: "verifying",
    label: "On-chain verification",
    description: "Escrow calls the Groth16 verifier contract.",
    status: "pending",
  },
  {
    id: "settlement",
    label: "Settlement",
    description: "Provider fee and conditional loan disbursement.",
    status: "pending",
  },
];

function setStepStatus(
  steps: PipelineStep[],
  id: PipelineStep["id"],
  status: PipelineStep["status"],
): PipelineStep[] {
  return steps.map((step) => (step.id === id ? { ...step, status } : step));
}

export default function DemoPage() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState<number>();
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notConfigured = useMemo(() => !CONTRACTS_CONFIGURED, []);

  const runDemo = useCallback(async (input: ScoringInput) => {
    setBusy(true);
    setError(null);
    setResult(null);
    let current = INITIAL_STEPS.map((s) =>
      s.id === "input" ? { ...s, status: "active" as const } : s,
    );
    setSteps(current);
    const started = Date.now();

    try {
      current = setStepStatus(current, "input", "done");
      current = setStepStatus(current, "proving", "active");
      setSteps([...current]);

      const proof = await proveScoringInput(input);
      setElapsed(Math.round((Date.now() - started) / 1000));

      current = setStepStatus(current, "proving", "done");
      current = setStepStatus(current, "proof", "done");
      setSteps([...current]);

      if (notConfigured) {
        setResult({ score: proof.score, verified: false });
        setError(
          "Contracts are not configured. Proving succeeded locally, but on-chain verification requires NEXT_PUBLIC_*_CONTRACT_ID env vars.",
        );
        return;
      }

      const address = await getConnectedAddress();
      current = setStepStatus(current, "submitting", "active");
      setSteps([...current]);

      const createXdr = await buildCreateRequestTx({
        source: address,
        lender: address,
        borrower: address,
        provider: address,
        amount: BigInt(10_000_000),
        providerFee: BigInt(100_000),
        scoreThreshold: 600,
      });
      const signedCreate = await signTransactionXdr(createXdr);
      const createHash = await submitSignedTransaction(signedCreate);
      const createTx = await waitForTransaction(createHash);

      let requestId = BigInt(1);
      if (createTx.status === "SUCCESS" && createTx.returnValue) {
        const native = scValToNative(createTx.returnValue);
        if (typeof native === "bigint") requestId = native;
        if (typeof native === "number") requestId = BigInt(native);
      }

      const submitXdr = await buildSubmitProofTx({
        source: address,
        requestId,
        proof,
      });
      const signedSubmit = await signTransactionXdr(submitXdr);
      const submitHash = await submitSignedTransaction(signedSubmit);

      current = setStepStatus(current, "submitting", "done");
      current = setStepStatus(current, "verifying", "active");
      setSteps([...current]);

      const submitTx = await waitForTransaction(submitHash);
      const verified = submitTx.status === "SUCCESS";

      current = setStepStatus(current, "verifying", verified ? "done" : "error");
      current = setStepStatus(current, "settlement", verified ? "done" : "error");
      setSteps([...current]);

      setResult({
        score: proof.score,
        verified,
        outcome: proof.score >= 600 ? "ThresholdMet" : "ThresholdNotMet",
        txHash: submitHash,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "demo failed");
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step,
        ),
      );
    } finally {
      setBusy(false);
      setElapsed(Math.round((Date.now() - started) / 1000));
    }
  }, [notConfigured]);

  return (
    <div className="relative min-h-screen bg-black/90 text-zinc-100">
      {/* Ambient glow background */}
      <div
        className="glow-orb -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 bg-indigo-600/20"
        aria-hidden
      />
      <div
        className="glow-orb top-40 -right-32 h-[300px] w-[400px] bg-violet-600/15"
        aria-hidden
      />
      <div
        className="glow-orb top-60 -left-32 h-[250px] w-[350px] bg-cyan-600/10"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gradient">
            VeriCompute
          </Link>
          <WalletConnect />
        </header>

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-zinc-300">Live Demo — Testnet</span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Verified Credit Scoring</span>
            <br />
            <span className="text-white">On-chain Settlement</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Submit synthetic applicant data, generate a zero-knowledge proof, and settle on Stellar.
            No proof, no payment.
          </p>
        </div>

        {/* Config warnings */}
        <div className="mb-8 space-y-4">
          {notConfigured && (
            <div className="rounded-xl border border-amber-300 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <strong>NOT CONFIGURED:</strong> Set contract IDs in{" "}
              <code>.env.local</code> after deploying to testnet. Proving still works locally.
            </div>
          )}
          {CONTRACTS_CONFIGURED && (
            <div className="rounded-xl border border-sky-300 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
              <strong>Before settlement:</strong> Escrow must be initialized with your guest{" "}
              <code>image_id</code> and your wallet needs SAC XLM balance.
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <main className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Left Column: Form & Pipeline */}
          <div className="space-y-8">
            <div className="section-reveal">
              <ScoringForm onSubmit={runDemo} disabled={busy} />
            </div>

            <div className="section-reveal">
              <PipelineVisualizer steps={steps} elapsedSeconds={elapsed} />
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="section-reveal">
            <ResultPanel result={result} error={error} />
          </div>
        </main>

        {/* Pipeline Visual Footer */}
        <div className="mx-auto mt-20 max-w-4xl animate-float">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                Proof → Verify → Settle
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-400">
                end-to-end
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {[
                { label: "Input", sub: "Task + data", icon: "→" },
                { label: "RISC Zero", sub: "zkVM prove", icon: "⚡" },
                { label: "Groth16", sub: "Receipt", icon: "✓" },
                { label: "Soroban", sub: "Verify", icon: "⛓" },
                { label: "Escrow", sub: "Settle", icon: "$" },
              ].map((step, i) => (
                <div key={step.label} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2">
                  <div
                    className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 sm:h-20 ${
                      i === 1 ? "border-indigo-500/30 bg-indigo-500/10 animate-flow-pulse" : ""
                    }`}
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <span className="mt-1 text-sm font-semibold text-white">{step.label}</span>
                    <span className="text-xs text-zinc-500">{step.sub}</span>
                  </div>
                  {i < 4 && (
                    <svg
                      className="hidden h-4 w-4 shrink-0 text-zinc-600 sm:block"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-white/[0.06] bg-black/30 p-4 font-mono text-xs leading-relaxed text-zinc-400">
              <span className="text-indigo-400">receipt</span>
              {" · seal + journal_digest + image_id → "}
              <span className="text-violet-400">Groth16Verifier.verify()</span>
              {" → "}
              <span className="text-emerald-400">LoanEscrow.submit_proof_and_settle()</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}