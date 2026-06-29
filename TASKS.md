# TASKS.md — VeriCompute Build Checklist

> Keep this updated. Agents should check this file before starting work and update it after completing items, so context persists across sessions.

**Current Phase:** Phase 0 (Setup) — not yet started

---

## Phase 0 — Project Setup

- [ ] Initialize monorepo structure (`apps/web`, `zk/guest`, `zk/host`, `contracts/verifier`, `contracts/escrow`)
- [ ] Scaffold Next.js app (App Router, TypeScript, Tailwind)
- [ ] Set up Rust workspace for `zk/guest` and `zk/host` with `risc0-zkvm` dependency
- [ ] Set up Soroban contract scaffolding (Stellar CLI installed, testnet account funded via friendbot)
- [ ] Add `.env.example` with all required env vars from `ARCHITECTURE.md`

## Phase 1 — Core Proof + Verification Loop (HIGHEST RISK — DO THIS FIRST)

Goal: prove that "RISC Zero receipt → verified on Soroban testnet" works end-to-end, even with trivial/dummy data. Everything else builds on this.

- [ ] Write a minimal guest program (`zk/guest`): takes a simple numeric input, runs a trivial deterministic computation, commits input hash + output value to journal
- [ ] Write host/prover (`zk/host`): runs guest in zkVM, outputs receipt (seal + journal + image_id) to a file or stdout as JSON
- [ ] Fork/adapt `NethermindEth/stellar-risc0-verifier` into `contracts/verifier`
- [ ] Deploy verifier contract to Stellar testnet
- [ ] Manually submit a generated receipt to the deployed verifier (via Stellar CLI or a small script) and confirm it verifies successfully
- [ ] **Checkpoint:** at this point you should be able to run the prover, take its output, and verify it on-chain via a manual/CLI step. This is the proof-of-concept that de-risks the whole project.

## Phase 2 — Escrow / Settlement Contract

- [ ] Design `contracts/escrow` interface (see `ARCHITECTURE.md` §2.5)
- [ ] Implement `create_request` (locks funds, stores request params: provider, borrower, lender, amount, fee, threshold)
- [ ] Implement `submit_proof_and_settle` (calls verifier, decodes journal, applies payout logic)
- [ ] Add events for: verification result, settlement outcome
- [ ] Deploy escrow contract to testnet
- [ ] Test full flow via CLI/script: create request → submit a valid proof → confirm correct payout; submit with score below threshold → confirm correct "not met" path

## Phase 3 — Credit Scoring Guest Program (Real Demo Logic)

- [ ] Replace trivial guest computation with a `scoring` module: `compute_score(input: ScoringInput) -> u32`
- [ ] Define `ScoringInput` struct (synthetic fields: income, debts, repayment_history, etc. — document these are synthetic in README)
- [ ] Keep scoring logic simple/deterministic (rules-based or simple weighted formula) — verify proving time stays reasonable
- [ ] Update journal output to include the score
- [ ] Re-verify Phase 1 + Phase 2 still work with the real guest program

## Phase 4 — Frontend Integration

- [ ] `WalletConnect` component using Stellar Wallets Kit (testnet, Freighter)
- [ ] `ScoringForm` — collects synthetic applicant data
- [ ] `/api/prove` route — calls prover service/binary with form data, returns receipt
- [ ] `PipelineVisualizer` component — shows steps: input submitted → proving → proof generated → submitting to chain → verifying → settlement result
- [ ] Wire up transaction building + signing for `escrow.submit_proof_and_settle`
- [ ] `ResultPanel` — shows score, verification status, settlement outcome, link to Stellar Expert testnet tx
- [ ] Landing/explainer page — clearly states the problem statement and how VeriCompute solves it, framed generally (not just "credit scoring app")
- [ ] "How it works" page — diagram + explanation for judges

## Phase 5 — Polish, Docs, Submission

- [ ] README.md: problem statement, architecture overview, what's real vs. simplified/mocked, setup instructions, demo instructions
- [ ] Make sure all env vars / contract addresses needed to run the project are documented
- [ ] Record 2–3 minute demo video showing the full flow with on-chain confirmation
- [ ] Final review against hackathon submission requirements (open-source repo, README, demo video, ZK load-bearing + Stellar integration)

## Stretch Goals (only after Phase 5 core is solid)

- [ ] Noir/UltraHonk private threshold proof layered on top (prove "score ≥ threshold" without revealing score)
- [ ] Second guest program (different task) to demonstrate generality, behind the same `Task` interface
- [ ] Simple "provider marketplace" UI listing available compute tasks/fees

---

## Notes / Decisions Log

> Record key decisions here as they're made (e.g., "decided to run prover as local CLI invoked via API route rather than separate service, because X").

-
