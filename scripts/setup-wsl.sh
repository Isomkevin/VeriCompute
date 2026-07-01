#!/usr/bin/env bash
set -euo pipefail

echo "This script is intended to be run inside WSL2 (Ubuntu)."
echo "It installs Rust, Stellar CLI, and RISC Zero toolchain prerequisites."
echo

if ! grep -qi microsoft /proc/version 2>/dev/null; then
  echo "Warning: this does not appear to be WSL. Continuing anyway."
fi

sudo apt-get update
sudo apt-get install -y \
  build-essential \
  pkg-config \
  libssl-dev \
  libdbus-1-dev \
  curl \
  git \
  python3 \
  python3-pip \
  jq

# Docker: use Docker Desktop WSL integration, or:
#   sudo apt-get install -y docker.io && sudo service docker start
if command -v docker >/dev/null 2>&1; then
  echo "Docker found: $(docker --version)"
else
  echo "Docker not found — install Docker Desktop (WSL2 backend) for Groth16 proving."
fi

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

export PATH="${HOME}/.risc0/bin:${PATH}"
if command -v rzup >/dev/null 2>&1; then
  rzup install
  rzup install rust
  rzup install risc0-groth16
fi

echo "Setup complete. Ensure Docker is running, then:"
echo "  cargo run --release -p vericompute-host -- --input zk/host/examples/sample_input.json --output proof.json"

