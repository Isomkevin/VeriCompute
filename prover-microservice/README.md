# VeriCompute Remote Prover Microservice

To offload zero-knowledge proof generation from the Next.js frontend (especially for production environments like Vercel), you can run the `vericompute-host` as a standalone HTTP microservice on a remote Linux server (e.g. AWS EC2, DigitalOcean Droplet).

This directory contains the necessary configuration to easily deploy the prover as a robust `systemd` service on an Ubuntu/Debian server.

## Server Requirements

- **OS:** Ubuntu 22.04 LTS (or Debian equivalent)
- **Architecture:** x86_64 (RISC Zero Groth16 requires x86_64)
- **Hardware:** At least 8GB RAM and 4+ vCPUs recommended for proving speed.
- **Network:** Port 8080 open (or behind a reverse proxy like Nginx/Caddy)

> **Important:** The RISC Zero Groth16 prover uses a Docker container under the hood for STARK-to-SNARK conversion, so Docker must be installed on the host machine.

## Deployment Instructions

### 1. Provision a Server
Spin up an Ubuntu 22.04 x86_64 instance on your preferred cloud provider. SSH into the server.

### 2. Clone the Repository
```bash
git clone https://github.com/your-org/VeriCompute.git
cd VeriCompute
```

### 3. Run the Installation Script
We provide an automated setup script that installs Docker, Rust, the RISC Zero toolchain, and compiles the prover microservice.

```bash
cd prover-microservice
chmod +x setup.sh
./setup.sh
```

### 4. Install the Systemd Service
To ensure the microservice runs in the background, starts on boot, and automatically restarts if it crashes, install the provided `systemd` service.

```bash
sudo cp vericompute-prover.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vericompute-prover.service
sudo systemctl start vericompute-prover.service
```

### 5. Verify the Service
Check the logs to ensure the server is listening on port 8080:

```bash
sudo systemctl status vericompute-prover.service
# or view live logs:
journalctl -u vericompute-prover.service -f
```

## Securing with HTTPS (Optional but Recommended)

For production, do not expose port 8080 directly without TLS. We recommend installing **Caddy** to act as a reverse proxy with automatic SSL:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Then edit `/etc/caddy/Caddyfile`:
```
prover.yourdomain.com {
    reverse_proxy localhost:8080
}
```
And restart Caddy: `sudo systemctl restart caddy`.

## Connecting the Frontend

Once the service is running, update the `.env.local` or the production environment variables in your frontend deployment (e.g. Vercel):

```env
PROVER_SERVICE_URL=http://<YOUR_SERVER_IP>:8080
# Or if using HTTPS via Caddy:
# PROVER_SERVICE_URL=https://prover.yourdomain.com
```

Now, when users click "Prove in RISC Zero", the frontend will offload the heavy proving computation to your remote microservice.
