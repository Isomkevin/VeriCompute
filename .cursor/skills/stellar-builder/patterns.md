# Part 4: Soroban Contract Patterns

## 3.2 `CLAUDE.md` — For Claude Code

```markdown
# CLAUDE.md — Stellar / Soroban Project Instructions

## Project Type
Stellar blockchain project — Soroban smart contracts (Rust → WASM).
Non-EVM. Non-Solana. Unique auth and storage model. June 2026.

## The Three Rules That Must Never Be Broken

1. REQUIRE_AUTH: Every function that acts on behalf of an address MUST call
   address.require_auth(). There is no implicit sender. This is the #1 exploit.

2. STORAGE TIERS + TTL: Use the right storage tier. Extend TTL on Persistent data.
   Never put critical state in Temporary. Never put unbounded data in Instance.

3. NO_STD: Every contract must be #![no_std]. Cannot use Rust standard library.
   Use soroban_sdk types: Map, Vec, String, Symbol — not std equivalents.

## Networks

| Network  | RPC                                                 | Passphrase                                       |
|----------|-----------------------------------------------------|--------------------------------------------------|
| Testnet  | https://soroban-testnet.stellar.org                 | Test SDF Network ; September 2015               |
| Mainnet  | https://soroban-rpc.mainnet.stellar.gateway.fm      | Public Global Stellar Network ; September 2015  |
| Local    | http://localhost:8000/soroban/rpc                   | Standalone Network ; February 2017              |

## Standard Workflow

1. stellar contract build                          # compile to WASM
2. stellar contract optimize                       # shrink WASM (mandatory — 64KB limit)
3. cargo test                                      # run unit + integration tests
4. cargo clippy -- -D warnings                     # lint
5. stellar contract deploy --network testnet       # deploy to testnet
6. stellar contract invoke --network testnet       # smoke test on testnet
7. stellar contract deploy --network mainnet       # mainnet only after testnet validated

## Common CLI Commands

```bash
# Build
stellar contract build
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/my_contract.wasm

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/my_contract.wasm \
  --source alice \
  --network testnet

# Invoke a function
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- \
  transfer \
  --from alice \
  --to bob \
  --amount 1000

