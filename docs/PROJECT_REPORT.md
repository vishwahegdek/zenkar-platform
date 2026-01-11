# Zenkar Platform - Project Report
**Generated on:** 2026-01-11
**Version:** v1.12.0

## 1. Executive Summary
Zenkar Platform is a modern, mobile-first **Order Book Application** designed to digitize and streamline business operations. It has evolved from a simple order tracker into a comprehensive system managing **Orders, Production, Expenses, Debts (Creditors), and Contacts**. The application is currently in active production use (`order.zenkar.in`) with a robust CI/CD pipeline leveraging Docker Hub.

## 2. Technology Stack

### Frontend
-   **Structure**: Single Page Application (SPA).
-   **Framework**: **React v19** (Latest) built with **Vite v7**.
-   **Styling**: **TailwindCSS v4.1** (Latest) for utility-first styling.
-   **State/Data**: React Query (via `@tanstack/react-query`) for server state management.
-   **Testing**: Vitest + Playwright (E2E).
-   **Key Libraries**: `react-hook-form`, `lucide-react` (icons), `date-fns` (dates), `libphonenumber-js` (formatting).

### Backend
-   **Framework**: **NestJS v11** (Node.js v22).
-   **Database**: **PostgreSQL v15**.
-   **ORM**: **Prisma v5.22** (Schema-first design).
-   **Authentication**: JWT-based + Google OAuth2 (Passport).
-   **Testing**: Jest (Unit/Integration).
-   **Documentation**: Swagger/OpenAPI (available at `/api/docs`).

### Infrastructure
-   **Containerization**: Docker & Docker Compose.
-   **Proxy**: Nginx (Reverse Proxy for Frontend/Backend).
-   **Storage**: MinIO (S3 compatible) referenced in dependencies/ignore files, likely for file uploads.
-   **Hosting**: VPS at `160.250.204.219`.

## 3. Deployment Architecture
The project follows a strict **Staging vs. Production** isolation strategies, recently improved to use **Docker Hub** for immutable builds.

| Feature | Staging (vStaging) | Production (vLive) |
| :--- | :--- | :--- |
| **URL** | `orderdemo.zenkar.in` | `order.zenkar.in` |
| **Ports** | FE: 5173, BE: 3000, DB: 5455 | FE: 5174, BE: 3001, DB: 5433 |
| **Data** | Demo Data (`pgdata_demo`) | **REAL BUSINESS DATA** (`pgdata`) |
| **Strategy** | Build -> Push to Docker Hub | Pull SHA from Docker Hub |

**Deployment Workflow**:
1.  **Local**: `deploy/build_and_push.sh` -> Builds and pushes to Docker Hub.
2.  **Server**: `deploy/deploy_remote.sh` -> Pulls images, backs up DB, migrates Schema, restarts containers.

## 4. Current State & Recent Deliverables

### Latest Version: v1.12.0 (Jan 11, 2026)
-   **Delivered Status**: Added lifecycle stage for confirmed delivery, automating item-to-order status updates.
-   **Smart Logic**: Auto-revert to `CONFIRMED` if items are moved back from delivery.

### Recent Key Features
-   **Google Contacts Sync (v1.11.0)**: Two-way sync, auto-linking, and "Self-Healing" for deleted contacts.
-   **Production Module (v1.10.0)**: Dedicated workflow for manufacturing (Confirmed -> In Production -> Ready).
-   **Strict Payments**: Enforcing Cash/UPI/Card types to ensure data quality.
-   **Global Data Access**: Removed siloed user data; all users access the same business entities.

## 5. Code Quality & Health

### Test Coverage (as of Jan 8, 2026)
-   **Backend**: **~17.8%** Line Coverage.
    -   *Gap*: Many service methods and controllers lack unit tests.
-   **Frontend**: **~3.6%** Line Coverage.
    -   *Gap*: Unit testing is minimal.
    -   *Strength*: **Playwright E2E** tests exist for critical flows (Orders, Finance History), though consistency requires monitoring.

### Documentation
-   **Strong**: Deployment (`DEPLOYMENT_REFERENCE.md`) and Changelog (`CHANGELOG.md`) are well-maintained.
-   **Pending**: API Documentation (Swagger) needs completion. User Manual exists but needs keeping up with v1.12 features.

## 6. Recommendations & Roadmap

### 🔴 Critical (Immediate Attention)
1.  **Improve Test Coverage**: The low coverage (<20%) is a risk for a production system handling financial data. Prioritize:
    -   Unit tests for `OrdersService` and `PaymentsService` (Backend).
    -   Integration tests for complex flows like "Inventory Deduction" or "Split Payments".
2.  **Backup Verification**: Ensure `pgdata` backups (created during deploy) are actually creating valid, restorable files.

### 🟡 Strategic (Next Steps)
1.  **Inventory Management**: Planned feature to track stock levels and auto-deduct upon delivery.
2.  **RBAC**: Role-Based Access Control to distinguish Admin vs. Staff.
3.  **Automated Health Checks**: Add `/api/health` to allow uptime monitoring.

### 🟢 Housekeeping
1.  **Linting**: Ensure `npm run lint` is part of the pre-commit or CI hooks (Husky is present, verify it's active).
2.  **Dependency Updates**: Keep an eye on `React v19` and `NestJS v11` minor updates for stability.
