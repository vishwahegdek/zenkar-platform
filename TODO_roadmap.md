# Project Roadmap

Future enhancements for the Zenkar Platform.

# Roadmap & Todo

## ✅ Validated & Completed (v1.2.1 Deployment)
- [x] **Restore Production Environment**
    - [x] Rename `zenkar-platform` to `zenkar-platform-production`
    - [x] Backup Legacy Data (`pgdata`)
    - [x] Configure Alternate Ports (3001, 5174, 5433)
    - [x] Migrate Schema (Add `discount` column)
    - [x] Verify URL `order.zenkar.in`
- [x] **Create Deployment Documentation**
    - [x] Registry of Ports, Paths, and Containers (`deploy/DEPLOYMENT_REFERENCE.md`)

## 🚀 Future Deployment Improvements
- [ ] **Automate Build & Push**: Set up CI to build Docker images and push to a container registry (e.g., GHCR, Docker Hub). This avoids building on the server and ensures artifacts are immutable.
- [ ] **Dedicated Staging User**: Create a `deploy-staging` user on the server with restricted permissions to strictly isolate staging from the production environment.
- [ ] **Implement Health Check**: Add a proper `/api/health` endpoint in the NestJS backend to return 200 OK, enabling reliable uptime monitoring.
- [ ] **Automate Migrations**: Integrate `npx prisma migrate deploy` into the container's startup script (entrypoint) to ensure the database schema is always in sync with the code on startup.
- [ ] **Fix File Permissions**: Refactor Dockerfiles to run applications as a non-root user (e.g., `node` user) to prevent file ownership conflicts on the host volume.


**Current Version**: `v1.2.0` (Infrastructure Overhaul)
**Last Updated**: 2025-12-08

## 🔐 Security & Access Control
- [ ] **Authentication**: Implement JWT-based login screen.
- [ ] **RBAC**: Differentiate between Admin (full access) and Staff (restricted access).

## 👥 Customer Management (CRM)
- [ ] **Directory**: Dedicated page to list and search all customers.
- [ ] **History**: View customer lifetime value and past orders.
- [ ] **Merge Utils**: Logic to merge duplicate customers by phone number.

## 📦 Inventory Management
- [ ] **Stock Tracking**: Add `quantityInStock` to Product model.
- [ ] **Auto-Deduction**: Reduce stock when Order is confirmed/delivered.
- [ ] **Low Stock Alerts**: Visual indicators when stock dips below threshold (e.g., 5).

## 📊 Dashboard & Analytics
- [ ] **Main Dashboard**: "Sales Today", "Pending Deliveries", "Top Products" widgets.

## ⚙️ Deployment & Infrastructure
- [ ] **CI/CD**: Research GitHub Actions workflow (Deferred).
- [ ] **Notifications**: Implement Telegram Bot for order confirmations and alerts.
- [ ] **Testing**: Setup Frontend testing infrastructure (`Vitest`).
- [ ] **Documentation**: Complete OpenAPI/Swagger annotations.


##    Future Scope
    -   **Scope**: Cover Critical Paths: Order Creation -> Product Auto-Save -> Inventory Update.
    -   **CI Integration**: Run E2E suite on every PR.
- [x] **E2E Testing Implementation** (Completed 2025-12-09)
    -   Backend: Jest + Supertest (Orders & Payments).
    -   Frontend: Playwright (Full Order Flow).
    -   Logs: `TEST_LOGS.md`.
    -   **CI Integration**: Run E2E suite on every PR.
- [ ] **Infrastructure**
    - [ ] **Telegram Bot Integration**: For notifications and server control (deploy/restart)through commands.
    - [x] **Schema Documentation**: maintaned in `backend/SCHEMA_CHANGELOG.md` and `backend/prisma/schema.prisma`.

## ☁️ Google Integration
- [ ] **Google Auth**: Finalize OAuth2 login strategy (Passport strategy configured).
- [ ] **Contact Sync**: Two-way sync between Zenkar Customers and Google Contacts.
- [ ] **Drive Backup**: Automated database backups to Google Drive.
## 🧪 Quality Assurance
- [ ] **Test Stability**: Enhance E2E tests with `data-testid` attributes to decouple testing logic from UI label text, ensuring long-term resilience against UI refactors.
