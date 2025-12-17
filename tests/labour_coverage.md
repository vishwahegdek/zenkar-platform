# Labour Module Comprehensive Test Flow

This document outlines the rigorous End-to-End (E2E) testing scenario used to validate the robustness of the Labour Module. This flow is applied identically to both Backend API tests and Frontend UI tests.

## Test Scenario

### 1. Labourer Creation
*   **Action**: Create a new labourer named "Test Worker [Timestamp]".
*   **Input**: Name, Default Wage (e.g., ₹500).
*   **Verification**: Ensure ID is generated and record exists.

### 2. High-Volume Data Entry (15 Days)
*   **Action**: Iterate through 15 consective days (e.g., T-20 to T-5).
*   **Input**: Randomly assign:
    *   Attendance: 0, 0.5, or 1.0.
    *   Payment (Expense): Random amount between 0 and 500.
*   **Verification**: Keep a running total of `ExpectedDays` and `ExpectedPaid`.

### 3. Pre-Settlement Report Verification
*   **Action**: Fetch the Report for the labourer.
*   **Verification**:
    *   `TotalDays` == `ExpectedDays`
    *   `TotalPaid` == `ExpectedPaid`
    *   `TotalSalary` == `ExpectedDays * CurrentWage`
    *   `Balance` == `TotalSalary - TotalPaid`

### 4. Settlement (Archive History)
*   **Action**: Execute Settlement on Day 10 (T-10).
*   **Verification**:
    *   History prior to T-10 is archived.
    *   Report now only shows data from Day 11 to Day 15.
    *   New `ExpectedDays` = Sum(Day 11..15).
    *   New `ExpectedPaid` = Sum(Day 11..15).
    *   Verify Report matches these new partial totals.

### 5. Salary Update Validation
*   **Action**: Update Labourer's Default Wage (e.g., from ₹500 to ₹600).
*   **Verification**:
    *   Re-fetch Report.
    *   `TotalSalary` should now equal `NewExpectedDays * 600`.
    *   `Balance` should recalculate accordingly.

### 6. Soft Deletion & Cleanup
*   **Action**: Delete the Labourer.
*   **Verification**:
    *   API: `GET /labour` should NOT list the labourer.
    *   DB: Record should exist with `isDeleted: true`.
    *   Future interactions should be blocked (or return 404).

---

## Coverage
- [x] Backend API E2E (`backend/test/labour.e2e-spec.ts`)
- [x] Frontend UI E2E (`frontend/e2e/labour-flow.spec.ts`)
