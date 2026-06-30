# VeriCompute Web App

Next.js (App Router) frontend for the VeriCompute demo — landing page, `/demo` flow, wallet integration, and API routes that orchestrate proving and Soroban transactions.

## Run on localhost

From the **repo root**:

```bash
cp .env.example apps/web/.env.local
cd apps/web
npm install
npm run dev
```

**Windows (PowerShell):**

```powershell
Copy-Item "..\.env.example" ".env.local"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo lives at [http://localhost:3000/demo](http://localhost:3000/demo).

> Do not run `npm run dev` from the monorepo root — the `dev` script is defined here in `apps/web` only.

## Environment

Config is loaded from `apps/web/.env.local` (copy from the root `.env.example`). Key variables:

| Variable | Required for UI | Purpose |
|----------|-----------------|---------|
| `NEXT_PUBLIC_VERIFIER_CONTRACT_ID` | No (banner shown if empty) | Deployed Groth16 verifier |
| `NEXT_PUBLIC_ESCROW_CONTRACT_ID` | No | Deployed `LoanEscrow` |
| `PROVER_WSL_REPO_PATH` | For proving on Windows | WSL path to repo for `/api/prove` subprocess |
| `PROVER_SERVICE_URL` | Alternative to WSL | HTTP prover base URL (`POST /prove`) |

See the root [README](../../README.md#environment-variables) for the full list and deploy workflow.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Project docs

- [README](../../README.md) — quick start and full stack setup
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — component boundaries and local dev tiers
- [TASKS.md](../../TASKS.md) — build phases and checklist
