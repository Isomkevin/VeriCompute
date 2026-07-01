#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT="${INPUT:-$ROOT/zk/host/examples/sample_input.json}"
OUTPUT="${OUTPUT:-$ROOT/proof.json}"

source "$HOME/.cargo/env" 2>/dev/null || true
export PATH="${HOME}/.cargo/bin:${HOME}/.risc0/bin:${PATH}"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is required for Groth16 proving. Start Docker Desktop (WSL integration) or run: sudo service docker start" >&2
  exit 1
fi

if ! command -v rzup >/dev/null 2>&1; then
  echo "ERROR: rzup not found. Run ./scripts/setup-wsl.sh" >&2
  exit 1
fi

cd "$ROOT"
echo "Proving with input: $INPUT"
cargo run --release -p vericompute-host -- --input "$INPUT" --output "$OUTPUT"
echo "Wrote $OUTPUT"
jq '{score, image_id, journal_digest}' "$OUTPUT"
