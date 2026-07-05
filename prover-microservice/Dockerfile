# Build Stage
FROM rust:1.81-slim-bookworm as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install RISC Zero toolchain
RUN curl -L https://risczero.com/install | bash
ENV PATH="/root/.risc0/bin:${PATH}"
RUN rzup install && rzup install risc0-groth16

WORKDIR /app
COPY . .

# Build the prover host (this will also compile the guest ELF)
RUN cargo build --release -p vericompute-host

# Runtime Stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libgcc-s1 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Copy the RISC Zero toolchain (contains the local Groth16 binary)
COPY --from=builder /root/.risc0 /root/.risc0
ENV PATH="/root/.risc0/bin:${PATH}"

WORKDIR /app

# Copy the compiled host binary
COPY --from=builder /app/target/release/vericompute-host /usr/local/bin/

# Expose the API port
EXPOSE 8080

# Start the microservice
CMD ["vericompute-host", "--serve", "0.0.0.0:8080"]
