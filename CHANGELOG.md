# Changelog

All notable changes to the Zenkar Platform will be documented in this file.

## [v1.10.0] - 2026-01-07 (Production Module & Status Refactor)
### 🏭 Production Module
- **New Page**: Launched `/production` for managing manufacturing workflow.
- **Workflow**: Track items from `Confirmed` -> `In Production` -> `Ready` -> `Delivered`.
- **Filtering**:
    - **Category Filter**: Filter production queue by Product Category (default: "Bee boxes").
    - **Product Filter**: Further refine by specific products.
- **Interactive Queue**:
    - **Clickable Rows**: Navigate directly to Order Details from the queue.
    - **Status Updates**: Update item status directly from the list; updates propagate to Order status.

### 🏗️ Status Refactoring (Major)
- **Granular Statuses**: Migrated from simple string statuses to strict **Prisma Enums**.
    - **Order Status**: `ENQUIRED`, `CONFIRMED`, `CLOSED`, `CANCELLED`.
    - **Delivery Status**: `CONFIRMED`, `IN_PRODUCTION`, `READY`, `PARTIALLY_DELIVERED`, `FULLY_DELIVERED`.
    - **Payment Status**: `UNPAID`, `PARTIALLY_PAID`, `FULLY_PAID`.
- **Logic Overhaul**:
    - **Auto-Calculated**: Delivery and Payment statuses are now derived from Item Statuses and Transaction History.
    - **Closing Rules**: An order can only be `CLOSED` if it is both `FULLY_DELIVERED` and `FULLY_PAID`.

### ⚡ UI/UX Improvements
- **Orders List**:
    - **Revert**: Restored the classic "Editable Status Dropdown" for quick status changes.
    - **Clarity**: Split Status into "Order Status" (Editable) and "Delivery Status" (Badge). Removed Payment Status to reduce clutter.
    - **Tags**: Hidden "Delivery Status" tag for **Quick Sale** orders to reduce noise.
- **Order Details**:
    - **Header**: Displaying distinct badges for Order, Delivery, and Payment statuses.
    - **Items Table**: Added visible Status column for individual items.

### 📦 Product Categories
- **Management**: New "Manage Categories" modal in Products list.
- **Organization**: Assign categories to products for better filtering in Production and Reports.

### 🔧 Backend
- **Migration**: Added formal migration `20260107140000_status_refactor` to handle data conversion to Enums.
- **API**: Updated `OrdersService` to expose `updateItemStatus` and `findProductionItems` (with `orderId`).

## [v1.9.1] - 2026-01-05 (Hotfix)
### 🐛 Bug Fixes
- **Regression**: Fixed missing database column `google_refresh_token` that caused 500 Error on deployment.
- **Docker**: Ensured Prisma Client is correctly generated and copied in the production image.

## [v1.9.0] - 2026-01-05 (Global Access & Google Sync)
### 🌍 Global Data Access
- **No More Silos**: Refactored `Customer`, `Order`, `Finance`, and `Expense` modules to remove user-specific restrictions.
- **Collaboration**: All team members can now access and manage the same business entities (Customers, Creditors, Recipients).
- **Smart Linking**: Creating orders/expenses now intelligently links to existing global records instead of creating duplicates.

### 👥 Google Contacts Sync (Two-Way)
- **Push & Pull**: Full two-way synchronization between Zenkar and Google Contacts.
- **Manual Sync**: Added "Sync Now" button for instant updates.
- **Organization**: Contacts from the app are automatically labeled "**Zenkar App**" in Google.
- **Reliability**: Improved OAuth flow with connection status indicators (✅ Connected / ❌ Not Connected).

### ⚡ UI/UX Improvements
- **Global Search**: Reducing search threshold to **1 character** across the entire platform (Quick Sale, Orders, etc) for significantly faster lookup.
- **Orders List**: Safety Cleanup - Removed 'Edit'/'Delete' buttons from the list view to prevent accidental clicks. Access these actions via the Order Details page.
- **Order Details**: Consolidated "Record Payment", "Print", "Edit" into a single **"Actions"** dropdown menu. Removed redundant "Back" button.

