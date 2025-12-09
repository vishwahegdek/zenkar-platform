# Project Roadmap

Future enhancements for the Zenkar Platform.

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
