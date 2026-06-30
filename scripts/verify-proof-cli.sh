#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-vericompute}"
PROOF="${PROOF:-$ROOT/proof.json}"
DEPLOYMENTS="$ROOT/deployments/${NETWORK}.json"

VERIFIER_ID="${VERIFIER_CONTRACT_ID:-$(jq -r .verifier_contract_id "$DEPLOYMENTS")}"

SEAL=$(jq -r .seal "$PROOF")
IMAGE_ID=$(jq -r .image_id "$PROOF")
JOURNAL_DIGEST=$(jq -r .journal_digest "$PROOF")

stellar contract invoke \
  --send=no \
  --network "$NETWORK" \
  --source-account "$IDENTITY" \
  --id "$VERIFIER_ID" \
  -- \
  verify \
  --seal "$SEAL" \
  --image_id "$IMAGE_ID" \
  --journal "$JOURNAL_DIGEST"

echo "verify simulation succeeded"
