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
**See [`deploy/DEPLOYMENT_REFERENCE.md`](deploy/DEPLOYMENT_REFERENCE.md) for the verified Staging and Production deployment procedures.**

### Configuration Files
Configuration files are isolated by environment:
*   **Staging**: [`deploy/staging/docker-compose.yml`](deploy/staging/docker-compose.yml)
*   **Production**: [`deploy/production/docker-compose.yml`](deploy/production/docker-compose.yml)

### Workflow Overview (Manual)
1.  **Code**: Push to `deploy/staging-products`.
2.  **Deploy Staging**: SSH to server, pull code in `~/zenkar-staging`, and run `docker-compose up -d --build`.
3.  **Deploy Production**: SSH to server, pull code in `~/zenkar-platform-production`, and run `docker-compose up -d --build`.

### Pipeline Steps (Concept)
The previous `cicd.sh` is deprecated. We now use a direct verified pull/build process on the server to ensure consistency.
1.  **Safety Check**: Ensure no conflicting containers.
2.  **Backup**: Snapshot `pgdata` before production changes.
3.  **Migrate**: Run `npx prisma migrate deploy` in the container.
4.  **Restart**: `docker-compose up -d --build`.

## 🤖 AI-Friendly Features

*   **API Documentation**: Swagger is available at `http://localhost:3000/api/docs`.
*   **Structure**: 
    *   `backend/`: NestJS source
    *   `frontend/`: React source
    *   `deploy/`: Docker configurations
