#!/usr/bin/env bash
set -euo pipefail

echo "This script is intended to be run inside WSL2 (Ubuntu)."
echo "It installs Rust, Stellar CLI, and RISC Zero toolchain prerequisites."
echo

if ! grep -qi microsoft /proc/version 2>/dev/null; then
  echo "Warning: this does not appear to be WSL. Continuing anyway."
fi

sudo apt-get update
sudo apt-get install -y build-essential pkg-config libssl-dev curl git python3 python3-pip jq docker.io

if ! command -v rustup >/dev/null 2>&1; then
  curl https://sh.rustup.rs -sSf | sh -s -- -y
  source "$HOME/.cargo/env"
fi

rustup update
rustup target add wasm32v1-none

if ! command -v stellar >/dev/null 2>&1; then
  cargo install stellar-cli --locked
fi

if ! command -v rzup >/dev/null 2>&1; then
  curl -L https://risczero.com/install | bash
fi

echo "If this is the first run, restart your shell so rzup is on PATH."
echo "Then run: rzup install && rzup install risc0-groth16"

