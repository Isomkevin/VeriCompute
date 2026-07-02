# TASKS.md — VeriCompute Build Checklist

**Current Phase:** Phase 5 — repo complete; operator runs `./scripts/full-e2e.sh` for live testnet checkpoint

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
- [x] Scripts: `prove.sh`, `verify-proof-cli.sh`, `install-stellar-cli.sh`
- [ ] Deploy verifier to Stellar testnet (operator: funded identity + `./scripts/full-e2e.sh`)
- [ ] CLI verify checkpoint succeeded on live testnet

## Phase 2 — Escrow / Settlement Contract

- [x] `LoanEscrow` interface: `init`, `create_request`, `submit_proof_and_settle`, `set_image_id`
- [x] Cross-invoke verifier with `(seal, image_id, journal_digest)`
- [x] Decode score from journal bytes; conditional payout + events
- [x] Scripts: `init-escrow.sh`, `fund-sac.sh`, `test-escrow-flow.sh`, `full-e2e.sh`
- [ ] Deploy escrow + `init` on testnet (via `full-e2e.sh`)
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
- [x] Soroban tx build/sign helpers (`buildInitEscrowTx`, create, submit)
- [x] NOT CONFIGURED banner + escrow init / SAC funding guidance on demo page
- [x] `sync-env-from-deployments.sh` for `.env.local`

## Phase 5 — Polish, Docs, Submission

- [x] README with setup, honesty section, remote prover workflow, full e2e script
- [x] GitHub Actions `prove.yml` for remote proving
- [x] `deployments/testnet.json.example` + gitignore for live deployments
- [ ] Record demo video (operator)
- [ ] Live `deployments/testnet.json` after successful testnet run (local only)

## Phase 6 — The Winning Edge (High Leverage)
- [ ] **Live Testnet Verification:** Deploy `verifier` and `LoanEscrow` to testnet and verify a real transaction on Stellar Expert.
- [ ] **Protocol Generalization:** Implement a second "compute task" (e.g., Verifiable Age/ID) in the guest program to prove generality.
- [ ] **Privacy Hardening:** Ensure raw input is never on-chain; only hashes and proofs are submitted.
- [ ] **Narrative Shift:** Update README and "How it Works" to frame this as a "Verifiable Compute Protocol" leveraging Protocol 26.
- [ ] **Noir Stretch:** Implement a private threshold proof to hide the actual score on-chain.

---

## Notes / Decisions Log

- **Verifier path:** direct Groth16 verifier deploy (typezero-style), vendored via `scripts/vendor-verifier.sh` — not full router stack.
- **Prover:** WSL `cargo run -p vericompute-host` from Next.js API; optional HTTP/CI fallback.
- **Journal encoding:** fixed 68 bytes (`input_hash || output_hash || score`) for on-chain decode.
- **WSL DNS:** if `apt-get` hangs, set `/etc/resolv.conf` to public DNS and disable auto-generation in `/etc/wsl.conf`.
