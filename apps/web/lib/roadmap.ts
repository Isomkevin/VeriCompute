export type RoadmapPhaseStatus = "current" | "upcoming";

export interface RoadmapPhase {
  id: string;
  label: string;
  timeframe: string;
  goal: string;
  status: RoadmapPhaseStatus;
  highlights: string[];
  footer?: string;
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "phase-0",
    label: "Phase 0 — Hackathon",
    timeframe: "Now",
    goal: "Prove the trust model end-to-end on Stellar testnet.",
    status: "current",
    highlights: [
      "RISC Zero guest + Groth16 host",
      "Soroban verifier + LoanEscrow settlement",
      "Demo UI with honest synthetic data",
      "CLI scripts for prove → deploy → settle",
    ],
    footer: "Exit: reproducible proof, verification, and conditional payout — no mocked success.",
  },
  {
    id: "phase-1",
    label: "Phase 1 — Protocol",
    timeframe: "0–3 months",
    goal: "Turn the demo into infrastructure others can build on.",
    status: "upcoming",
    highlights: [
      "Contract audit + mainnet pilot (capped TVL, USDC)",
      "On-chain task registry for multiple guest programs",
      "Second guest (eligibility, fraud rules, etc.)",
      "Managed prover API with predictable latency",
    ],
    footer: "Business: protocol fee on settlement + hosted-prover subscriptions.",
  },
  {
    id: "phase-2",
    label: "Phase 2 — Product",
    timeframe: "3–9 months",
    goal: "Win one vertical where verifiable compute has clear ROI.",
    status: "upcoming",
    highlights: [
      "Verifiable underwriting for on-chain lending",
      "REST API + @vericompute/sdk for integrators",
      "Provider marketplace (fees, SLAs, reputation)",
      "Real input pipelines via committed input hashes",
    ],
    footer: "Wedge extends to invoice factoring, trade finance, and agentic “prove before pay” flows.",
  },
  {
    id: "phase-3",
    label: "Phase 3 — Platform",
    timeframe: "9–18 months",
    goal: "Default “verify compute, then pay” layer for Stellar fintech and AI agents.",
    status: "upcoming",
    highlights: [
      "Noir / UltraHonk private threshold proofs (score ≥ threshold)",
      "Composable escrow templates + multi-asset settlement",
      "Compliance audit trail and enterprise SLA tier",
      "Signed guest CI/CD with staging vs production registries",
    ],
    footer: "Business: enterprise contracts + marketplace revenue share.",
  },
  {
    id: "phase-4",
    label: "Phase 4 — Scale",
    timeframe: "18+ months",
    goal: "Verifiable AI inference marketplace — many tasks, many buyers and providers.",
    status: "upcoming",
    highlights: [
      "Catalog of verified tasks (credit, fraud, KYC, content policy)",
      "Agent integrations — escrow, prove, verify, then release funds",
      "Larger guests via RISC Zero continuations / decomposed pipelines",
      "Optional cross-chain verifier deployments; Stellar as settlement hub",
    ],
    footer: "Vision: “Stripe for verifiable compute” — program + input hash in, trustless settlement out.",
  },
];

export const ROADMAP_VISION =
  "VeriCompute is a protocol, not a one-off credit app. Credit scoring is the flagship demo; the guest program is swappable behind the same prove → verify → settle flow.";
