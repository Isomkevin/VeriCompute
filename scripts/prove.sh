#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT="${INPUT:-$ROOT/zk/host/examples/sample_input.json}"
OUTPUT="${OUTPUT:-$ROOT/proof.json}"

source "$HOME/.cargo/env" 2>/dev/null || true
export PATH="${HOME}/.cargo/bin:${HOME}/.risc0/bin:${PATH}"

cd "$ROOT"
echo "Proving with input: $INPUT"
cargo run --release -p vericompute-host -- --input "$INPUT" --output "$OUTPUT"
echo "Wrote $OUTPUT"
jq '{score, image_id, journal_digest}' "$OUTPUT"
