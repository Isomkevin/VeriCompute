# VeriCompute

**Verifiable compute + conditional payment on Stellar.**

> **Stellar Hacks — Real-World ZK** · RISC Zero Groth16 proofs verified on Soroban · Escrow settles only after on-chain verification

**Deployed Contract IDs (Stellar Testnet):**

- **Verifier:** `CDBHFHVWNIOJWAJ7AZDIQOZGUER7WHJDCJVOPDTE67M7FDCWNYSCRBXG`
- **Escrow:** `CBZ6E6J6EZXSUNFNXWJWEVVLBVKQRLPNV4HE4AHYK7DQWCYDON44HD2T`

If you pay someone to run a deterministic computation — credit scoring, eligibility checks, fraud rules, model inference — you currently have to **trust** they used your program on your input. VeriCompute closes that gap: a provider runs your guest program inside the **RISC Zero zkVM**, submits the Groth16 receipt to **Soroban**, and an **escrow contract** releases funds only when verification succeeds.

Credit scoring is the flagship demo. The scoring logic lives in a swappable module behind the same **prove → verify → settle** protocol.

---

## Table of contents

- [The problem](#the-problem)
- [The solution](#the-solution)
- [Architecture](#architecture)
- [End-to-end flow](#end-to-end-flow)
- [Why ZK is load-bearing](#why-zk-is-load-bearing)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [What's real vs simplified](#whats-real-vs-simplified)
- [Generalization beyond credit scoring](#generalization-beyond-credit-scoring)
- [Remote prover options](#remote-prover-options)
- [Demo video script (~2 min)](#demo-video-script-2-min)
- [Hackathon alignment](#hackathon-alignment)
- [Roadmap: hackathon → startup](#roadmap-hackathon--startup)
- [References](#references)

---

## The problem

Outsourced AI and deterministic compute today has a trust gap:

- A provider can swap in a cheaper model or ruleset
- They can run on different (or stale) inputs
- They can fabricate outputs entirely

Payment happens anyway. There is no cryptographic link between **what you paid for** and **what actually ran**.

## The solution

VeriCompute is a **general protocol** for verifiable compute with conditional settlement:

| Role | Responsibility |
|------|----------------|
| **Requester** | Specifies the task (guest program + input) |
| **Provider** | Runs the guest in RISC Zero, produces a Groth16 receipt |
| **Verifier (Soroban)** | Cryptographically checks the receipt against the expected program (`image_id`) |
| **Escrow (Soroban)** | Holds funds; pays the provider on valid proof; conditionally releases the loan to the borrower based on the verified score |

**No valid proof → no settlement.** The demo walks through synthetic applicant data → zkVM proof → on-chain verification → escrow payout on Stellar testnet.

---

## Architecture

```mermaid
flowchart TB
  subgraph UI["Next.js (apps/web)"]
    Form[Scoring form]
    Pipe[Pipeline visualizer]
    Wallet[Freighter / Wallets Kit]
  end

  subgraph OffChain["Off-chain prover"]
    Host["zk/host — Groth16 prover"]
    Guest["zk/methods/guest — scoring logic"]
    Host --> Guest
  end

  subgraph Chain["Stellar testnet (Soroban)"]
    Verifier["Groth16 verifier\n(vendored Nethermind)"]
    Escrow["LoanEscrow"]
    Escrow -->|verify seal + image_id + journal_digest| Verifier
  end

  Form -->|POST /api/prove| Host
  Host -->|seal, image_id, journal| Pipe
  Wallet -->|sign tx| Escrow
  Pipe --> Wallet
```

**Journal layout (68 bytes, committed in zkVM):**

```
input_hash (32) || output_hash (32) || score u32 LE (4)
```

The escrow contract decodes `score` from the journal after the verifier accepts the Groth16 seal.

---

## End-to-end flow

1. User fills the **synthetic** credit-scoring form in the demo UI.
2. `/api/prove` invokes the RISC Zero host (local WSL subprocess or remote HTTP prover).
3. Host runs `scoring::compute_score` inside the guest ELF and returns `proof.json` fields: `seal`, `image_id`, `journal_digest`, `journal_hex`, `score`.
4. User connects **Freighter** (testnet) and signs `create_request` then `submit_proof_and_settle` on `LoanEscrow`.
5. Escrow cross-invokes the Groth16 verifier; on success it pays the provider fee and either disburses the loan (score ≥ threshold) or returns principal to the lender.
6. UI shows verification status, score, outcome, and a **Stellar Expert** transaction link.

---

## Why ZK is load-bearing

This is not a cosmetic ZK badge:

- The **guest program identity** (`image_id`) is checked on-chain — a substituted program fails verification.
- The **Groth16 seal** is verified by the Nethermind Soroban verifier, not a trusted server.
- **Settlement is conditional** on that verification; invalid proofs revert before any payout.
- The journal binds **input hash**, **output hash**, and the public **score** the escrow reads.

What is *not* claimed: we do not run a full LLM inside the zkVM (proving time makes that impractical for a live demo). The guest is a small deterministic rules engine — the README and UI label this honestly. The architecture generalizes to any deterministic guest you can compile to RISC Zero.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Wallet | [Stellar Wallets Kit](https://stellarwalletskit.dev/) |
| Chain SDK | `@stellar/stellar-sdk` |
| ZK | [RISC Zero](https://dev.risczero.com/) zkVM 3.x, Groth16 receipts |
| Verifier | [Nethermind `stellar-risc0-verifier`](https://github.com/NethermindEth/stellar-risc0-verifier) (vendored) |
| Contracts | Soroban Rust (`LoanEscrow` + Groth16 verifier) |
| Network | **Stellar testnet only** — no mainnet, no real funds |

---

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/web` | Demo UI — landing, `/demo`, `/how-it-works`, API routes |
| `zk/methods` + `zk/methods/guest` | RISC Zero guest crate + embedded ELF (`GUEST_ID`) |
| `zk/host` | Groth16 prover CLI and optional HTTP server (`POST /prove`) |
| `vendor/stellar-risc0-verifier` | Vendored Nethermind Groth16 verifier (via script) |
| `contracts/escrow` | `LoanEscrow` — fund lock, verify, conditional payout |
| `scripts/` | WSL setup, vendor, deploy, prove, init, fund SAC, sync env, full e2e |
| `deployments/testnet.json` | Written by deploy script (local; not committed with secrets) |

---

## Quick start

### Local development (frontend only)

Fastest path to run the UI on **localhost** — no WSL, contracts, or wallet required to browse pages:

```bash
cp .env.example apps/web/.env.local
cd apps/web
npm install
npm run dev
```

**Windows (PowerShell)** — run from the repo root:

```powershell
Copy-Item ".env.example" "apps/web/.env.local"
Set-Location apps/web
npm install
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000) — landing page
- [http://localhost:3000/demo](http://localhost:3000/demo) — demo flow

> **Important:** `npm run dev` lives in `apps/web`, not the repo root. Running it from the root fails with `Missing script: "dev"`.

Without contract IDs in `.env.local`, the demo shows a **NOT CONFIGURED** banner (expected). Proving and on-chain settlement need the full setup below.

| Goal | What you need |
|------|----------------|
| Browse UI locally | Node.js 18+ and steps above |
| Generate proofs from the demo | WSL2 + RISC Zero + Docker, or `PROVER_SERVICE_URL` pointing at a remote/HTTP prover |
| Full testnet settlement | Deploy contracts, fill contract IDs in `.env.local`, Freighter on testnet |

See [Remote prover options](#remote-prover-options) if the Next.js app runs on Windows without local WSL proving.

### Prerequisites (full stack)

- **WSL2 (Ubuntu)** recommended on Windows for proving and contract deploy
- **Docker** (Groth16 proving on x86_64 Linux)
- **Node.js 18+**
- **Rust** (`rustup`)
- **RISC Zero** — `curl -L https://risczero.com/install | bash`, then `rzup install` and `rzup install risc0-groth16`
- **Stellar CLI** — `cargo install stellar-cli --locked`
- **Freighter** wallet configured for **testnet**

### 1. Toolchain (WSL)

```bash
./scripts/setup-wsl.sh
source ~/.cargo/env
export PATH=$HOME/.risc0/bin:$PATH
rzup install
rzup install risc0-groth16
```

If `apt-get` hangs in WSL, fix DNS (run as root):

```bash
printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > /etc/resolv.conf
```

### 2. Prove locally (checkpoint)

> **Note:** The very first time you generate a proof (either via CLI or through the Next.js UI), `cargo` must compile the RISC Zero guest and host crates. This can take **1-3 minutes**. Subsequent proofs will run much faster.

```bash
cargo run --release -p vericompute-host \
  -- --input zk/host/examples/sample_input.json \
  --output proof.json
```

`proof.json` contains `seal`, `image_id`, `journal_digest`, `journal_hex`, and `score`. The bundled sample input scores **512** with the default rules.

### 2b. Generate the Guest Image ID (Optional)

If you only need the `image_id` of the guest program (which is required to initialize the escrow contract so it only accepts proofs from your specific program) without running a full proof, you can run:

```bash
cargo run --release -p vericompute-host -- --print-image-id
```

This compiles the guest and prints its unique cryptographic identity (a Merkle root hash).

### 3. Deploy contracts (testnet)

```bash
stellar keys generate vericompute --network testnet
stellar keys fund vericompute --network testnet
./scripts/vendor-verifier.sh
NETWORK=testnet IDENTITY=vericompute ./scripts/deploy-testnet.sh
```

This writes `deployments/testnet.json` with `verifier_contract_id` and `escrow_contract_id`.

### 4. Initialize escrow

Run after deploy and after you have the guest `image_id` (either generated via the `--print-image-id` flag or extracted from `proof.json`):

```bash
./scripts/init-escrow.sh
```

Or manually with the testnet native XLM [Stellar Asset Contract](https://developers.stellar.org/docs/build/guides/basics/contract-interactions/stellar-asset-contract):

```bash
VERIFIER_ID=$(jq -r .verifier_contract_id deployments/testnet.json)
ESCROW_ID=$(jq -r .escrow_contract_id deployments/testnet.json)
IMAGE_ID=$(jq -r .image_id proof.json)
ADMIN=$(stellar keys address vericompute)
TOKEN_ID=CDLZFC3SYJYDZT7K7VZ75HMSCV4MAZJSDLX4S5HD3NF4AXR7HWPN3NWA

stellar contract invoke \
  --network testnet \
  --source-account vericompute \
  --id "$ESCROW_ID" \
  -- \
  init \
  --admin "$ADMIN" \
  --verifier "$VERIFIER_ID" \
  --image_id "$IMAGE_ID" \
  --token "$TOKEN_ID"
```

Before `create_request`, the lender wallet needs SAC token balance (escrow pulls XLM from the SAC, not classic balances):

```bash
./scripts/fund-sac.sh
```

### 5. Verify proof on-chain (CLI checkpoint)

```bash
NETWORK=testnet IDENTITY=vericompute ./scripts/verify-proof-cli.sh
```

### 5b. Full testnet checkpoint (one script)

```bash
NETWORK=testnet IDENTITY=vericompute ./scripts/full-e2e.sh
```

This runs: prove → deploy → verify → init escrow → fund SAC → create request → settle.

### 6. Frontend (with testnet contracts)

If you already ran [Local development (frontend only)](#local-development-frontend-only), skip the install/dev steps and only add contract IDs.

Fill in from `deployments/testnet.json`:

```bash
# Optional helper — writes apps/web/.env.local from deployments/testnet.json
./scripts/sync-env-from-deployments.sh
```

Or manually:

```env
NEXT_PUBLIC_VERIFIER_CONTRACT_ID=CDBHFHVWNIOJWAJ7AZDIQOZGUER7WHJDCJVOPDTE67M7FDCWNYSCRBXG
NEXT_PUBLIC_ESCROW_CONTRACT_ID=CBZ6E6J6EZXSUNFNXWJWEVVLBVKQRLPNV4HE4AHYK7DQWCYDON44HD2T
NEXT_PUBLIC_TOKEN_CONTRACT_ID=CDLZFC3SYJYDZT7K7VZ75HMSCV4MAZJSDLX4S5HD3NF4AXR7HWPN3NWA
```

Restart the dev server after editing `.env.local`.

---

## Environment variables

See [`.env.example`](.env.example).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_VERIFIER_CONTRACT_ID` | Deployed Groth16 verifier |
| `NEXT_PUBLIC_ESCROW_CONTRACT_ID` | Deployed `LoanEscrow` |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ID` | SAC used by escrow (optional in UI) |
| `PROVER_SERVICE_URL` | Remote prover base URL (`POST /prove`) |
| `PROVER_WSL_REPO_PATH` | WSL path to repo when proving from Windows Next.js |
| `GUEST_IMAGE_ID` | Guest program identity from `proof.json`. **Note:** Used by `init-escrow.sh`; the UI fetches it dynamically, so leaving it blank in `.env.local` is fine. |

---

## What's real vs simplified

| Real (production-shaped) | Simplified / demo |
|--------------------------|-------------------|
| RISC Zero Groth16 proving in zkVM | Rules-based score, not an LLM or large ML model |
| `encode_seal()` + SHA-256 `journal_digest` for Soroban | Synthetic applicant form data |
| Soroban verifier + `LoanEscrow` on testnet | Same wallet often plays lender, borrower, and provider |
| Wallet-signed transactions via Stellar Wallets Kit | Local/WSL prover; optional GitHub Actions remote prover |
| Escrow pays provider on valid proof; conditional loan release | Testnet XLM only — no real money |

We label mocked or synthetic elements in the UI (e.g. **synthetic data** badge on the scoring form). Judges should never wonder what is real.

---

## Generalization beyond credit scoring

The guest program is intentionally modular:

- **Task logic** lives in `zk/methods/guest/src/scoring.rs` (`compute_score`).
- **zkVM I/O** (read input, hash, commit journal) lives in `main.rs`.
- Swapping credit scoring for another deterministic function (eligibility, fraud rules, content policy) means replacing the scoring module and redeploying with the new `image_id` — the host, verifier integration, and escrow flow stay the same.

Conceptually, any computation that is **deterministic** and **small enough to prove in reasonable time** fits this protocol — including distilled rules or compact models derived from larger AI systems.

---

## Remote prover options

Groth16 proving requires Linux x86_64 + Docker in practice. If the Next.js app runs on Windows without WSL proving, **or if you are deploying the Next.js frontend to production (e.g. Vercel) where WSL is not available**, you must configure a remote prover.

**Option A — HTTP prover (Recommended for Production)**

You can run the prover crate as a standalone HTTP microservice on a Linux server (e.g. AWS EC2, DigitalOcean).

```bash
cargo run --release -p vericompute-host -- --serve 0.0.0.0:8080
```

Set `PROVER_SERVICE_URL=http://your-server-ip:8080` in `apps/web/.env.local` (or your Vercel environment variables). When this variable is set, the Next.js `/api/prove` route will skip local WSL execution and proxy the request to your remote prover.

**Option B — GitHub Actions**

Manual workflow [`.github/workflows/prove.yml`](.github/workflows/prove.yml) builds and proves in CI; download the `proof-json` artifact.

---

## Demo video script (~2 min)

1. **Problem (15s):** Outsourced inference is unverifiable — providers can cheat.
2. **Protocol (20s):** RISC Zero proves correct execution; Soroban verifies; escrow pays only on success.
3. **Live demo (60s):** Fill synthetic form → proving spinner → connect Freighter → sign settlement → show score and outcome.
4. **On-chain proof (20s):** Open Stellar Expert link; point at verifier + escrow invocation.
5. **Close (15s):** General protocol — credit scoring is one swappable guest program.

---

## Hackathon alignment

| Criterion | How VeriCompute addresses it |
|-----------|-------------------------------|
| **Real-World ZK on Stellar** | Groth16 receipts verified in Soroban; settlement on testnet |
| **ZK is load-bearing** | Payment outcome depends on on-chain verification, not server trust |
| **Honest scope** | Synthetic data and rules-based scoring clearly labeled; no fake “verified” badges |
| **General protocol** | Swappable guest module; credit demo is one instance |
| **Reproducible** | Scripts for prove, deploy, verify CLI, and documented env setup |

**Implementation status:** Application code and contracts are complete in-repo. Live testnet deploy and the demo video are operator steps — follow [Quick start](#quick-start) with a funded testnet identity.

---

## Roadmap: hackathon → startup

VeriCompute is designed as a **protocol**, not a one-off demo app. The hackathon proves the core loop — prove, verify on Soroban, settle from escrow. The path to a real product runs through sharper vertical focus, production infrastructure, and a credible marketplace layer.

```mermaid
timeline
  title VeriCompute product phases
  section Now — Hackathon
    End-to-end testnet demo : Groth16 + LoanEscrow
    Credit scoring guest : Swappable task module
  section Phase 1 — Protocol (0–3 mo)
    Mainnet pilot : Audited contracts
    Task registry : Multi-guest support
    Managed prover API : Sub-minute prove SLA
  section Phase 2 — Product (3–9 mo)
    First vertical GTM : Lending / fintech APIs
    Provider marketplace : Fees, SLAs, reputation
    SDK + webhooks : Integrate without wallet UX
  section Phase 3 — Platform (9–18 mo)
    Private conditions : Noir threshold proofs
    Enterprise tier : Compliance, audit logs
    Stellar payments scale : USDC settlement volume
  section Phase 4 — Scale (18+ mo)
    Verifiable AI marketplace : Many guests, many buyers
    Partner network : Underwriters, data oracles
    Optional multi-rollup : Same receipt, other verifiers
```

### Phase 0 — Hackathon (now)

**Goal:** Prove the trust model works end-to-end on Stellar testnet.

| Deliverable | Status |
|-------------|--------|
| RISC Zero guest + Groth16 host | Done |
| Soroban verifier + `LoanEscrow` | Done |
| Next.js demo with honest synthetic data | Done |
| CLI/scripts for prove → deploy → settle | Done |
| Demo video + judge-ready README | Operator step |

**Exit criteria:** A judge or developer can reproduce proof generation, on-chain verification, and conditional payout without mocked success states.

---

### Phase 1 — Protocol hardening (months 0–3)

**Goal:** Turn the demo into infrastructure others can build on.

| Initiative | Why it matters |
|------------|----------------|
| **Contract audit + mainnet pilot** | Real funds require audited verifier/escrow; start with capped TVL and USDC on Stellar |
| **Task registry contract** | On-chain registry of allowed `image_id`s and settlement templates — one escrow pattern, many guests |
| **Second guest program** | e.g. eligibility or fraud-rules guest to prove generality beyond credit scoring |
| **Managed prover service** | Replace local WSL/CI with hosted Groth16 workers (RISC Zero Bonsai or self-hosted fleet); target predictable latency for API callers |
| **Receipt caching + idempotency** | Same input hash → same proof path; avoid double-settlement |

**Business model (early):** Protocol fee on escrow settlement (bps); optional hosted-prover subscription for integrators.

**Key metric:** Time from `POST /prove` to verified on-chain settlement under 2 minutes for the reference guest.

---

### Phase 2 — Product–market fit (months 3–9)

**Goal:** Win one vertical where verifiable compute has clear ROI.

**Primary wedge — verifiable underwriting for on-chain lending:**

- Lender escrows loan principal; borrower submits financial inputs; scoring provider proves correct model execution; disbursement is automatic if score ≥ threshold.
- Extends naturally to **invoice factoring**, **trade finance**, and **agentic workflows** that need “prove before pay.”

| Initiative | Why it matters |
|------------|----------------|
| **REST + SDK** (`@vericompute/sdk`) | Lenders integrate without running a prover or parsing Soroban XDR |
| **Provider marketplace UI** | List providers, fees, latency SLAs, and historical verification rate |
| **Wallet-optional flows** | Server-signed or session-based signing for B2B; keep Freighter for power users |
| **Real input pipelines** | Plaid/bank-statement hashes committed as `input_hash` (data stays off-chain; zkVM proves model ran on committed input) |
| **Observability** | Dashboard: proofs submitted, verify success rate, settlement outcomes, Stellar Expert deep links |

**Business model:** SaaS platform fee + per-proof prover margin + escrow settlement bps.

**Key metrics:** 3 design-partner lenders; verified escrow volume; under 1% proof verification failure rate (excluding user error).

---

### Phase 3 — Platform (months 9–18)

**Goal:** Become the default “verify compute, then pay” layer for Stellar-native fintech and AI agents.

| Initiative | Why it matters |
|------------|----------------|
| **Private threshold proofs (Noir / UltraHonk)** | Prove `score ≥ threshold` without revealing raw score on-chain — combines RISC Zero execution proof with privacy for competitive underwriting |
| **Composable escrow templates** | Split payouts (provider fee, lender, borrower, protocol treasury); support USDC and other Stellar assets |
| **Compliance & audit trail** | Immutable event index, export for regulators; optional KYC gate on `create_request` (off-chain attestations bound to addresses) |
| **Enterprise SLA tier** | Dedicated provers, priority verification, support contract |
| **Guest CI/CD** | Signed guest builds, semver `image_id` promotion, staging vs production registries |

**Business model:** Enterprise contracts; revenue share with scoring/model providers in the marketplace.

**Key metrics:** Monthly verified settlement volume; number of registered guest programs; enterprise logos.

---

### Phase 4 — Scale (months 18+)

**Goal:** Verifiable AI inference marketplace — any deterministic task, many buyers and providers.

| Initiative | Why it matters |
|------------|----------------|
| **Catalog of verified tasks** | Credit, fraud, KYC eligibility, content policy, pricing engines — each a pinned `image_id` |
| **Cross-ecosystem receipts** | Same RISC Zero receipt format; verifier deployments on other chains that support Groth16/RISC Zero (Stellar remains settlement hub if USDC + speed win) |
| **Larger guests via recursion / continuations** | RISC Zero continuations or decomposed pipelines for bigger models without proving full LLM forward passes |
| **Agent integrations** | AI agents escrow payment, call provider API, verify receipt before releasing funds — composable with MCP/tooling ecosystems |
| **Insurance & dispute layer** | Optional challenge window, bonded providers, slashing for invalid proofs |

**Vision:** **“Stripe for verifiable compute”** — requesters specify program + input hash; providers compete on price and latency; settlement is trustless on Stellar.

---

### What we are building long-term

| Layer | Hackathon today | Startup target |
|-------|-----------------|----------------|
| **Trust** | Groth16 receipt + `image_id` check | Same, plus optional private condition proofs |
| **Settlement** | Single `LoanEscrow` on testnet | Template library + USDC mainnet volume |
| **Compute** | Local/WSL prover, rules-based guest | Hosted prover network + provider marketplace |
| **Integration** | Demo UI + scripts | SDK, API, webhooks, partner dashboards |
| **Go-to-market** | Credit scoring story | Lending first; expand to fraud, eligibility, agents |

---

### Risks and how we address them

| Risk | Mitigation |
|------|------------|
| Proving too slow for large models | Commit to distilled/deterministic guests; continuations; never claim full LLM-in-zkVM for v1 |
| Soroban verifier churn | Pin vendored verifier rev; monitor Nethermind/Stellar upgrades; budget audit cycles |
| Chicken-and-egg (providers vs requesters) | Design-partner lenders first; subsidize early prover capacity |
| Regulatory (credit data) | Input hashes on-chain, raw PII off-chain; partner with licensed underwriters |
| Commoditization | Moat = escrow + marketplace + compliance tooling + Stellar USDC rails, not the zkVM alone |

---

### How to follow along

This roadmap will be tracked in [`TASKS.md`](TASKS.md) (engineering) and updated as phases ship. Post-hackathon priorities: **mainnet pilot**, **task registry**, **hosted prover API**.

---

## References

- [Nethermind `stellar-risc0-verifier`](https://github.com/NethermindEth/stellar-risc0-verifier)
- [RISC Zero + Stellar tutorial (James Bachini)](https://jamesbachini.com/stellar-risc-zero-games/)
- [ZK proofs on Stellar (official docs)](https://developers.stellar.org/docs/build/apps/zk)
- [RISC Zero documentation](https://dev.risczero.com/)
- [Stellar agent skills](https://skills.stellar.org/)

---

## Further reading

- [`PRD.md`](PRD.md) — product requirements and user flows
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — component boundaries and data flow
- [`TASKS.md`](TASKS.md) — build phases and checklist
- [Roadmap](#roadmap-hackathon--startup) — hackathon → startup phases (this document)
