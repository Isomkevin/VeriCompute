#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT/vendor/stellar-risc0-verifier"
REV="11b5b2d59143ff9153dfeb62e63fdfcecfaf0016"

if [[ ! -d "$VENDOR_DIR/.git" ]]; then
  git clone https://github.com/NethermindEth/stellar-risc0-verifier.git "$VENDOR_DIR"
  git -C "$VENDOR_DIR" checkout "$REV"
else
  git -C "$VENDOR_DIR" fetch --depth 1 origin "$REV" || true
  git -C "$VENDOR_DIR" checkout "$REV"
fi

echo "Vendored stellar-risc0-verifier at $VENDOR_DIR ($REV)"
