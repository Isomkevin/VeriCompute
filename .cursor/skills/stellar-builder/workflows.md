# Part 5: The 10x Builder AI Workflows

## 5.1 Project Scaffolding

```
CLAUDE CODE PROMPT:
"Scaffold a complete Soroban smart contract project on Stellar for a [DESCRIBE APP]:

Requirements:
- Multi-file structure: lib.rs, storage.rs (keys + TTL constants), errors.rs
  (#[contracterror] enum), events.rs
- #![no_std] on all contract files
- All storage correctly tiered: Persistent for user state, Instance for config
- TTL extension on every Persistent read/write (LEDGER_THRESHOLD=518400, LEDGER_BUMP=535679)
- require_auth() on every function acting on behalf of an address
- All arithmetic uses checked_add/checked_mul
- #[contracttype] for all on-chain data structures
- Events emitted for all state changes via env.events().publish()
- Full Rust test suite: happy path + all error variants + auth tests
- Cargo.toml with opt-level='z' and overflow-checks=true
- CLAUDE.md and .cursor/rules/stellar.mdc at project root

Use OpenZeppelin Stellar Contracts for token standards.
Verify WASM fits within 64KB after stellar contract optimize.
Do not return code until all checks pass."
```

## 5.2 Security Audit Loop

```bash
# Step 1: Cargo clippy (Rust linter)
cargo clippy -- -D warnings

# Step 2: Check WASM size
stellar contract build && stellar contract optimize
ls -la target/wasm32-unknown-unknown/release/optimized/
# Must be under 64KB

# Step 3: Run tests
cargo test --features testutils

# Step 4: AI security review
# PROMPT: "Audit this Soroban contract for the Top 10 Soroban vulnerabilities.
# See security.md for the full checklist."
```

## 5.3 Deployment Pipeline

```bash
# 1. Build + optimize
stellar contract build
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/my_contract.wasm

# 2. Deploy to testnet
TESTNET_CONTRACT=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/optimized/my_contract.wasm \
  --source alice \
  --network testnet)
echo "Testnet contract: $TESTNET_CONTRACT"

# 3. Initialize
stellar contract invoke \
  --id $TESTNET_CONTRACT \
  --source alice \
  --network testnet \
  -- initialize --admin alice

# 4. Run smoke tests
stellar contract invoke \
  --id $TESTNET_CONTRACT \
  --source alice \
  --network testnet \
  -- my_function --arg1 value1

# 5. After testnet validation → mainnet
MAINNET_CONTRACT=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/optimized/my_contract.wasm \
  --source alice \
  --network mainnet)
```
