# Changelog

All notable changes to the Zenkar Platform will be documented in this file.

## [Unreleased]
 
## [v1.6.0] - 2025-12-12 (Contacts, Import & Deduplication)
### 👥 Contacts & Google Import
- **Google Integration**:
    - **Move**: Moved "Sync from Google" action from Customers List to **Contacts Manager** for better logical grouping.
    - **Strict Ownership**: Implemented `GoogleAuthGuard` to strictly assign imported contacts to the user initiating the sync.
    - **Deduplication**: Added `googleId` column to `contacts` table. Import logic now checks Google's unique `resourceName` first, then falls back to Name match, ensuring robust deduplication and self-healing of existing records.
- **Global Access**:
    - **Visibility**: Updated Contacts API to allow searching/viewing **all** contacts in the system, promoting collaboration.
    - **Ownership Check**: Added "Owner: [Username]" tag to contact cards to identify the creator.

### 📱 UI Improvements
- **Menu**: Added **Logout** button to both Mobile (HAM) menu and Desktop navigation bar.
- **Cleanup**: Removed legacy import buttons from Customer views.

### 🐛 Bug Fixes
- **Customer Dropdown**: Fixed `OrderForm` search not finding contacts in the fallback list.
- **Quick Sale**: Fixed issue where selecting a Contact didn't populate the Phone Number in the sale payload.
- **Feedback**: Added explicit phone number display in "Locked" customer cards.
- **Dashboard**: Fixed Payments list sorting to strictly follow transaction timestamp (`createdAt`) instead of just date, ensuring correct chronological order.

### � Dashboard Enhancements
- **Quick Navigation**: Made Order Numbers in the Dashboard payment list clickable, taking you directly to the Order Details page.

### �🛠️ Refactor
- **Order Model**: Removed `advanceAmount` column from data schema. Total Paid is now dynamically calculated from the `payments` table, ensuring a single source of truth.
- **Audit Fields**: Added `updatedAt` timestamp to both **Payments** and **Expense** tables for better tracking of modifications.




## [v1.5.0] - 2025-12-12 (Quick Sale V2 & Audit System)
### ⚡ Quick Sale V2
- **Split Payments**: Added powerful "Custom" payment mode allowing mix of Cash, UPI, Card, and Cheque in a single order.
- **Inline Creation**:
    - **New Product**: Create products on-the-fly via a modal without leaving the sale screen.
    - **New Customer**: Create customers instantly via a modal; automatically selects them upon creation.
- **Smart Autocomplete**: 
    - Added "Change" button for quick product swapping.
    - Improved mobile keyboard handling with robust auto-focus.
- **Notes**: Added dedicated "Internal Notes" section for order-specific remarks.
- **Validation**: Real-time "Remaining Balance" indicator (Green for balanced, Red for mismatch).

### 📱 UI/UX Enhancements
- **Orders List**: Standardized date formatting to `dd/MM/yyyy` for better readability.
- **Mobile Experience**: Fixed keyboard focus issues in Autocomplete components.
- **Input Handling**: improved `advanceAmount` handling to support legacy vs new payment array structures.

### 🛡️ Backend & Security
- **Audit System**: Integrated `AuditService` to log all critical operations (Create, Update, Delete) with User ID.
- **User Tracking**:
    - Added `createdById` and `updatedById` fields to Orders and Payments for granular accountability.
- **Registration**: Opened User Registration endpoint for easier onboarding (`@Public`).
- **Payment Sync**: Enhanced `syncPayments` logic to handle split payment updates reliably.
## Released Versions
## [v1.4.1] - 2025-12-11 (Quick Sale Feature)
### ⚡ Quick Sale
- **New Page**: Launched dedicated `/quick-sale` page for rapid counter sales.
- **Workflow**: Auto-assigns "Walk-In" customer, defaults to "Closed" status, and simplifies inputs (no due date).
- **Payment Method**: Added "Cash", "UPI", "Card", "Due" selector (Stored in Payment Note).
- **Navigation**: Added "Quick" button in Header; removed extra link from dropdown.

