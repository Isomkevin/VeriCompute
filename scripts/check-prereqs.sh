#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="${HOME}/.cargo/bin:${HOME}/.risc0/bin:${PATH}"

ok() { echo "  OK   $1"; }
fail() { echo "  FAIL $1"; FAIL=1; }

FAIL=0
echo "VeriCompute prerequisite check"
echo

command -v rustc >/dev/null 2>&1 && ok "rustc $(rustc --version)" || fail "rustc — run ./scripts/setup-wsl.sh"
command -v cargo >/dev/null 2>&1 && ok "cargo" || fail "cargo"
command -v jq >/dev/null 2>&1 && ok "jq" || fail "jq — sudo apt install jq"
command -v rzup >/dev/null 2>&1 && ok "rzup" || fail "rzup — curl -L https://risczero.com/install | bash"
rustup target list --installed 2>/dev/null | grep -q wasm32v1-none && ok "wasm32v1-none target" || fail "rustup target add wasm32v1-none"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  ok "docker (running)"
else
  fail "docker — start Docker Desktop with WSL integration or sudo service docker start"
fi

if command -v stellar >/dev/null 2>&1; then
  ok "stellar $(stellar --version 2>/dev/null | head -1)"
else
  fail "stellar-cli — ./scripts/install-stellar-cli.sh (needs libdbus-1-dev)"
fi

if [[ -f "$ROOT/vendor/stellar-risc0-verifier/Cargo.toml" ]]; then
  ok "vendored verifier"
else
  fail "verifier not vendored — ./scripts/vendor-verifier.sh"
fi

if [[ -f "$ROOT/proof.json" ]]; then
  ok "proof.json present"
else
  echo "  WARN proof.json missing — run ./scripts/prove.sh after toolchain OK"
fi

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "All required prerequisites satisfied. Run: NETWORK=testnet IDENTITY=vericompute ./scripts/full-e2e.sh"
else
  echo "Fix failures above, then re-run this script."
  exit 1
fi
