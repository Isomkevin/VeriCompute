#!/usr/bin/env bash
set -euo pipefail

# Deposit native XLM into the testnet Stellar Asset Contract so create_request can transfer tokens.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-vericompute}"
AMOUNT="${AMOUNT:-50000000}"

TOKEN_CONTRACT_ID="${TOKEN_CONTRACT_ID:-CDLZFC3SYJYDZT7K7VZ75HMSCV4MAZJSDLX4S5HD3NF4AXR7HWPN3NWA}"
ADDR="$(stellar keys address "$IDENTITY")"

echo "Depositing $AMOUNT stroops of XLM into SAC $TOKEN_CONTRACT_ID for $ADDR"

stellar contract invoke \
  --network "$NETWORK" \
  --source-account "$IDENTITY" \
  --id "$TOKEN_CONTRACT_ID" \
  -- \
  deposit \
  --from "$ADDR" \
  --amount "$AMOUNT"

echo "SAC balance funded for escrow create_request transfers."
