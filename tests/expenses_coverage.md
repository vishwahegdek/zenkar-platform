# Expenses Module E2E Coverage

## Backend API (`backend/test/expenses.e2e-spec.ts`)

| Scenario | Status | Description |
| :--- | :--- | :--- |
| **Create Category** | ✅ Passed | Verifies creating a new expense category. |
| **List Categories** | ✅ Passed | Verifies retrieving the list of categories. |
| **Create Expense** | ✅ Passed | Verifies creating an expense with basic fields. |
| **List Expenses** | ✅ Passed | Verifies listing all expenses. |
| **Filter by Category** | ✅ Passed | Verifies `GET /expenses?categoryId=...`. |
| **Search by Description** | ✅ Passed | Verifies `GET /expenses?search=...` filters by text. |
| **Create with Recipient** | ✅ Passed | Verifies creating an expense with `recipientName` auto-creates/links recipient. |
| **Update Expense** | ✅ Passed | Verifies updating amount and basic fields. |
| **Update with Recipient** | ✅ Passed | Verifies updating `recipientName` resolves correctly. |
| **Find One** | ✅ Passed | Verifies `GET /expenses/:id`. |
| **Delete Expense** | ✅ Passed | Verifies deletion. |
| **Filter by Date** | ✅ Passed | Verifies `GET /expenses?date=YYYY-MM-DD` returns only specific day's records. |

## Frontend Integration (`frontend/e2e/expenses.spec.ts`)

| Scenario | Status | Description |
| :--- | :--- | :--- |
| **Search & Edit** | ✅ Passed | Simulates creating an expense, searching for it, editing it, and verifying updates. (Note: Mobile viewport requires extended timeouts). |
| **Date Navigation** | ✅ Passed | Verifies Previous/Next day navigation works using the UI controls. |

> **Verification**: All Backend tests passed (12/12). Frontend tests passed on Desktop, minor timing variance on Mobile simulation.
