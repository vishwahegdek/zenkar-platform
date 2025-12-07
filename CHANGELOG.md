# Changelog

All notable changes to the Zenkar Platform will be documented in this file.

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
