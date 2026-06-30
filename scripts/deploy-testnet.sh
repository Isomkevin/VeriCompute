#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-vericompute}"
DEPLOYMENTS="$ROOT/deployments/${NETWORK}.json"

mkdir -p "$(dirname "$DEPLOYMENTS")"
"$ROOT/scripts/vendor-verifier.sh"

VERIFIER_WASM="$ROOT/vendor/stellar-risc0-verifier/target/wasm32v1-none/release/groth16_verifier.wasm"
ESCROW_WASM="$ROOT/contracts/escrow/target/wasm32v1-none/release/vericompute_escrow.wasm"

echo "Building verifier..."
cd "$ROOT/vendor/stellar-risc0-verifier"
rustup target add wasm32v1-none
stellar contract build --optimize

echo "Building escrow..."
cd "$ROOT/contracts/escrow"
stellar contract build --optimize

echo "Deploying verifier..."
VERIFIER_ID=$(stellar contract deploy \
  --wasm "$VERIFIER_WASM" \
  --network "$NETWORK" \
  --source-account "$IDENTITY")

echo "Deploying escrow (init requires image_id + token; run init separately after proving)..."
ESCROW_ID=$(stellar contract deploy \
  --wasm "$ESCROW_WASM" \
  --network "$NETWORK" \
  --source-account "$IDENTITY")

cat >"$DEPLOYMENTS" <<EOF
{
  "network": "$NETWORK",
  "verifier_contract_id": "$VERIFIER_ID",
  "escrow_contract_id": "$ESCROW_ID"
}
EOF

echo "Wrote $DEPLOYMENTS"
echo "Verifier: $VERIFIER_ID"
echo "Escrow:   $ESCROW_ID"
