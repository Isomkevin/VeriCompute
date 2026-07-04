# ARCHITECTURE — VeriCompute

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Next.js Application                          │
│  ┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐    │
│  │  Landing /     │   │  Demo Flow Page   │   │  How It Works /   │   │
│  │  Explainer     │   │  (form + pipeline │   │  Architecture     │   │
│  │  Page          │   │   visualization)  │   │  Page             │   │
│  └───────────────┘   └─────────┬─────────┘   └──────────────────┘    │
│                                  │                                     │
│                          API Routes (app/api/*)                       │
│        ┌─────────────────────────┼───────────────────────────┐       │
│        │                          │                           │       │
│   /api/prove               /api/verify                 /api/escrow    │
│  (calls prover)        (submit verify tx)            (settlement tx)  │
└────────┼──────────────────────────┼───────────────────────────┼──────┘
         │                          │                           │
         ▼                          ▼                           ▼
┌─────────────────┐      ┌────────────────────────────────────────────┐
│  RISC Zero       │      │            Stellar Testnet                  │
│  Prover Service  │      │  ┌───────────────┐  ┌────────────────────┐ │
│  (Rust host +    │      │  │ Verifier       │  │ Escrow /            │ │
│  guest binary)   │      │  │ Contract       │◄─┤ Settlement Contract │ │
│                  │      │  │ (RISC Zero     │  │ (LoanEscrow)        │ │
│  Runs guest      │      │  │  Groth16       │  │                     │ │
│  program in zkVM,│ ───► │  │  verifier)     │  │ holds funds,        │ │
│  returns receipt │      │  └───────────────┘  │ calls verifier,     │ │
│  + public outputs│      │                     │ releases payment    │ │
└─────────────────┘      └────────────────────────────────────────────┘
```

## 2. Components

### 2.1 Next.js App (`apps/web`)
- App Router, TypeScript, Tailwind.
- Talks to the Prover Service and to Stellar via the JS SDK + Stellar Wallets Kit.
- Responsible for orchestrating the demo flow and rendering the step-by-step pipeline UI.

**Local dev:** the Next.js app is the only component required to browse the UI on localhost. From the repo root:

```bash
cp .env.example apps/web/.env.local
cd apps/web && npm install && npm run dev
```

On Windows PowerShell: `Copy-Item ".env.example" "apps/web/.env.local"` then `cd apps/web; npm install; npm run dev`.

The dev server runs at `http://localhost:3000`. There is no root-level `npm run dev` — scripts live in `apps/web/package.json`.

Without deployed contract IDs, pages render with a **NOT CONFIGURED** banner. `/api/prove` calls the RISC Zero host via WSL subprocess (`PROVER_WSL_REPO_PATH`) or HTTP (`PROVER_SERVICE_URL`).

### 2.2 RISC Zero Guest Program (`zk/guest`)
- A Rust crate compiled to a RISC-V ELF that runs inside the zkVM.
- Input: serialized struct (e.g., `ScoringInput { income, debts, repayment_history, ... }`)
- Logic: pluggable scoring module (`scoring::compute_score(input) -> u32`)
- Output (journal): `{ input_hash, output_hash, score, image_id }` — what gets committed publicly.
- **Guest Image ID (`image_id`)**: A 32-byte cryptographic identifier (Merkle root hash) of the compiled guest program. It acts as a unique fingerprint and is generated automatically during compilation. To retrieve it easily without running a full proof, you can run `cargo run --release -p vericompute-host -- --print-image-id`.

> **Generalization note:** The guest program's entrypoint should call into a `Task` trait or similar abstraction so that swapping `scoring::compute_score` for a different deterministic function (e.g., an eligibility check) doesn't require restructuring the guest, host, or contracts.

### 2.3 RISC Zero Host / Prover Service (`zk/host`)
- A Rust binary (can be wrapped as a small local HTTP service, or invoked as a subprocess from a Next.js API route via `child_process` during development).
- Responsibilities:
  - Accept input JSON
  - Execute guest program in the zkVM (`risc0_zkvm::ExecutorEnv` / `default_prover()`)
  - Produce a `Receipt` (proof)
  - Serialize the receipt + journal (public outputs) for submission to Soroban
- For the hackathon, this can run locally and be exposed via a minimal API (e.g., a small Axum/Actix server on `localhost:PORT`, or even invoked as a CLI and shelled out to from a Next.js API route). **Do not over-engineer this — local + simple is fine for testnet demo.**

### 2.4 Soroban Verifier Contract (`contracts/verifier`)
- Forked/adapted from `NethermindEth/stellar-risc0-verifier`.
- Exposes (conceptually):
  ```rust
  pub fn verify_receipt(
      env: Env,
      image_id: BytesN<32>,
      journal: Bytes,
      seal: Bytes, // Groth16 proof bytes
  ) -> Result<Bytes, Error> // returns journal/public outputs if valid
  ```

### 2.5 Soroban Escrow / Settlement Contract (`contracts/escrow`)
- New contract for this project.
- **Initialization**: The escrow contract must be initialized with a specific `image_id` (the Guest Image ID). This securely binds the contract to only accept proofs generated by your exact compiled guest program. If a malicious provider attempts to run a modified program, it will produce a different `image_id`, and the on-chain verifier will reject the proof, protecting the funds.
- Conceptual interface:
  ```rust
  pub struct LoanRequest {
      pub borrower: Address,
      pub lender: Address,
      pub provider: Address,
      pub amount: i128,
      pub provider_fee: i128,
      pub score_threshold: u32,
  }

  pub fn create_request(env: Env, req: LoanRequest) -> u64; // returns request_id, locks funds

  pub fn submit_proof_and_settle(
      env: Env,
      request_id: u64,
      image_id: BytesN<32>,
      journal: Bytes,
      seal: Bytes,
  ) -> SettlementResult;
  ```
- `submit_proof_and_settle` flow:
  1. Call verifier contract's `verify_receipt`.
  2. If verification fails → revert (no funds move) or emit `VerificationFailed` event, no payout.
  3. If verification succeeds:
     - Always pay `provider_fee` to the Provider (they did correct work).
     - Decode `score` from journal.
     - If `score >= score_threshold` → release `amount` to Borrower.
     - Else → return `amount` to Lender; emit `ThresholdNotMet`.
  4. Emit events at each step for the frontend to read/display.

### 2.6 Stellar Integration
- Use `@stellar/stellar-sdk` for building/submitting transactions.
- Use Stellar Wallets Kit for wallet connection (Freighter recommended for testnet).
- All contract addresses, network passphrase, and RPC URL should live in environment config (testnet only).

## 3. Data Flow (Step-by-Step)

1. **User submits input** via the demo form → frontend serializes it to the format the guest program expects.
2. **Frontend calls `/api/prove`** with the input.
3. **API route invokes the Prover Service**, which runs the guest program in the zkVM and returns:
   - `journal` (public outputs: input_hash, output_hash, score)
   - `seal` (Groth16 proof bytes)
   - `image_id` (identifies which program ran)
4. **Frontend displays the proof result** (score, proof hash) and prompts the user to sign a transaction (via connected wallet).
5. **Frontend builds a Soroban transaction** calling `escrow.submit_proof_and_settle(request_id, image_id, journal, seal)`.
6. **User signs via Stellar Wallets Kit** → transaction submitted to testnet.
7. **Escrow contract calls verifier contract** on-chain.
8. **Frontend polls for transaction result** (`/api/tx-status` or directly via SDK) and displays:
   - Verification status (✅ / ❌)
   - Settlement outcome (funds released / returned)
   - Link to Stellar Expert testnet explorer for the transaction

## 4. Suggested Folder Structure (Monorepo)

```
vericompute/
├── apps/
│   └── web/                       # Next.js app
│       ├── app/
│       │   ├── page.tsx           # Landing/explainer
│       │   ├── demo/page.tsx      # Demo flow
│       │   ├── how-it-works/page.tsx
│       │   └── api/
│       │       ├── prove/route.ts
│       │       ├── tx-status/route.ts
│       │       └── escrow/route.ts
│       ├── components/
│       │   ├── PipelineVisualizer.tsx
│       │   ├── ScoringForm.tsx
│       │   ├── WalletConnect.tsx
│       │   └── ResultPanel.tsx
│       ├── lib/
│       │   ├── stellar.ts         # SDK helpers, network config
│       │   ├── contracts.ts       # Contract addresses + call helpers
│       │   └── prover-client.ts   # Talks to zk/host service
│       └── ...
├── zk/
│   ├── guest/                     # RISC Zero guest program
│   │   └── src/
│   │       ├── main.rs
│   │       └── scoring.rs         # Pluggable scoring logic
│   └── host/                      # Prover service / CLI
│       └── src/main.rs
├── contracts/
│   ├── verifier/                  # Adapted from stellar-risc0-verifier
│   └── escrow/                    # New LoanEscrow contract
├── PRD.md
├── ARCHITECTURE.md
├── TASKS.md
├── CLAUDE.md
├── .cursorrules
└── README.md
```

## 5. Environment Variables

Copy `.env.example` to `apps/web/.env.local` before running the frontend. See the root [README](README.md#environment-variables) for the full table.

```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_VERIFIER_CONTRACT_ID=<deployed verifier contract address>
NEXT_PUBLIC_ESCROW_CONTRACT_ID=<deployed escrow contract address>
PROVER_SERVICE_URL=http://localhost:8080   # if running prover as local service
PROVER_WSL_REPO_PATH=/mnt/c/.../VeriCompute  # WSL path when proving from Windows Next.js
```

## 6. Local Development Tiers

| Tier | Command | Result |
|------|---------|--------|
| **UI only** | `cd apps/web && npm run dev` | Landing, demo form, pipeline UI at `localhost:3000`; **NOT CONFIGURED** if contract IDs empty |
| **UI + prove** | Above + WSL host or `PROVER_SERVICE_URL` | `/api/prove` returns real Groth16 receipts |
| **Full demo** | Above + testnet deploy + Freighter | Wallet-signed escrow settlement on Soroban testnet |

## 7. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| RISC Zero proving too slow for live demo | Keep guest program minimal (simple arithmetic/rules scoring, not ML). Pre-generate a proof as fallback for the recorded demo video if needed, but try to make live proving work. |
| Verifier contract integration is finicky (encoding seal/journal for Soroban) | Start here first (Phase 1) — it's the highest-risk, most novel integration. Follow the Nethermind repo + jamesbachini tutorial closely. |
| Scope creep into "real" credit scoring / data | Keep all financial data synthetic and clearly labeled as such in UI + README. |
| Generalization claim feels bolted-on | Build the `Task` abstraction in the guest program from day one, even with only one implementation — makes the generalization claim credible in code, not just prose. |