### 📱 UI Improvements
- **Mobile FABs**: Added Floating Action Buttons for key actions on mobile:
    - **Right Tick (✓)** on Quick Sale & Order Form (Save/Complete).
    - **Note**: Removed FAB from Orders List to reduce clutter.

### 🛠️ Backend
- **Schema**: Added `isQuickSale` boolean column to `Order` table.
- **Logic**: Enhanced `OrdersService` to handle "Walk-In" auto-creation and single-payment processing.
- **Fix**: Resolved `customerId` type handling in `create` method.

## [v1.4.0] - 2025-12-11 (Customer Search & UX)
### 👥 Customer Experience
- **Strict Selection**: Enforced strict customer selection in `OrderForm` (No more manual text entry).
- **Search UI**: Cleaner Interface - Removed "Customer Name" label, improved dropdown with Name + Address.
- **Locked Card**: Selected customer appears in a read-only card with "Edit" and "Change" actions.
- **Contact Sync**: Instant mapping of Customer Phone/Address to the Locked Card upon selection.
- **Edit Modal**: Unified "Edit Customer" experience via modal from both Order Form and Details page.

### 🛍️ Product Experience
- **Modal Integration**: `ProductForm` now supports `onSuccess` and `initialData` for seamless use within modals.
- **Feedback**: Added Toast notifications for creation/updates.
- **Accessibility**: Added unique IDs to input fields for better testing and accessibility.

### ☁️ Google Integration (Foundation)
- **Auth Strategy**: Added `GoogleStrategy` scaffolding for OAuth2.
- **Schema**: Added `user_id` relation to `Customer` model (Migration: `add_user_customer_relation`) to support user-specific data/contacts.

### 🛠️ Refactor
- **Order Form**: Removed redundant input fields for Phone/Address (now derived solely from selected customer).
- **Auto-Save**: Validation updated to require `customerId` before saving.
- **Backend API**: Added `SyncPaymentsDto` for strict validation of payment synchronization.

### 🧪 Tests
- **E2E Stabilization**: Fixed Desktop/Mobile viewport conflicts using `:visible` selectors.
- **Backend E2E**: Added `customers.e2e-spec.ts` for comprehensive backend testing.
- **Coverage**: Verified new Customer creation and selection flow.

## [v1.3.0] - 2025-12-10 (Auth System)
### 🔒 Security
- **Authentication**: Implemented JWT-based authentication for the entire platform.
- **Global Guard**: Secured all API endpoints by default (`JwtAuthGuard`); only `/auth/login` is public.
- **User Management**: Added `User` model to database.

### 👤 Admin Interface
- **Dashboard**: Added `/admin` dashboard for user management.
- **User Creation**: Admin can now create new users with username/password.

### ✨ Frontend
- **Auth Context**: Added global state for user session management.
- **Login Page**: New Login UI at `/login`.
- **Protected Routes**: Implemented `RequireAuth` wrapper to redirect unauthenticated users.

### 🔧 chore
- **Branching**: Moved experiment/feature work to `feature/auth-system` branch.
- **Cleanup**: Ignored MinIO data directories in git.

## [v1.2.1] - 2025-12-10 (Production Restoration)
### 🚀 Infrastructure
- **Production Restoration**: Successfully restored Production environment at `~/zenkar-platform-production` on ports **3001** (Backend) and **5174** (Frontend).
- **Data Safety**: Preserved legacy `pgdata` volume and migrated schema (Added `discount` column) using `zenkar-db-prod` on port **5433**.
- **Documentation**: Added `deploy/DEPLOYMENT_REFERENCE.md` as the single source of truth for deployment.

### Added
- **E2E Testing**: Full coverage for Customers and Products modules using Playwright.
- **Documentation**: Added `project_rules.md` for team conventions.
- **Scripts**: Added safe staging deployment script with backup and migration.

### Changed
- **E2E Config**: Removed Mobile Safari support; enabled auto-start for dev server.
- **Tests**: Improved `orders.spec.ts` robustness with visible-only locators.

### Fixed
- **Strict Mode Violations**: Fixed Playwright errors caused by duplicate elements in responsive views (FAB vs Desktop buttons).

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
