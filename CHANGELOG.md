# Changelog

All notable changes to the Zenkar Platform will be documented in this file.

## [Unreleased]
### 🎨 UI Changes
-   **Products**: Added full **Product Management** interface at `/products`.
    -   List view with search and actions.
    -   Create/Edit forms with validation.
    -   Soft Deletes implemented as per requirements.
    -   **SKU Removed**: Removed SKU field from everywhere as per request.
    -   **Smart Auto-Save**: Order Form now auto-saves new products with Description mapping to Internal Notes.
### 🐛 Bug Fixes
-   **Product Search**: Fixed an issue where the product dropdown was listing all products instead of filtering by the typed query.

### 🛡️ Quality Assurance
-   **Unit Tests**: Implemented comprehensive unit tests for:
    -   `ProductsController`: Verified search query parameter passing.
    -   `ProductsService`: Verified Soft Delete logic (`isDeleted=true`).
    -   `OrdersService`: Verified Auto-Save Product logic (Description -> Notes).-   **Order List**: Added "Remaining Balance" column (Visual indicator in Red).
-   **Order Details**: Implemented Modal view with "Internal Notes" displayed at the top.
-   **Order Form**: Improved layout (Address before Phone) and added "Remove Item" button visibility.

### ⚙️ Backend Changes
-   **Orders**: Added `remainingBalance` calculation to `findAll` and `findOne` endpoints.
-   **Products**: Implemented **Auto-Save** logic. When adding items, if a product name doesn't exist, it's automatically created in the database.

## [v1.2.0] - 2025-12-08
### 🚀 Deployment Changes
-   **Structure**: Separated Docker Compose files into `deploy/staging` and `deploy/production`.
-   **CI/CD**: Hardened `cicd.sh` with Git Status checks, auto-testing, and health checks.

### 🏗️ Infrastructure Changes
-   **Workflow**: Unified root `package.json` for concurrent development (`npm run dev`).
-   **Docs**: Added strict versioning table to README and updated all guide docs.

## [v1.1.0] - 2025-12-07
### Added
-   **Mobile Navigation**: Responsive hamburger menu for better mobile experience.
-   **Order Filtering**: "Active" vs "History" (Closed/Cancelled) views.
-   **Advanced Search**: Client-side search across Customer Address, Notes, and Item details.
-   **Status**: New "Closed" status for archiving orders.

### Fixed
-   **Mobile Copy**: Added fallback for clipboard actions on non-secure/mobile contexts.
-   **Edit Order**: Fixed 500 Error by excluding non-existent fields (`customerName`, etc.) from Prisma update.
-   **Edit Order**: Fixed HTTP method mismatch (POST -> PATCH).

## [v1.0.0] - 2025-12-06
### Added
-   **Order List**: Customer Address display.
-   **Actions**: Edit, Delete, Copy buttons.
-   **Testing**: Initial Vitest setup for Frontend.

### Changed
-   **Deployment**: Standardized ports (Frontend: 5173, Backend: 3000, DB: 5455).
