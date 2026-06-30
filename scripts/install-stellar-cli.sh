#!/usr/bin/env bash
set -euo pipefail

source "$HOME/.cargo/env" 2>/dev/null || true
export PATH="${HOME}/.cargo/bin:${PATH}"

if command -v stellar >/dev/null 2>&1; then
  echo "stellar already installed: $(stellar --version)"
  exit 0
fi

echo "Installing stellar-cli..."
cargo install stellar-cli --locked
stellar --version
rustup target add wasm32v1-none