### 💸 Expenses Enhancements
- **Search**: Added search bar to Expense Book (filters by description, recipient, or category).
- **Edit**: Added inline "Edit" button to modify existing expenses.
- **Backend**: Updated API to support search filtering and single expense retrieval.
- **Backend**: Added `GET /expenses?date=YYYY-MM-DD` for single-day filtering.
- **Pagination**: Integrated "Daily View" with Round Prev/Next navigation buttons in the header.
- **Sorting**: Expenses are sorted by `updatedAt` descending, with visible modification times.


## [v1.8.1] - 2025-12-18 (Carry Forward & History)
### 🔄 Carry Forward Settlements
- **Feature**: Option to "Carry Forward" balance during labour settlement instead of clearing it to zero.
- **UI**:
    - Replaced checkbox with explicit **"Settle (Clear)"** and **"Carry Fwd"** buttons.
    - Added custom Confirmation Modal for better user clarity.
    - **Report**: Highlighted "Opening Balance" row to show carried-forward debt.
- **Backend**:
    - Added `isCarryForward` flag to `LabourSettlement` table.
    - Logic to calculate opening balance based on previous settlement's carry-forward status.

### 📜 Report History
- **Feature**: View past settlement reports exactly as they were.
- **UI**: Added History Dropdown to toggle between Current Period and Historical Settlements.
- **Logic**: Fetching report by `settlementId` locks the view to that specific period.

 
## [v1.8.0] - 2025-12-17 (Strict Payments & Recipients)
### 💳 Strict Payments
- **Payment Method Enforcement**: Enforced strict "Cash" or "UPI" selection for payments.
    - **Order Form**: Restricted Advance Payment options to Cash/UPI.
    - **Quick Sale**: Simplified payment selector to enforce strict methods.
    - **Order Details**: Updated Payment Modal to allow only valid payment types.
- **Backend Validation**: Enhanced `OrdersService` and `SyncPaymentsDto` to validate payment methods strictly.

### 💸 Expense Recipients
- **New Module**: Introduced **Recipients Management** for better expense tracking.
- **Features**:
    - **Manage Recipients**: centralized list of people/entities you pay.
    - **Smart Search**: Integrated into Expense Form for quick lookup.
    - **Link to Contacts**: Ability to promote existing Contacts to Recipients.

### 🧪 Testing Enhancements
- **Labour E2E**: Implemented comprehensive 15-day lifecycle simulation (attendance, settlements, reporting).
- **Orders E2E**: Added strict coverage for Order creation, editing, and payment flows.
- **Robustness**: Stabilized E2E tests with better wait strategies and visible-only selectors.

## [v1.7.0] - 2025-12-13 (Creditors & Labour Settlements)
### 💰 Creditors Management (Debt Tracking)
- **New Module**: Launched standalone **Creditors** module for managing Accounts Payable.
- **Features**:
    - **Creditor Profiles**: Create and manage profiles for Suppliers/Lenders.
    - **Transaction Ledger**: Record "Debts" (Purchases/Borrowing) and "Repayments".
    - **Live Balance**: Real-time calculation of net amount owed to each creditor.
    - **Mobile First**: Simple, card-based interface optimized for mobile usage.

### 👷 Labour Settlements (Zero Dates)
- **Settlement Logic**: Introduced "Zero Date" concept to settle/archive labour accounts periodically.
- **Workflow**:
    - Admins can now "Settle" a labourer's account up to a specific date.
    - The system snapshots the total Attendance and Amount Paid at that point.
    - **Report View**: Automatically resets the view to show only attendance/payments **after** the last settlement date, ensuring a clean "Current Due" view.
- **Backend**: Added `LabourSettlement` model and enhanced `LabourService` to filter reporting data based on settlement timestamps.
- **Labour Settlements**: Added "Set Zero" functionality to labour reports to clear previous dues and start fresh.

### Database Changes
- **New Table `labour_settlements`**:
  - Stores settlement history for each labourer.
  - Columns:
    - `settlement_date`: The cutoff date for the settlement.
    - `total_attendance`: Total days worked up to the settlement date.
    - `total_payable`: Total amount payable (Attendance * Wage).
    - `total_paid`: Total amount paid to the labourer.
    - `net_balance`: Outstanding balance at the time of settlement.
    - `wage_snapshot`: recorded wage of the settlement period.
- **New Table `creditors`**: Stores tracking details for people you owe money to.
- **New Table `creditor_transactions`**: Logs debts and repayments for creditors.


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
