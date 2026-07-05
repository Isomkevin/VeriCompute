# VeriCompute Prover Microservice Deployment

When you deploy VeriCompute to a production environment (like Vercel), the Next.js API route no longer has access to a local WSL or Docker runtime. Because generating RISC Zero Zero-Knowledge proofs requires compiling and executing STARK-to-SNARK workflows, the prover must be hosted on a dedicated Linux environment.

**Architecture:**
- **Frontend / Next.js:** Hosted on **Vercel**
- **Prover Microservice:** Hosted on **Render**, **AWS**, or **DigitalOcean** (as a Docker container)

This directory provides true plug-and-play deployments for your prover microservice.

---

## ☁️ Method 1: Deploy to Render (Easiest & Plug-n-Play)

Render is a fully managed cloud that natively supports Docker builds from GitHub. We have provided a `render.yaml` Blueprint at the root of the repository for 1-click deployments.

### Steps:
1. Push your `VeriCompute` repository to a public or private GitHub repository.
2. Sign in to [Render](https://render.com) and click **New > Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file and configure the service.
5. Click **Apply**. Render will build the Docker container and start the HTTP microservice.

**Hardware Note:** Groth16 proving is memory-intensive. The `render.yaml` is configured to use the "Standard" plan (2GB RAM). If your build fails or proves too slowly, consider upgrading to a tier with at least 4GB of RAM.

---

## ☁️ Method 2: Deploy to AWS EC2 (Highly Scalable)

For maximum control and cost-efficiency, you can deploy the prover to an AWS EC2 instance using Docker Compose.

### Steps:

**1. Launch an EC2 Instance:**
- Open the AWS Console and go to **EC2 > Launch Instances**.
- **OS:** Ubuntu 22.04 LTS (x86_64)
- **Instance Type:** `t3.medium` or `t3.large` (Requires at least 2 vCPUs and 4GB RAM)
- **Security Group:** Allow SSH (port 22) and Custom TCP (port 8080) from anywhere (0.0.0.0/0).

**2. Pass the User-Data Script (Automated 1-Click Setup):**
Scroll down to **Advanced Details > User data** and paste the following bash script. It will automatically install Docker, clone your repository, build the image, and start the server on boot:

```bash
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

apt-get update
apt-get install -y git curl

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone your repository (Replace URL with your repo)
git clone https://github.com/your-org/VeriCompute.git /opt/VeriCompute
cd /opt/VeriCompute/prover-microservice

# Build and run the Prover Microservice
docker compose up -d --build
```

**3. Test the API:**
Once the instance completes booting (and Docker finishes the ~3 min build), you can test it by running:
```bash
curl -X POST http://<YOUR_EC2_PUBLIC_IP>:8080/prove \
  -H "Content-Type: application/json" \
  -d '{"annual_income":60000,"total_debt":2000,"months_on_time_payments":12,"credit_utilization_pct":30}'
```
You should get a JSON response with the `proof` and `image_id`!

---

## ⚡ Connecting the Vercel Frontend

Once your microservice is running on Render or AWS, you need to tell your Vercel deployment where it is.

1. Go to your VeriCompute project dashboard on **Vercel**.
2. Navigate to **Settings > Environment Variables**.
3. Add a new variable:
   - **Key:** `PROVER_SERVICE_URL`
   - **Value:** `http://<YOUR_AWS_IP>:8080` (for AWS) OR `https://vericompute-prover.onrender.com` (for Render)
4. Redeploy your Next.js application.

Now, whenever a user clicks **"Prove in RISC Zero"** on your Vercel site, the frontend will automatically proxy the generation payload to your dedicated remote microservice instead of trying to run it locally.