# Check WASM size
ls -la target/wasm32-unknown-unknown/release/optimized/*.wasm

# Extend contract TTL
stellar contract extend \
  --id <CONTRACT_ID> \
  --ledgers-to-extend 535679 \
  --source alice \
  --network testnet

# Restore archived contract entry
stellar contract restore \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet
```

## What to Check Before Returning ANY Contract Code

1. Is `#![no_std]` at the top of every contract file?
2. Does every function acting on behalf of an address call `address.require_auth()`?
3. Is the correct storage tier used (Persistent/Temporary/Instance)?
4. Is TTL extended on every Persistent storage read/write?
5. Is Instance storage free of unbounded/growing data?
6. Are all arithmetic operations using checked methods?
7. Does the WASM fit within 64KB after optimization?
8. Are events emitted for all state changes?
9. Is `.env` in `.gitignore`?
```

## 3.3 `Cargo.toml` — Canonical Soroban Config

```toml
[workspace]
resolver = "2"
members = ["contracts/*"]

[profile.release]
opt-level = "z"        # optimize for size — WASM has a 64KB limit
overflow-checks = true # catch arithmetic overflow
debug = false
strip = "symbols"

# Per-contract Cargo.toml:
[package]
name = "my-contract"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]   # ← REQUIRED for WASM compilation

[dependencies]
soroban-sdk = { version = "22", features = ["alloc"] }

# OpenZeppelin Stellar Contracts (audited standards)
stellar-fungible = { git = "https://github.com/OpenZeppelin/stellar-contracts" }
stellar-non-fungible = { git = "https://github.com/OpenZeppelin/stellar-contracts" }

[dev-dependencies]
soroban-sdk = { version = "22", features = ["testutils"] }

[features]
testutils = ["soroban-sdk/testutils"]
```

---

## 4.1 Fungible Token (OpenZeppelin Standard)

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};

// ✅ Use OpenZeppelin Stellar Contracts — audited, standard-compliant
// https://docs.openzeppelin.com/stellar-contracts
// stellar-fungible handles: balances, allowances, transfer, mint, burn, TTL
use stellar_fungible::FungibleToken;
use stellar_fungible::storage::{read_metadata, write_metadata, TokenMetadata};

#[contract]
pub struct MyToken;

#[contractimpl]
impl MyToken {
    /// Initialize the token. Can only be called once.
    pub fn initialize(
        env: Env,
        admin: Address,
        decimals: u32,
        name: String,
        symbol: String,
        initial_supply: i128,
    ) {
        // Prevent re-initialization
        if env.storage().instance().has(&symbol_short!("INIT")) {
            panic!("already initialized");
        }
        env.storage().instance().set(&symbol_short!("INIT"), &true);

        write_metadata(&env, TokenMetadata { decimals, name, symbol });
        env.storage().instance().set(&symbol_short!("ADMIN"), &admin);

        if initial_supply > 0 {
            stellar_fungible::mint(&env, &admin, initial_supply);
        }
    }

    /// Mint new tokens — admin only
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance()
            .get(&symbol_short!("ADMIN")).unwrap();
        admin.require_auth();   // ← mandatory
        stellar_fungible::mint(&env, &to, amount);
        env.events().publish((symbol_short!("mint"), to), amount);
    }

    /// Transfer tokens — delegated to OpenZeppelin impl which handles require_auth
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        stellar_fungible::transfer(&env, &from, &to, amount);
        // stellar_fungible::transfer calls from.require_auth() internally
    }
}
```

## 4.2 Manual Token with Full Storage + TTL Management

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

// TTL constants (in ledgers, 1 ledger ≈ 5 seconds)
const LEDGER_THRESHOLD: u32 = 518_400;  // ~30 days
const LEDGER_BUMP: u32 = 535_679;       // ~31 days (max TTL)

const BALANCE_KEY: fn(&Address) -> (Symbol, Address) = |addr| (symbol_short!("BAL"), addr.clone());

#[contract]
pub struct Token;

#[contracterror]
#[derive(Copy, Clone)]
pub enum TokenError {
    InsufficientBalance = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    NegativeAmount = 4,
}

#[contractimpl]
impl Token {
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), TokenError> {
        // ✅ MANDATORY auth check
        from.require_auth();

        if amount <= 0 {
            return Err(TokenError::NegativeAmount);
        }

        let from_key = BALANCE_KEY(&from);
        let to_key = BALANCE_KEY(&to);

        let from_balance: i128 = env.storage().persistent()
            .get(&from_key).unwrap_or(0);

        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        // ✅ Extend TTL on every Persistent read/write
        env.storage().persistent()
            .set(&from_key, &(from_balance - amount));
        env.storage().persistent()
            .extend_ttl(&from_key, LEDGER_THRESHOLD, LEDGER_BUMP);

        let to_balance: i128 = env.storage().persistent()
            .get(&to_key).unwrap_or(0);
        env.storage().persistent()
            .set(&to_key, &(to_balance + amount));
        env.storage().persistent()
            .extend_ttl(&to_key, LEDGER_THRESHOLD, LEDGER_BUMP);

        // ✅ Emit event for all state changes
        env.events().publish(
            (symbol_short!("transfer"), from, to),
            amount,
        );

        Ok(())
    }
}
```

## 4.3 Contract Test Template

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, TokenClient) {
        let env = Env::default();
        env.mock_all_auths();     // ← mock auth for testing

        let contract_id = env.register_contract(None, Token);
        let client = TokenClient::new(&env, &contract_id);
        (env, client)
    }

    #[test]
    fn test_transfer_success() {
        let (env, client) = setup();
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        // Seed balances directly in storage
        env.as_contract(&client.address, || {
            env.storage().persistent().set(
                &(symbol_short!("BAL"), alice.clone()),
                &1000_i128,
            );
        });

        client.transfer(&alice, &bob, &500);

        env.as_contract(&client.address, || {
            let bal: i128 = env.storage().persistent()
                .get(&(symbol_short!("BAL"), bob.clone())).unwrap();
            assert_eq!(bal, 500);
        });
    }

    #[test]
    #[should_panic(expected = "InsufficientBalance")]
    fn test_transfer_insufficient_balance() {
        let (env, client) = setup();
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        client.transfer(&alice, &bob, &100); // alice has 0 balance
    }

    #[test]
    fn test_auth_required_for_transfer() {
        let env = Env::default();
        // Do NOT mock auth this time
        let contract_id = env.register_contract(None, Token);
        let client = TokenClient::new(&env, &contract_id);
        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        // Should panic because alice hasn't authorized
        let result = std::panic::catch_unwind(|| {
            client.transfer(&alice, &bob, &100);
        });
        assert!(result.is_err(), "Transfer without auth should fail");
    }
}
```

## 4.4 Frontend Integration (`@stellar/stellar-sdk`)

```typescript
import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Keypair,
  Address,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";

const server = new Server("https://soroban-testnet.stellar.org");
const networkPassphrase = Networks.TESTNET;
const CONTRACT_ID = "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

async function callTransfer(
  senderKeypair: Keypair,
  toAddress: string,
  amount: bigint
) {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(senderKeypair.publicKey());

  // Build transaction
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "transfer",
        new Address(senderKeypair.publicKey()).toScVal(),
        new Address(toAddress).toScVal(),
        nativeToScVal(amount, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  // ✅ ALWAYS simulate first — catches errors, estimates fees
  const simResult = await server.simulateTransaction(tx);
  if ("error" in simResult) throw new Error(simResult.error);

  // Assemble with actual resource fees from simulation
  const assembledTx = TransactionBuilder.cloneFrom(tx)
    .clearOperations()
    .addOperation(
      contract.call("transfer", /* same args */)
    )
    .build();

  // Use Launchtube for managed submission (handles fees + sequence numbers)
  // OR sign and submit directly:
  assembledTx.sign(senderKeypair);
  const result = await server.sendTransaction(assembledTx);
  return result;
}
```

## 4.5 Passkey / Smart Wallet Integration

```typescript
// Use passkey-kit SDK for WebAuthn-based signing (no seed phrases)
// https://github.com/kalepail/passkey-kit

import { PasskeyKit, PasskeyServer } from "passkey-kit";

const account = new PasskeyKit({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  factoryContractId: "YOUR_FACTORY_CONTRACT_ID",
});

// Create a new smart wallet (registers passkey on device)
const { contractId, signedTx } = await account.createWallet(
  "My App",    // relying party name
  "username"   // display name for passkey
);

// Sign a transaction with biometrics (FaceID / TouchID)
const signedTransaction = await account.sign(transaction, { keyId: passkeyId });

// Submit via Launchtube (handles XLM fees on behalf of user)
// https://launchtube.xyz
const response = await fetch("https://testnet.launchtube.xyz/submit", {
  method: "POST",
  headers: { Authorization: `Bearer ${LAUNCHTUBE_TOKEN}` },
  body: new URLSearchParams({ xdr: signedTransaction.toXDR() }),
});
```
