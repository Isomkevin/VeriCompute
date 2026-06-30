# GitHub Copilot Instructions — VeriCompute

Use these instructions for all Copilot-assisted edits in this repository.

## Read first (source of truth)

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `TASKS.md`
4. `.cursorrules`
5. `CLAUDE.md`
6. `AGENT_HANDOFF.md`

## Non‑negotiables

- **Stellar testnet only** (no mainnet deploy/config).
- **ZK is load‑bearing**: never present mocked verification as real on-chain verification.
- **General protocol**: keep “credit scoring” as a swappable module behind an interface.
- **Verifier**: adapt from `NethermindEth/stellar-risc0-verifier` (no custom Groth16 verifier).
- **Frontend**: Next.js (App Router) + TypeScript strict + Tailwind.
- **Wallet integration**: Stellar Wallets Kit (`@creit.tech/stellar-wallets-kit`).
- **Chain SDK**: `@stellar/stellar-sdk`.
- **Config**: RPC URLs, passphrases, contract IDs from env vars; never hardcode addresses in components.

## Soroban rules (security-critical)

- **No implicit caller**: call `require_auth()` for every action performed on behalf of an address.
- Use correct storage tier (persistent/temporary/instance) and manage **TTL** correctly.
- Prefer small, deterministic contracts; emit events for state changes.

## Repo navigation

- **Local frontend:** `cp .env.example apps/web/.env.local` then `cd apps/web && npm run dev` → http://localhost:3000 (no root-level `dev` script)
- Cursor Soroban rule file: `.cursor/rules/stellar.mdc`
- Stellar builder playbook: `.cursor/skills/stellar-builder/SKILL.md`

