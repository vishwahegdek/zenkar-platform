# Zenkar Platform - Deployment Procedure

This document outlines the standard operating procedure for deploying updates to the Zenkar platform. The deployment strategy utilizes pre-compiled Docker images via Docker Hub to ensure zero build-overhead on the production server.

## Overview
There are two primary environments hosted on the main server (`160.250.204.219`):
1. **Staging** (`orderdemo.zenkar.in`) - Located at `~/zenkar_platform_staging/`
2. **Production** (`order.zenkar.in`) - Located at `~/zenkar_platform_production/`

> [!IMPORTANT]
> Always deploy and verify on Staging first before promoting the build to Production. Do **not** run Docker builds directly on the server, as this will consume all CPU/Memory resources and cause downtime.

---

## Phase 1: Local Build & Push (Staging)

Before deploying, ensure your code is fully tested locally and committed to the `master` branch.

**1. Commit Local Changes**
Ensure your working directory is clean so the Git SHA matches your actual code.
```bash
git add .
git commit -m "feat: your descriptive commit message"
```

**2. Build & Push Images to Docker Hub**
Run the automated build jsudo script. This will compile the React and NestJS apps using your local machine's CPU, tag them with your exact Git commit hash, and push them to Docker Hub with the `:staging` tag.
```bash
sudo ./deploy/build_and_push.sh
```
> Note the **Git SHA** printed at the end of the script (e.g., `2fb7653f`). This is automatically saved to `.latest_build_sha`.

---

## Phase 2: Deploy to Staging

Update the remote staging server to pull down the newly built images.

**1. SSH into the Server**
```bash
ssh vishwa@160.250.204.219
```

**2. Update Staging Containers**
Navigate to the staging directory, pull the new `:staging` images, and gracefully restart the containers.
```bash
cd ~/zenkar_platform_staging
sudo docker compose pull
sudo docker compose up -d
```

**3. Apply Database Migrations (If Schema Changed)**
If your recent changes included Prisma schema updates, you must apply them to the staging database.
```bash
sudo docker exec zenkar-backend-demo npx prisma migrate deploy
```

**4. Verify Staging**
Open [https://orderdemo.zenkar.in](https://orderdemo.zenkar.in) and thoroughly test the new features.

---

## Phase 3: Promote & Deploy to Production

Once Staging is verified, promote the exact same image to Production.

**1. Promote the Image**
Run the promotion script from your **local machine**. This retags your tested commit-hash image with the `:production` tag on Docker Hub.
```bash
# If you just built it, the script auto-reads the SHA:
sudo ./deploy/promote_to_prod.sh

# Or explicitly pass the SHA:
sudo ./deploy/promote_to_prod.sh <GIT_SHA>
```

**2. Update Production Containers**
SSH back into the server (or use your existing session) and deploy the updated production images.
```bash
ssh vishwa@160.250.204.219
cd ~/zenkar_platform_production
sudo docker compose pull
sudo docker compose up -d
```

**3. Apply Production Database Migrations**
If applicable, run the Prisma migration on the live database.
```bash
sudo docker exec zenkar-backend-prod npx prisma migrate deploy
```

**4. Verify Production**
Open [https://order.zenkar.in](https://order.zenkar.in) to ensure everything is running smoothly.

---

## 🛠 Troubleshooting & Rollbacks

> [!WARNING]
> If a critical bug is found in Production, you can quickly rollback by modifying the `docker-compose.yml` to point to a previous stable Git SHA tag instead of the `production` tag.

**Checking Server Logs**
If a container fails to start, use the following commands to inspect the logs:
```bash
# Production Backend Logs
sudo docker logs zenkar-backend-prod --tail 100 -f

# Production Frontend Logs
sudo docker logs zenkar-frontend-prod --tail 100 -f
```
