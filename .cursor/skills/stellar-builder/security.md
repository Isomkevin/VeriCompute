# Part 6: Security — The Soroban Audit Checklist

## 6.1 Top 10 Soroban Exploit Patterns

```
AI AUDIT PROMPT:
"Audit this Stellar Soroban contract for the 10 most critical vulnerabilities.
For each: state if vulnerable, explain impact, show exact fix.

1. MISSING require_auth (CRITICAL — most common Soroban exploit)
   Does every function that acts on behalf of an address call address.require_auth()?
   'transfer(from, to, amount)' MUST call from.require_auth() — no exceptions.
   Forgetting this lets ANYONE drain funds from arbitrary addresses.

2. WRONG STORAGE TIER
   Is Temporary storage used for any data that must survive beyond a single ledger?
   Is Instance storage used for any unbounded/growing collections (balances map, etc.)?
   Instance storage loads on EVERY call — bloating it creates a DoS vulnerability.

3. MISSING TTL EXTENSION (CRITICAL for Persistent storage)
   Is every Persistent storage read/write followed by extend_ttl()?
   Expired Persistent data is archived and INACCESSIBLE until restored.
   For token balances: this means funds become unreachable without a restore operation.

4. UNCHECKED ARITHMETIC
   Are all i128 arithmetic operations using .checked_add() / .checked_mul()?
   Integer overflow in Soroban causes panics, not silent wrapping.
   Division by zero causes panics — always check before dividing.

5. UNPROTECTED INITIALIZATION
   Can the initialize function be called more than once?
   Must check and set an INITIALIZED flag in Instance storage before proceeding.

6. UNPROTECTED CONTRACT UPGRADE
   Does update_current_contract_wasm require admin.require_auth()?
   Without this, anyone can replace the contract WASM with malicious code.

7. REENTRANCY (WASM sub-calls)
   Does the contract call another contract while in an intermediate state?
   Update own state BEFORE making sub-contract calls (Checks-Effects-Interactions).

8. IMPROPER AUTH PROPAGATION IN CPI
   When calling sub-contracts, does auth propagate correctly?
   Sub-contract calls require explicit auth setup via env.invoke_contract.
   Not all auth is automatically forwarded — verify each CPI path.

9. INSUFFICIENT INPUT VALIDATION
   Are amounts validated to be > 0?
   Are addresses validated to be non-zero?
   Can an attacker pass malformed Symbol or Vec to cause panics?

10. EVENT OMISSION
    Are events emitted for ALL state changes?
    Missing events make it impossible to audit contract activity off-chain."
```

## 6.2 CI/CD Security Pipeline

```yaml
# .github/workflows/stellar-ci.yml
name: Stellar / Soroban Build & Security Pipeline

on: [push, pull_request]

jobs:
  build-test:
    name: Build, Optimize & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust + WASM target
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
          components: clippy, rustfmt

      - name: Cache Rust
        uses: Swatinem/rust-cache@v2

      - name: Install Stellar CLI
        run: cargo install --locked stellar-cli --features opt

      - name: Rustfmt
        run: cargo fmt --check

      - name: Clippy (zero warnings)
        run: cargo clippy -- -D warnings

      - name: Build WASM
        run: stellar contract build

      - name: Optimize WASM
        run: stellar contract optimize --wasm target/wasm32-unknown-unknown/release/my_contract.wasm

      - name: Check WASM size (must be under 64KB)
        run: |
          SIZE=$(stat -c%s target/wasm32-unknown-unknown/release/optimized/my_contract.wasm 2>/dev/null || stat -f%z target/wasm32-unknown-unknown/release/optimized/my_contract.wasm)
          echo "WASM size: $SIZE bytes"
          if [ "$SIZE" -gt 65536 ]; then
            echo "❌ WASM exceeds 64KB limit ($SIZE bytes)"
            exit 1
          fi
          echo "✓ WASM within size limit"

      - name: Run tests
        run: cargo test --features testutils

  security:
    name: Security Checks
    runs-on: ubuntu-latest
    needs: build-test
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable

      - name: Cargo audit
        run: |
          cargo install cargo-audit
          cargo audit

      - name: Scan for missing require_auth
        run: |
          # Heuristic: flag pub fn that take Address params but don't call require_auth
          python3 - <<'EOF'
          import re, sys, pathlib
          errors = []
          for f in pathlib.Path("contracts").rglob("*.rs"):
              text = f.read_text()
              fns = re.findall(r'pub fn \w+\([^)]*Address[^)]*\)[^{]*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}', text, re.DOTALL)
              for body in fns:
                  if "require_auth" not in body and "mock_all_auths" not in body:
                      errors.append(f"⚠️  {f}: pub fn with Address param missing require_auth check")
          if errors:
              print("\n".join(errors))
          EOF

      - name: Check .env in .gitignore
        run: |
          grep -q "^\.env$" .gitignore || (echo "❌ .env not in .gitignore" && exit 1)
          echo "✓ .gitignore includes .env"
```
