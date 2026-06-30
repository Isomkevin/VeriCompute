import type { ProofResult, ScoringInput } from "./types";

const PROVER_SERVICE_URL = process.env.PROVER_SERVICE_URL;
const PROVER_BINARY = process.env.PROVER_BINARY;

export async function proveScoringInput(
  input: ScoringInput,
): Promise<ProofResult> {
  if (PROVER_SERVICE_URL) {
    const res = await fetch(`${PROVER_SERVICE_URL}/prove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "remote prover failed");
    }
    return (await res.json()) as ProofResult;
  }

  const res = await fetch("/api/prove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "proving failed");
  }
  return (await res.json()) as ProofResult;
}

export function proverMode(): "remote" | "local" {
  return PROVER_SERVICE_URL ? "remote" : "local";
}

export function proverBinaryPath(): string | undefined {
  return PROVER_BINARY;
}
