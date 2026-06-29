---
name: stellar-builder
description: >
  AI-accelerated development on Stellar. Covers Soroban smart contracts (Rust/WASM),
  storage tiers and TTL management, Stellar Asset Contracts, passkey smart wallets,
  cross-contract calls, security audits, frontend SDK integration, and the full 10x
  AI-agent workflow with Claude Code and Cursor. Use when the user mentions build on
  Stellar, Soroban, Stellar smart contract, Soroban CLI, soroban-sdk, Stellar asset,
  XLM, Stellar testnet, Freighter wallet, Launchtube, stellar-sdk, SEP-0010, Stellar
  passkey, or smart wallet Stellar.
---

# STELLAR BUILDER SKILL
## AI-Accelerated Development on Stellar — The 10x Builder Playbook

**Version:** 2.0 | **Updated:** June 2026 | **Network:** Mainnet + Protocol 22+

## VeriCompute Project Notes

This repo is a hackathon project (**testnet only** — do not deploy to mainnet). Before structural changes, read `PRD.md`, `ARCHITECTURE.md`, and `TASKS.md`.

- **ZK verifier:** adapt from [NethermindEth/stellar-risc0-verifier](https://github.com/NethermindEth/stellar-risc0-verifier) — do not write Groth16 verifier from scratch
- **Wallet:** `@creit.tech/stellar-wallets-kit` (not Freighter-only)
- **Contracts:** `contracts/verifier/`, `contracts/escrow/`
- **Frontend:** `apps/web/` with `@stellar/stellar-sdk`

---

## PART 1: THE STELLAR / SOROBAN MENTAL MODEL

AI agents must internalize this before writing a single line. Stellar is NOT EVM and NOT Solana. It has a unique execution environment with specific constraints that catch every developer off-guard the first time.

### 1.1 Stellar vs EVM — Critical Differences

| Concept | EVM | Stellar / Soroban |
|---------|-----|-------------------|
| **Language** | Solidity | Rust → compiled to WASM |
| **State** | Storage slots in contract | Key-value store with **3 storage tiers + TTL** |
| **Auth** | `msg.sender` implicit | `env.require_auth(&address)` — **explicit, every time** |
| **Tokens** | Custom ERC-20 contracts | Built-in **Stellar Asset Contract (SAC)** for all classic assets |
| **Fees** | Gas in ETH | Resource fees: CPU, memory, ledger reads/writes, events |
| **Finality** | ~12s (ETH) | **5 seconds** (targeting 2.5s with 2025 roadmap) |
| **Wallet auth** | Private key / seed phrase | **Passkeys** (secp256r1, WebAuthn) — native since Protocol 21 |
| **Upgradeability** | Proxy patterns | Built-in WASM upgrade via `update_current_contract_wasm` |
| **Cross-contract** | Arbitrary calls | Sub-contract invocations with explicit auth propagation |

### 1.2 The Three Storage Tiers — The Most Important Thing to Understand

```
Soroban has THREE storage types. Using the wrong one is both a security
vulnerability AND a DoS vector. Every key must be TTL-managed or it expires.

┌─────────────────────────────────────────────────────────────────────┐
│ PERSISTENT  env.storage().persistent()                              │
│ • Survives forever IF TTL is extended                               │
│ • Archival: expired entries go to archive, can be restored          │
│ • Use for: token balances, allowances, config, user state           │
│ • Cost: highest (charged per ledger it lives)                       │
│ • ⚠️  MUST extend TTL on every read/write for critical data         │
├─────────────────────────────────────────────────────────────────────┤
│ TEMPORARY   env.storage().temporary()                               │
│ • Expires and is DELETED permanently after TTL (no archive)         │
│ • Use for: nonces, rate limits, expiring offers, short-lived state  │
│ • Cost: lowest                                                      │
│ • ⚠️  Treat as volatile — NEVER store critical state here           │
├─────────────────────────────────────────────────────────────────────┤
│ INSTANCE    env.storage().instance()                                │
│ • Tied to contract instance lifetime                                │
│ • ALL keys loaded on every contract call (avoid large data here)    │
│ • Use for: admin address, token metadata, contract flags            │
│ • ⚠️  DO NOT store unbounded/growing data — DoS via instance bloat  │
└─────────────────────────────────────────────────────────────────────┘

TTL units: ledgers (1 ledger ≈ 5 seconds on mainnet)
Max TTL: 535,679 ledgers (~31 days)
Safe pattern: extend TTL on every interaction for persistent data
```

### 1.3 Authorization — The #1 Source of Soroban Exploits

```rust
// ❌ WRONG — This does NOT check authorization. Anyone can call this.
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    // Just reads/writes storage — NO auth check!
    let balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
    env.storage().persistent().set(&from, &(balance - amount));
}

// ✅ CORRECT — require_auth MUST be called for the from address
pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    from.require_auth();  // ← This is mandatory. No implicit sender.
    let balance: i128 = env.storage().persistent().get(&from).unwrap_or(0);
    env.storage().persistent().set(&from, &(balance - amount));
}
```

**The rule:** `require_auth` is not optional sugar — it is the ONLY way to verify
that an address consented to the action. Soroban does not have an implicit caller
like `msg.sender`. Forgetting it is a critical vulnerability that has drained funds.

---

## PART 2: THE AI-AGENT DEVELOPMENT STACK

### 2.1 Choosing Your AI Coding Agent for Stellar

| Agent | Best For | Stellar-Specific Setup |
|-------|---------|----------------------|
| **Claude Code** | Architecture, full audits, cross-contract reasoning, WASM size optimization | Add `CLAUDE.md` with storage tier and auth rules |
| **Cursor** | Daily contract dev, test generation, SDK integration | Add `.cursor/rules/stellar.mdc` |
| **Windsurf** | Agentic multi-file workflows | Add `AGENTS.md` |
| **GitHub Copilot** | Teams with existing GitHub workflows | Add Soroban examples to Copilot context |

### 2.2 Environment Setup

**Option A — Stellar IDE (Zero-Install, Fastest)**
```
Visit: https://www.stellaride.dev/
→ Browser-native Soroban IDE
→ Write, compile, test, deploy in-browser
→ AI-assisted, free, open source
→ Best for: prototyping, learning, hackathons
```

**Option B — Local Full Setup**
```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown    # ← REQUIRED for Soroban WASM compilation
rustup component add rustfmt clippy

# 2. Install Stellar CLI (replaces old Soroban CLI — same tool, new name)
cargo install --locked stellar-cli --features opt

# Verify
stellar --version

# 3. Install Node.js v20+ for SDK / tests
# nvm install 20 && nvm use 20

# 4. Configure network identities
stellar keys generate alice --network testnet
stellar keys generate bob --network testnet
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
stellar network add mainnet \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# 5. Fund testnet account
stellar keys fund alice --network testnet
```

**Option C — Quickstart Docker (Full Local Node)**
```bash
# Runs a local Stellar node + Soroban RPC for offline development
docker pull stellar/quickstart:latest
docker run --rm -it \
  -p 8000:8000 \
  stellar/quickstart:latest \
  --standalone \
  --enable-soroban-rpc
# RPC endpoint: http://localhost:8000/soroban/rpc
```

---

## PART 3: AI AGENT CONFIGURATION FILES

Project rule file: `.cursor/rules/stellar.mdc` (auto-applies to contract and SDK files).

For `CLAUDE.md` template, `Cargo.toml` canonical config, contract patterns, workflows, security checklist, and network reference, see:

- [patterns.md](patterns.md) — Part 4: Soroban contract patterns + frontend integration
- [workflows.md](workflows.md) — Part 5: 10x builder AI workflows + deployment pipeline
- [security.md](security.md) — Part 6: Security audit checklist + CI/CD pipeline
- [network-reference.md](network-reference.md) — Parts 7–8: Network configs, tools, troubleshooting, June 2026 state
