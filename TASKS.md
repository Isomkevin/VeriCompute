# TASKS.md — VeriCompute Build Checklist

**Current Phase:** Phase 4/5 — implementation complete in repo; deploy + live testnet verification pending operator setup

---

## Phase 0 — Project Setup

- [x] Initialize monorepo structure (`apps/web`, `zk/methods`, `zk/host`, `contracts/escrow`, `vendor/stellar-risc0-verifier`)
- [x] Scaffold Next.js app (App Router, TypeScript, Tailwind)
- [x] Set up Rust workspace for `zk/methods` + `zk/host` with `risc0-zkvm` 3.0.4
- [x] Set up Soroban escrow scaffolding + vendor script for verifier
- [x] Add `.env.example` with required env vars

## Phase 1 — Core Proof + Verification Loop

- [x] Guest program: deterministic scoring in zkVM, fixed 68-byte journal
- [x] Host/prover: Groth16 CLI + HTTP `--serve`, outputs `proof.json`
- [x] Vendor script for Nethermind `groth16-verifier`
- [ ] Deploy verifier to Stellar testnet (requires funded identity + `stellar` CLI in WSL)
- [ ] CLI verify checkpoint with `scripts/verify-proof-cli.sh`

## Phase 2 — Escrow / Settlement Contract

- [x] `LoanEscrow` interface: `init`, `create_request`, `submit_proof_and_settle`, `set_image_id`
- [x] Cross-invoke verifier with `(seal, image_id, journal_digest)`
- [x] Decode score from journal bytes; conditional payout + events
- [ ] Deploy escrow + `init` on testnet
- [ ] CLI e2e: create request → submit proof → confirm payout paths

## Phase 3 — Credit Scoring Guest

- [x] `scoring::compute_score` rules-based module
- [x] Synthetic `ScoringInput` fields
- [x] Journal includes score in fixed layout

## Phase 4 — Frontend Integration

- [x] `WalletConnect` (Stellar Wallets Kit, testnet)
- [x] `ScoringForm` with synthetic data badge
- [x] `/api/prove` (WSL subprocess or `PROVER_SERVICE_URL`)
- [x] `PipelineVisualizer`, `ResultPanel`, demo + landing + how-it-works pages
- [x] Soroban tx build/sign helpers for escrow calls
- [x] NOT CONFIGURED banner when contract IDs missing

## Phase 5 — Polish, Docs, Submission

- [x] README with setup, honesty section, remote prover workflow
- [x] GitHub Actions `prove.yml` for remote proving
- [ ] Record demo video
- [ ] Final testnet deploy addresses committed to `deployments/testnet.json` (local only)

---

## Notes / Decisions Log

- **Verifier path:** direct Groth16 verifier deploy (typezero-style), vendored via `scripts/vendor-verifier.sh` — not full router stack.
- **Prover:** WSL `cargo run -p vericompute-host` from Next.js API; optional HTTP/CI fallback.
- **Journal encoding:** fixed 68 bytes (`input_hash || output_hash || score`) for on-chain decode.
- **WSL DNS:** if `apt-get` hangs, set `/etc/resolv.conf` to public DNS and disable auto-generation in `/etc/wsl.conf`.
