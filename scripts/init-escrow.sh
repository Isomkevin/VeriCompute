#!/usr/bin/env bash
set -euo pipefail

# Initialize LoanEscrow after deploy. Requires proof.json for guest image_id.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-vericompute}"
DEPLOYMENTS="$ROOT/deployments/${NETWORK}.json"
PROOF="${PROOF:-$ROOT/proof.json}"

# Native XLM SAC on Soroban testnet (Stellar Asset Contract for XLM)
TOKEN_CONTRACT_ID="${TOKEN_CONTRACT_ID:-CDLZFC3SYJYDZT7K7VZ75HMSCV4MAZJSDLX4S5HD3NF4AXR7HWPN3NWA}"

ESCROW_ID="${ESCROW_CONTRACT_ID:-$(jq -r .escrow_contract_id "$DEPLOYMENTS")}"
VERIFIER_ID="${VERIFIER_CONTRACT_ID:-$(jq -r .verifier_contract_id "$DEPLOYMENTS")}"
IMAGE_ID="$(jq -r .image_id "$PROOF")"
ADMIN="$(stellar keys address "$IDENTITY")"

echo "Initializing escrow $ESCROW_ID"
echo "  admin:    $ADMIN"
echo "  verifier: $VERIFIER_ID"
echo "  image_id: $IMAGE_ID"
echo "  token:    $TOKEN_CONTRACT_ID"

stellar contract invoke \
  --network "$NETWORK" \
  --source-account "$IDENTITY" \
  --id "$ESCROW_ID" \
  -- \
  init \
  --admin "$ADMIN" \
  --verifier "$VERIFIER_ID" \
  --image_id "$IMAGE_ID" \
  --token "$TOKEN_CONTRACT_ID"

jq --arg token "$TOKEN_CONTRACT_ID" --arg image "$IMAGE_ID" \
  '. + {token_contract_id: $token, guest_image_id: $image, initialized: true}' \
  "$DEPLOYMENTS" >"$DEPLOYMENTS.tmp" && mv "$DEPLOYMENTS.tmp" "$DEPLOYMENTS"

echo "Escrow initialized. Updated $DEPLOYMENTS"
