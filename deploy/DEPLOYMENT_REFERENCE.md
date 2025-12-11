# Deployment Reference

This document serves as the **Single Source of Truth** for the deployment architecture on the server (`160.250.204.219`).
**Use this file to avoid confusion between Staging and Production environments.**

---

## 🏗️ Environment Overview

| Feature | 🟡 Staging (Demo) | 🟢 Production (Live) |
| :--- | :--- | :--- |
| **URL** | [orderdemo.zenkar.in](https://orderdemo.zenkar.in) | [order.zenkar.in](https://order.zenkar.in) |
| **Server Path** | `~/zenkar-staging` | `~/zenkar-platform-production` |
| **Data Volume** | `~/zenkar-staging/pgdata_demo` | `~/zenkar-platform-production/pgdata` (**REAL DATA**) |
| **Compose File** | `deploy/staging/docker-compose.yml` | `deploy/production/docker-compose.yml` |
| **Git Branch** | `deploy/staging-products` | `deploy/staging-products` |

---

## 🐳 Container & Port Registry

### 🟡 Staging Containers
| Service | Container Name | Host Port | Internal Port | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `zenkar-frontend-demo` | **5173** | 5173 | Proxied by Nginx (`orderdemo`) |
| **Backend** | `zenkar-backend-demo` | **3000** | 3000 | API is open / No Auth |
| **Database** | `zenkar-db-demo` | **5432** | 5432 | DB Name: `zenkar_db_demo` |

### 🟢 Production Containers
| Service | Container Name | Host Port | Internal Port | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `zenkar-frontend-prod` | **5174** | 5173 | Proxied by Nginx (`order`) |
| **Backend** | `zenkar-backend-prod` | **3001** | 3000 | **CRITICAL: Uses Real Data** |
| **Database** | `zenkar-db-prod` | **5433** | 5432 | DB Name: `order_book` |

---

## 🔄 Deployment Workflows

### Deploying to Staging
1.  **Code**: Push to `deploy/staging-products`.
2.  **Server**: SSH and `cd ~/zenkar-staging`.
3.  **Command**: `git pull && docker-compose -f deploy/staging/docker-compose.yml up -d --build`

### Deploying to Production
1.  **Code**: Push to `deploy/staging-products`.
2.  **Server**: SSH and `cd ~/zenkar-platform-production`.
3.  **Command**: `git pull && docker-compose -f deploy/production/docker-compose.yml up -d --build`

---

## ⚠️ Important Safety Rules
1.  **NEVER** delete `~/zenkar-platform-production/pgdata`. This is the production database.
2.  **NEVER** run `docker-compose down -v` in Production (it deletes volumes).
3.  **ALWAYS** check which folder you are in (`pwd`) before running docker commands.
4.  **NEVER** hardcode secrets (API Keys, DB Passwords) in `docker-compose.yml`. Always use `.env` files and SCP the local `.env` to the server location relative to the compose file (e.g. `deploy/staging/.env`).
