# CLAUDE.md — VeriCompute

This file gives Claude Code (or any agentic coding assistant) the context needed to work on this project effectively.

## What This Project Is

**VeriCompute** is a hackathon submission for "Stellar Hacks: Real-World ZK" (Real-World ZK on Stellar).

**Problem we're solving:**
> If you pay someone for an AI inference (an LLM call, an ML scoring model, etc.), you currently have no way to verify they actually ran the model you asked for, on the input you provided. They could swap in a cheaper/worse model and you'd never know.

**Solution:** RISC Zero zkVM proof of correct execution → Soroban smart contract verification on Stellar → conditional escrow payment release. No proof, no payment.

**Flagship demo:** AI-powered credit/risk scoring — a borrower's data is scored by a deterministic model inside the zkVM, the proof is verified on-chain, and a loan disburses only if verification succeeds and the score meets a threshold.

**Critical framing:** this is meant to read as a *general protocol* ("verifiable compute + conditional payment") with credit scoring as a compelling, real-world-aligned instance — not as a single-purpose credit scoring app. Keep the scoring logic modular/swappable.

## Read These First

1. `PRD.md` — what we're building and why, user flows, requirements, success criteria
2. `ARCHITECTURE.md` — system design, component boundaries, contract interfaces, folder structure
3. `TASKS.md` — current phase, what's done, what's next
4. `.cursorrules` — coding conventions and constraints (these apply to Claude too)
5. `AGENT_HANDOFF.md` — multi-agent handoff rules and non-negotiables
6. `AGENTS.md` — where each agent reads context from

## Project Structure (target)

```
vericompute/
├── apps/web/          # Next.js app (App Router, TS, Tailwind)
├── zk/guest/           # RISC Zero guest program (Rust)
├── zk/host/            # RISC Zero prover service/CLI (Rust)
├── contracts/verifier/ # Adapted RISC Zero Groth16 verifier (Soroban)
├── contracts/escrow/   # LoanEscrow settlement contract (Soroban)
├── PRD.md
├── ARCHITECTURE.md
├── TASKS.md
├── CLAUDE.md
└── .cursorrules
```

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind
- Stellar Wallets Kit for wallet connection
- `@stellar/stellar-sdk` for chain interaction
- Soroban contracts in Rust, deployed to **Stellar testnet** via Stellar CLI
- RISC Zero (`risc0-zkvm`) for the zkVM guest/host

## Build / Dev Commands

### Frontend (localhost)

There is **no** root-level `npm run dev`. Always run from `apps/web`:

```bash
cp .env.example apps/web/.env.local
cd apps/web
npm install   # first time only
npm run dev
```

Windows PowerShell (from repo root):

```powershell
Copy-Item ".env.example" "apps/web/.env.local"
Set-Location apps/web
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/demo. Contract IDs in `.env.local` are optional for UI-only browsing.

### RISC Zero prover (WSL/Linux)

```bash
cargo run --release -p vericompute-host \
  -- --input zk/host/examples/sample_input.json \
  --output proof.json

# Optional HTTP server for Windows Next.js (set PROVER_SERVICE_URL=http://localhost:8080)
cargo run --release -p vericompute-host -- --serve 0.0.0.0:8080
```

### Soroban contracts

```bash
cd contracts/escrow
stellar contract build
stellar contract deploy --network testnet --source <account> --wasm target/wasm32-unknown-unknown/release/escrow.wasm
```

Full operator workflow: root `README.md` → [Quick start](README.md#quick-start).

## Working Agreements

- **Phase discipline:** Follow the phases in `TASKS.md`. Phase 1 (RISC Zero proof → on-chain Soroban verification, end-to-end with dummy data) is the highest-risk part of this project and must work before investing heavily in frontend polish.
- **Honesty in the repo:** If something is mocked, simplified, or incomplete, say so in code comments and in the README. The hackathon explicitly rewards honest "work-in-progress" framing over a "polished mystery."
- **Testnet only.** Never reference or configure mainnet.
- **Generalization seam:** The guest program's task logic (currently: credit scoring) must live behind a clear interface/module boundary so the README can credibly claim "swap in a different deterministic computation."
- **Update docs alongside code:** If you change the architecture, contract interfaces, or data flow described in `ARCHITECTURE.md`, update that file in the same change.
- **Stuck on the RISC Zero ↔ Soroban integration?** Reference:
  - https://github.com/NethermindEth/stellar-risc0-verifier
  - https://jamesbachini.com/stellar-risc-zero-games/
  - https://developers.stellar.org/docs/build/apps/zk
  - https://skills.stellar.org/ (Stellar agent skills — read these for Soroban/SDK conventions)

## Agent / IDE Skill References

- Cursor Soroban rules: `.cursor/rules/stellar.mdc`
- Stellar builder playbook: `.cursor/skills/stellar-builder/SKILL.md`
- VS Code Copilot instructions: `.github/copilot-instructions.md`

## Current Status

See `TASKS.md` for the live checklist. Update it as work progresses so context isn't lost between sessions.
