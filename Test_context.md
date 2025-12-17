# Testing Context & Audit Report

## 1. Testing Infrastructure Audit
**Generated:** 2025-12-12

### Overview
The application uses a split testing strategy:
- **Backend (NestJS):** Uses **Jest** for both unit and end-to-end (E2E) testing.
- **Frontend (React/Vite):** Uses **Vitest** for unit/integration testing and **Playwright** for E2E testing.

### Backend (`/backend`)
*   **Framework:** NestJS
*   **Test Runner:** Jest
*   **Unit Tests:** Co-located `src/**/*.spec.ts`.
*   **E2E Tests:** Located in `/backend/test/` (`*.e2e-spec.ts`). Configured via `test/jest-e2e.json`.
*   **Commands:**
    *   `npm run test` (Unit)
    *   `npm run test:e2e` (E2E)

### Frontend (`/frontend`)
*   **Framework:** React (Vite)
*   **Runners:** Vitest (Unit), Playwright (E2E).
*   **Unit Tests:** `src/**/*.test.jsx`. Configured in `vite.config.js`.
*   **E2E Tests:** Located in `/frontend/e2e/`. Configured in `playwright.config.ts`.
    *   **Browsers:** Mobile Chrome (Pixel 5), Desktop Chrome.
*   **Commands:**
    *   `npm run test` (Vitest)
    *   `npm run test:e2e` (Playwright)

---

## 2. Swagger API Documentation
*   **URL:** `http://localhost:3000/api/docs` (Local DB) or deployed equivalent.
*   **JSON Spec:** `http://localhost:3000/api/docs-json` (Default NestJS behavior, may vary).
*   **Authentication:** 
    *   The Swagger UI uses **Bearer Auth**.
    *   You must separately obtain a JWT token (login via API or Frontend) and click the "Authorize" button to paste it.
    *   There is **no built-in username/password login form** directly inside the Swagger UI to generate tokens; it expects an existing token.

---

## 3. Logs & Reports
*   **Test Logs:** See `TEST_LOGS.md` for historical execution logs.
*   **Curl Tests:** See `BACKEND_CURL_TESTS.md` for manual curl command library.

## 4. Recent Test Coverage Additions (2025-12-13)
**Focus:** Order System Robustness & Customer Creation Logic

### Backend E2E Tests (`orders.e2e-spec.ts`)
New test cases were added to verify critical workflows and prevent regression of 500 errors during order updates.

1.  **Update Order: Change to Existing Customer**
    *   **Goal:** Verify that changing an order's customer to another existing customer properly updates the link.
    *   **Result:** PASSED.

2.  **Update Order: Change to New Customer (via Contact)**
    *   **Goal:** Verify the bug fix where editing an order and setting `customerId: 0` (with contact details) triggers the backend to create a new customer and link it.
    *   **Context:** This previously caused a 500 error due to unhandled fields (`contactId`).
    *   **Result:** PASSED.

3.  **New Order: Create with New Customer from Contact**
    *   **Goal:** Ensure the "New Order" flow correctly creates a customer when selected from contacts (`customerId: 0`).
    *   **Result:** PASSED.

4.  **Quick Sale: Create with New Customer from Contact**
    *   **Goal:** Ensure the "Quick Sale" flow correctly handles the same new customer creation logic.
    *   **Result:** PASSED.

### Fix Verification
*   **Excluded Fields:** Verified that sending `contactId` and `paymentMethod` in the Update payload no longer causes "Unknown argument" errors.
*   **Data Conversion:** Verified that Date strings and Numbers in the Update payload are correctly converted before database insertion.
