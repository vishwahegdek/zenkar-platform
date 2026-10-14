# Zenkar Platform

The **Zenkar Platform** (v1.12.0) is a modern, mobile-first Enterprise Resource Planning (ERP) and Order Management System designed for specialized woodworking, timber manufacturing, and carpentry operations (including bee-box production, customized door/window frames, and counter sales).

Built with a **NestJS** backend, a **React** (Vite + TailwindCSS) frontend, and a **PostgreSQL** relational database with a full double-entry financial ledger.

---

## 🚀 Key Modules & Capabilities

- **⚡ Sales & Quick Sale (`/quick-sale`, `/orders`)**: Rapid POS counter sales with walk-in customer auto-resolution, payment method capture, advance deposits, and custom order tracking.
- **🏭 Production Floor (`/production`)**: Manufacturing queue tracking item-by-item status (`CONFIRMED` → `IN_PRODUCTION` → `READY` → `DELIVERED`) with automated parent-order status propagation and rollback logic.
- **📐 Wood Estimator & Custom Products (`/wood-estimator`, `/custom-products`)**: Volumetric CFT calculation engine for smart door frames, window frames, and custom wood blocks with live timber pricing and template persistence.
- **👥 CRM & Google Contacts Sync (`/contacts`, `/customers`)**: Two-way Google Contacts synchronization with self-healing 404 recovery, multi-phone support (Mobile, Home, Work, WhatsApp), and strict E.164 phone formatting.
- **💼 Labour Management (`/labour/*`)**: Daily fractional attendance (0.5 / 1.0 day), wage snapshotting, advance/wage disbursements, and periodic settlements with balance carry-forward.
- **📒 Double-Entry Accounting Ledger (`/ledger`, `/balance-sheet`, `/income-statement`)**: Real-time Chart of Accounts, Journal Entries, Balance Sheet, Income Statement (P&L), Cashflow Analytics, and accounting period closure locking (`booksClosedDate`).
- **📦 Purchases & Inventory (`/purchases`, `/products`)**: Supplier purchase orders, stock quantity tracking, unit costs, and automated inventory transaction logging.

---

## 🛠️ Technology Stack

| Component | Technology | Version | Source |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `v22` (Slim) | `backend/Dockerfile` |
| **Backend** | NestJS | `v11.x` | `backend/package.json` |
| **Frontend** | React | `v19.x` | `frontend/package.json` |
| **Build Tool** | Vite | `v7.x` | `frontend/package.json` |
| **Styling** | TailwindCSS | `v4.1` | `frontend/package.json` |
| **Database** | PostgreSQL | `v15-alpine` | Docker Compose |
| **ORM** | Prisma | `v5.22` | `backend/package.json` |
| **Object Storage**| MinIO | `v8.x` | S3-compatible image storage |
| **Testing** | Vitest / Jest / Playwright | `v4.x` / `v30.x` / `v1.57.x` | Root & Subpackages |

---

## 📌 Project Rules & Operating Constraints

1. **Mobile-First UX**: The application is developed **Android-first** and optimized for Android Chrome and Desktop Chrome.
2. **Timezone & Dates**: The timezone is strictly **Indian Standard Time (IST)**. Dates are formatted as **`dd/MM/yyyy`** everywhere.
3. **Database Safety**: **NEVER** run `prisma migrate dev` in production. Always run `npm run migrate:prod` or `npx prisma migrate deploy` to safely apply migrations.
4. **Ports**:
   - Dev Environment: Frontend `5173`, Backend `3000`, Database `5432`.
   - Staging (Demo): Frontend `5173`, Backend `3000`, Database `5432`.
   - Production (Live): Frontend `5174`, Backend `3001`, Database `5433`.

---

## 🏁 Local Development

### 1. Prerequisites
- Node.js (v20 or higher)
- PostgreSQL (v15+)
- Git

### 2. Setup
```bash
git clone <repository-url>
cd zenkar-platform
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Database Migration & Seed
```bash
cd backend
npx prisma migrate dev
npm run seed # optional
cd ..
```

### 4. Start Development Servers
```bash
# Starts Backend (3000) and Frontend (5173) concurrently
npm run dev
```

### 5. Testing & Quality Checks
```bash
# Unit & Integration tests
npm test

# Linting
npm run lint

# Frontend End-to-End Tests
cd frontend && npm run test:e2e
```

---

## 📦 Deployment & CI/CD Pipeline

Deployments use an **immutable Docker Hub image workflow** (`vishwahegdek/zenkar-*`). Images are compiled locally and pulled onto the remote server by Git commit SHA.

See [`deploy/DEPLOYMENT_REFERENCE.md`](deploy/DEPLOYMENT_REFERENCE.md) for the single source of truth regarding server paths and configurations.

### 1. Build & Push (Local Machine)
```bash
# 1. Build and push image tagged with Git SHA to Docker Hub (Staging)
sudo ./deploy/build_and_push.sh

# 2. Promote tested build artifact to Production tag
sudo ./deploy/promote_to_prod.sh
```

### 2. Deploy on Remote Server (`160.250.204.219`)
```bash
# For Staging (Demo): orderdemo.zenkar.in
cd ~/zenkar-staging
git pull origin master
sudo -E ./deploy/deploy_remote.sh staging

# For Production (Live): order.zenkar.in
cd ~/zenkar-platform-production
git pull origin master
sudo -E ./deploy/deploy_remote.sh production
```

---

## 🤖 AI & Developer Resources

- **API Documentation**: Swagger UI is available at `http://localhost:3000/api/docs`.
- **System Architecture**: Detailed in [`docs/TECHNICAL_DOCS.md`](docs/TECHNICAL_DOCS.md) and [`docs/DATAFLOW.md`](docs/DATAFLOW.md).
- **Deployment Reference**: Detailed in [`deploy/DEPLOYMENT_REFERENCE.md`](deploy/DEPLOYMENT_REFERENCE.md).
- **Changelog**: Detailed release notes in [`CHANGELOG.md`](CHANGELOG.md).

