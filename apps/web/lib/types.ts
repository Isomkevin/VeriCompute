export interface ScoringInput {
  annual_income: number;
  total_debt: number;
  months_on_time_payments: number;
  credit_utilization_pct: number;
}

export interface ProofResult {
  seal: string;
  image_id: string;
  journal_digest: string;
  journal_hex: string;
  score: number;
}

export type PipelineStepId =
  | "input"
  | "hashing"
  | "proving"
  | "proof"
  | "submitting"
  | "verifying"
  | "settlement";

export type PipelineStepStatus = "pending" | "active" | "done" | "error";

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
  description: string;
  status: PipelineStepStatus;
}

export type SettlementOutcome = "ThresholdMet" | "ThresholdNotMet";

export interface DemoResult {
  score: number;
  verified: boolean;
  outcome?: SettlementOutcome;
  txHash?: string;
}
