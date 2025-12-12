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
