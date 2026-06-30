# Agent Handoff Contract (Claude Code / Copilot / AntiGravity)

This repo is designed so multiple coding agents can pick up from each other **without changing the intended architecture** or breaking demo constraints.

## Non‑negotiables (project constraints)

- **Testnet only**: never deploy to Stellar mainnet in this repo.
- **ZK is load‑bearing**: do not fake “verified on-chain” states. If mocked, label clearly.
- **General protocol**: keep “credit scoring” modular/swappable; don’t bake it into core flow.
- **No new chains / trust fallbacks**: do not introduce alternative verification paths that replace on-chain verification.
- **No hardcoded network config**: RPC URLs, passphrases, contract IDs come from env vars.
- **Verifier contract**: adapt from `NethermindEth/stellar-risc0-verifier` (do not implement Groth16 verifier from scratch).

## Source of truth files (read first)

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `TASKS.md`
4. `.cursorrules`
5. `CLAUDE.md`

## Where “Stellar/Soroban rules” live

- Cursor rules (auto-applied): `.cursor/rules/stellar.mdc`
- Stellar builder skill (reference): `.cursor/skills/stellar-builder/SKILL.md`

## Handoff checklist (what to leave behind)

When you stop work, leave the next agent a clean pickup point:

- Update `TASKS.md` checkboxes for completed items and add a short note under “Notes / Decisions Log” if you made a key decision.
- If you added/changed an interface, update `ARCHITECTURE.md`.
- If you added required env vars, update `ARCHITECTURE.md` + add to `.env.example` (when it exists).
- Keep changes small and incremental; avoid large refactors during Phase 0/1.

