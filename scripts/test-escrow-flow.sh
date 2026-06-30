#!/usr/bin/env bash
set -euo pipefail

# End-to-end escrow test: create_request -> submit_proof_and_settle
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-vericompute}"
PROOF="${PROOF:-$ROOT/proof.json}"
DEPLOYMENTS="$ROOT/deployments/${NETWORK}.json"

ESCROW_ID="${ESCROW_CONTRACT_ID:-$(jq -r .escrow_contract_id "$DEPLOYMENTS")}"
ADDR="$(stellar keys address "$IDENTITY")"

SEAL=$(jq -r .seal "$PROOF")
IMAGE_ID=$(jq -r .image_id "$PROOF")
JOURNAL_DIGEST=$(jq -r .journal_digest "$PROOF")
JOURNAL_HEX=$(jq -r .journal_hex "$PROOF")
SCORE=$(jq -r .score "$PROOF")
THRESHOLD="${THRESHOLD:-600}"

echo "Creating loan request (threshold=$THRESHOLD, score from proof=$SCORE)..."
REQUEST_ID=$(stellar contract invoke \
  --network "$NETWORK" \
  --source-account "$IDENTITY" \
  --id "$ESCROW_ID" \
  -- \
  create_request \
  --lender "$ADDR" \
  --borrower "$ADDR" \
  --provider "$ADDR" \
  --amount 10000000 \
  --provider_fee 100000 \
  --score_threshold "$THRESHOLD")

echo "Request ID: $REQUEST_ID"

echo "Submitting proof and settling..."
OUTCOME=$(stellar contract invoke \
  --network "$NETWORK" \
  --source-account "$IDENTITY" \
  --id "$ESCROW_ID" \
  -- \
  submit_proof_and_settle \
  --request_id "$REQUEST_ID" \
  --seal "$SEAL" \
  --image_id "$IMAGE_ID" \
  --journal_digest "$JOURNAL_DIGEST" \
  --journal_bytes "$JOURNAL_HEX")

echo "Settlement outcome: $OUTCOME"
echo "E2E escrow flow succeeded."
