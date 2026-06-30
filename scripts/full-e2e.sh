#!/usr/bin/env bash
set -euo pipefail

# Full local → testnet checkpoint:
# 1) prove  2) deploy contracts  3) verify proof  4) init escrow  5) escrow e2e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-vericompute}"

export NETWORK IDENTITY

echo "==> Step 1: Generate Groth16 proof"
"$ROOT/scripts/prove.sh"

echo "==> Step 2: Ensure testnet identity"
if ! stellar keys address "$IDENTITY" &>/dev/null; then
  stellar keys generate "$IDENTITY" --network "$NETWORK"
fi
stellar keys fund "$IDENTITY" --network "$NETWORK" || true

echo "==> Step 3: Deploy verifier + escrow"
"$ROOT/scripts/deploy-testnet.sh"

echo "==> Step 4: Verify proof on-chain (verifier only)"
"$ROOT/scripts/verify-proof-cli.sh"

echo "==> Step 5: Initialize escrow"
"$ROOT/scripts/init-escrow.sh"

echo "==> Step 6: Escrow create + settle"
"$ROOT/scripts/test-escrow-flow.sh"

echo "==> Full E2E complete. See deployments/${NETWORK}.json"
