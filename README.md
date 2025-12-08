# Zenkar Platform

The **Zenkar Platform** is a modern, mobile-first Order Book application designed to replace the legacy system. It features a robust **NestJS** backend and a responsive **React** frontend.

## 🚀 Technology Stack

*   **Backend**: NestJS (Node.js framework)
*   **Frontend**: React (Vite + TailwindCSS)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Containerization**: Docker & Docker Compose
*   **Documentation**: Swagger / OpenAPI

### Component Versioning
| Component | Technology | Version | Source |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `v22` (Slim) | `backend/Dockerfile` |
| **Backend** | NestJS | `v11.x` | `backend/package.json` |
| **Frontend** | React | `v19.x` | `frontend/package.json` |
| **Build Tool** | Vite | `v7.x` | `frontend/package.json` |
| **CSS** | TailwindCSS | `v4.1` | `frontend/package.json` |
| **Database** | PostgreSQL | `v15-alpine` | `deploy/production/docker-compose.yml` |
| **ORM** | Prisma | `v5.22` | `backend/package.json` |
| **Test** | Vitest / Jest | `v4.0` / `v30.0` | `package.json` |

## 🛠️ Prerequisites

*   Node.js (v20 or higher)
*   Docker & Docker Compose
*   Git

## 🏁 Getting Started (Local Development)

We use a unified workflow. You do not need to start backend and frontend separately.

### 1. Setup
```bash
git clone <repository-url>
cd zenkar-platform
npm install
```

### 2. Start Everything
```bash
# Starts Backend (3000) and Frontend (5173) concurrently
npm run dev
```

### 3. Testing & Linting
```bash
# Run all tests
npm test

# Run linting
npm run lint
```

## 📦 Deployment & CI/CD

Deployment is handled via the `cicd.sh` pipeline script, which performs safety checks (Git status, Tests) before deploying.

### Deployment Files
Configuration files are isolated by environment:
*   **Staging**: [`deploy/staging/docker-compose.yml`](deploy/staging/docker-compose.yml)
*   **Production**: [`deploy/production/docker-compose.yml`](deploy/production/docker-compose.yml)

### How to Deploy
Run the pipeline script from your local machine:

```bash
# 1. Deploy to Staging (Demo)
./cicd.sh demo
# Target: https://orderdemo.zenkar.in

# 2. Deploy to Production
./cicd.sh prod
# Target: https://order.zenkar.in
```

### Pipeline Steps
The `cicd.sh` script automates the following:
1.  **Safety Check**: Ensures no uncommitted changes (git status).
2.  **Test**: Runs `npm test` locally. Fails if broken.
3.  **Compress**: Bundles the code (excluding node_modules).
4.  **Upload**: SCPs the bundle to the VPS.
5.  **Deploy**: 
    *   Extracts code on server.
    *   Runs **Backup** of existing DB.
    *   Runs `docker-compose up -d --build` using the correct environment file.
6.  **Verify**: Checks if the site is reachable.

## 🤖 AI-Friendly Features

*   **API Documentation**: Swagger is available at `http://localhost:3000/api/docs`.
*   **Structure**: 
    *   `backend/`: NestJS source
    *   `frontend/`: React source
    *   `deploy/`: Docker configurations
