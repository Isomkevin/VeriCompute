# Parts 7–8: Network Reference & June 2026 State

## 7.1 Network Configs

| Network  | RPC URL                                            | Passphrase                                       | Explorer |
|----------|----------------------------------------------------|--------------------------------------------------|---------|
| Testnet  | `https://soroban-testnet.stellar.org`              | `Test SDF Network ; September 2015`              | stellar.expert/testnet |
| Mainnet  | `https://soroban-rpc.mainnet.stellar.gateway.fm`   | `Public Global Stellar Network ; September 2015` | stellar.expert |
| Local    | `http://localhost:8000/soroban/rpc`                | `Standalone Network ; February 2017`             | — |

## 7.2 Complete Tool Directory

| Category | Tool | Purpose | Link |
|---------|------|---------|------|
| **Dev** | Stellar CLI | Build, deploy, invoke contracts | developers.stellar.org/docs/tools/stellar-cli |
| **Dev** | StellarIDE | Browser-native Soroban IDE | stellaride.dev |
| **Dev** | Quickstart Docker | Local Stellar node + RPC | hub.docker.com/r/stellar/quickstart |
| **SDK** | @stellar/stellar-sdk | JS/TS SDK for Stellar + Soroban | github.com/stellar/js-stellar-sdk |
| **SDK** | soroban-sdk (Rust) | Soroban contract SDK | docs.rs/soroban-sdk |
| **Contracts** | OpenZeppelin Stellar | Audited token + access control contracts | docs.openzeppelin.com/stellar-contracts |
| **Auth** | passkey-kit | Smart wallet + WebAuthn/passkey signing | github.com/kalepail/passkey-kit |
| **Tx** | Launchtube | Managed tx submission (fee + sequence abstraction) | launchtube.xyz |
| **Wallet** | Freighter | Browser wallet for Stellar | freighter.app |
| **Explorer** | stellar.expert | Block explorer + contract viewer | stellar.expert |
| **Explorer** | Stellar Lab | Dev tool: tx builder, API explorer | lab.stellar.org |
| **RPC** | QuickNode Stellar | Production RPC | quicknode.com/chains/stellar |
| **Security** | Soroban Audit Bank | Funded security audits for ecosystem | stellar.org/blog/developers/soroban-security-audit-bank |
| **AI Dev** | Claude Code | Terminal agent, audit, architecture | claude.ai/code |
| **AI Dev** | Cursor | IDE with .cursor/rules/ | cursor.com |
| **Grants** | SCF (Stellar Community Fund) | Grants for builders | communityfund.stellar.org |

## 7.3 Troubleshooting

**`wasm32-unknown-unknown target not found`**
→ Run: `rustup target add wasm32-unknown-unknown`

**Contract panics on `std::` use**
→ Add `#![no_std]` at top of lib.rs. Replace `std::` types with `soroban_sdk::` equivalents.

**"HostStorageError: TTL expired"**
→ Add `extend_ttl` calls after every Persistent storage read/write.
   For already-expired entries: `stellar contract restore --id <ID> --source alice --network testnet`

**WASM exceeds 64KB after optimize**
→ Reduce generic monomorphization (avoid large generics).
   Split large contracts into multiple smaller contracts.
   Use `opt-level = "z"` and `strip = "symbols"` in Cargo.toml release profile.

**`simulation error: missing footprint`**
→ A ledger key accessed during execution was not in the transaction's footprint.
   Usually caused by dynamic storage access patterns the simulator couldn't predict.
   Use `server.simulateTransaction()` and inspect the `footprint` field.

**Freighter not connecting on testnet**
→ In Freighter settings → Networks → Add Testnet with RPC `https://soroban-testnet.stellar.org`

---

## PART 8: NETWORK STATE — JUNE 2026

| Feature | Status | Builder Impact |
|---------|--------|---------------|
| **Protocol 22** | ✅ Mainnet | Increased WASM size limit (64KB); improved resource pricing |
| **Passkeys (secp256r1)** | ✅ Mainnet (Protocol 21) | Native WebAuthn in contracts; smart wallets without seed phrases |
| **Smart Wallets** | ✅ Production | passkey-kit + Launchtube; biometric tx signing for end users |
| **2.5s Ledger Close** | 🔄 Roadmap 2026 | Faster finality for payment apps; overlay + consensus pipeline improvements |
| **OpenZeppelin Stellar** | ✅ Audited | Use for all token + access control standards |
| **Soroban Audit Bank** | ✅ Active | $3M+ deployed; 40+ audits completed; apply via stellar.org |
| **Stellar Lab 4.0** | ✅ Live | Transaction simulation, debug, resource profiling |
| **State archival** | ✅ Active | Live/archived data separated; expired entries restorable |
