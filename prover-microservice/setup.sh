#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  Setting up VeriCompute Prover Server    "
echo "=========================================="

# 1. Update and install basic dependencies
echo "[1/4] Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y curl build-essential pkg-config libssl-dev

# 2. Install Docker (required for RISC Zero Groth16 stark-to-snark)
if ! command -v docker &> /dev/null; then
    echo "[2/4] Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed. You may need to log out and back in for groups to apply."
else
    echo "[2/4] Docker already installed, skipping..."
fi

# 3. Install Rust
if ! command -v cargo &> /dev/null; then
    echo "[3/4] Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "[3/4] Rust already installed, skipping..."
    source "$HOME/.cargo/env"
fi

# 4. Install RISC Zero Toolchain
if ! command -v rzup &> /dev/null; then
    echo "[4/4] Installing RISC Zero toolchain..."
    curl -L https://risczero.com/install | bash
    export PATH="$HOME/.risc0/bin:$PATH"
    rzup install
    rzup install risc0-groth16
else
    echo "[4/4] RISC Zero toolchain already installed, skipping..."
    export PATH="$HOME/.risc0/bin:$PATH"
fi

# 5. Compile the prover microservice
echo "=========================================="
echo "  Compiling the prover microservice...    "
echo "=========================================="
cd .. # Go to repository root
cargo build --release -p vericompute-host

echo "=========================================="
echo "  Setup Complete!                         "
echo "  You can now install the systemd service "
echo "=========================================="
