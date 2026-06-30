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
    <div className="min-h-screen bg-zinc-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-semibold">
          VeriCompute
        </Link>
        <WalletConnect />
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-2">
        <div className="space-y-6">
          {notConfigured && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>NOT CONFIGURED:</strong> Set contract IDs in <code>.env.local</code> after
              deploying to testnet (run <code>./scripts/sync-env-from-deployments.sh</code>).
              Proving still works; settlement is disabled until configured.
            </div>
          )}
          {CONTRACTS_CONFIGURED && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
              <strong>Before settlement:</strong> Escrow must be initialized with your guest{" "}
              <code>image_id</code> (<code>./scripts/init-escrow.sh</code>) and your wallet needs
              SAC XLM balance (<code>./scripts/fund-sac.sh</code>).
            </div>
          )}
          <ScoringForm onSubmit={runDemo} disabled={busy} />
        </div>
        <div className="space-y-6">
          <PipelineVisualizer steps={steps} elapsedSeconds={elapsed} />
          <ResultPanel result={result} error={error} />
        </div>
      </main>
    </div>
  );
}
