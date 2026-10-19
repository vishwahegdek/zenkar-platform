# Deployment Reference

This document serves as the **Single Source of Truth** for the deployment architecture on the server (`160.250.204.219`).
**Use this file to avoid confusion between Staging and Production environments.**

---

## 🏗️ Environment Overview

| Feature | 🟡 Staging (Demo) | 🟢 Production (Live) |
| :--- | :--- | :--- |
| **URL** | [orderdemo.zenkar.in](https://orderdemo.zenkar.in) | [order.zenkar.in](https://order.zenkar.in) |
| **Server Path** | `~/zenkar_platform_staging` | `~/zenkar_platform_production` |
| **Data Volume** | `zenkar_platform_staging_zenkar_db_data_demo_v3` | `zenkar_platform_production_zenkar_db_data_prod_v3` (**REAL DATA**) |
| **Compose File** | `deploy/staging/docker-compose.yml` | `deploy/production/docker-compose.yml` |
| **Git Branch** | `master` | `master` |

---

## 🐳 Container & Port Registry

### 🟡 Staging Containers
| Service | Container Name | Host Port | Internal Port | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `zenkar-frontend-demo` | **5175** | 5173 | Proxied by Nginx (`orderdemo`) |
| **Backend** | `zenkar-backend-demo` | **3002** | 3000 | Proxied by Nginx (`orderdemo/api`) |
| **Database** | `zenkar-db-demo` | **5432** | 5432 | DB Name: `order_book` |

### 🟢 Production Containers
| Service | Container Name | Host Port | Internal Port | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `zenkar-frontend-prod` | **5174** | 5173 | Proxied by Nginx (`order`) |
| **Backend** | `zenkar-backend-prod` | **3001** | 3000 | **CRITICAL: Uses Real Data** |
| **Database** | `zenkar-db-prod` | **5433** | 5432 | DB Name: `order_book` |

---

## 🔄 Deployment Workflows (Docker Hub)

This project uses **Docker Hub** for standardizing builds. Images are built locally and pulled on the server.

### 1️⃣ Build & Push (Local Machine)
Run this from your **Local Machine** to build images and push them to Docker Hub.
```bash
# For Staging (and to generate build artifact)
sudo ./deploy/build_and_push.sh

# For Production (Promote an existing build)
# The git SHA is automatically detected     
sudo ./deploy/promote_to_prod.sh

```

### 2️⃣ Deploy & Migrate (Remote Server)
SSH into the server and run the deployment script. usage of `sudo -E` is recommended if user is not in docker group.
```bash
# SSH into Server
ssh vishwa@160.250.204.219

# For Staging (in ~/zenkar_platform_staging)
cd ~/zenkar_platform_staging
git pull origin master
sudo -E ./deploy/deploy_remote.sh staging

# For Production (in ~/zenkar_platform_production)
cd ~/zenkar_platform_production
git pull origin master
sudo -E ./deploy/deploy_remote.sh production

```

---

## 🛠️ Scripts Reference

| Script | Location | Purpose |
| :--- | :--- | :--- |
| **Build & Push** | `deploy/build_and_push.sh` | Builds Docker images locally, tags with SHA, and pushes to Staging. |
| **Promote to Prod** | `deploy/promote_to_prod.sh` | Takes a Git SHA, retags it as Production, and pushes (No Rebuild). |
| **Deploy Remote** | `deploy/deploy_remote.sh` | Pulls code/images, backs up DB, migrates DB, and restarts containers. |
| **Restore DB** | `deploy/restore_db.sh` | Restores database from a SQL backup file. |

---

## ⚠️ Important Safety Rules
1.  **NEVER** delete `~/zenkar-platform-production/pgdata`. Thivs is the production database.
2.  **NEVER** run `docker-compose down -v` in Production (it deletes volumes).
3.  **ALWAYS** check which folder you are in (`pwd`) before running docker commands.
4.  **NEVER** hardcode secrets (API Keys, DB Passwords) in `docker-compose.yml`. Always use `.env` files and SCP the local `.env` to the server location relative to the compose file (e.g. `deploy/staging/.env`).