# Labour Module API Documentation

This document explicitly details the API endpoints used by the Labour Module in the Zenkar Platform. It covers the frontend usage, backend logic, database interactions, and example payloads.

## Overview
The Labour module is designed to manage daily wage labourers, their attendance, payments (expenses), and periodic settlements. It enforces data immutability for records prior to a settlement date.

**Base URL**: `/labour`
**Authentication**: Required (`JwtAuthGuard`)
  
---

## 1. Get Daily View
**Endpoint**: `GET /labour/daily`
**Used In**: `LabourEntry.jsx`

### Description
Fetches the daily attendance and payment status for all active labourers for a specific date.

### Parameters
| param | type   | required | description |
|-------|--------|----------|-------------|
| date  | string | No       | ISO Date string (e.g. `2025-12-14`). Defaults to today if omitted. |

### Backend Logic
1.  Fetches all labourers where `isDeleted: false`.
2.  Fetches `Attendance` records for the specific date.
3.  Fetches `Expense` records (payments) for the specific date linked to the labourer.
4.  Merges these datasets into a flat list.

### Database Tables Touched
- `labourers` (Read)
- `attendance` (Read)
- `expenses` (Read)

### Example Response
```json
[
  {
    "id": 1,
    "name": "Ramesh",
    "defaultDailyWage": "500.00",
    "attendance": "1.0", // 0, 0.5, or 1
    "amount": "200.00"   // Payment made that day
  },
  {
    "id": 2,
    "name": "Suresh",
    "defaultDailyWage": "600.00",
    "attendance": 0,
    "amount": 0
  }
]
```

---

## 2. Update Daily View (Bulk)
**Endpoint**: `POST /labour/daily`
**Used In**: `LabourEntry.jsx`

### Description
Updates attendance and payment information for multiple labourers for a specific date.

### Payload
```json
{
  "date": "2025-12-14",
  "updates": [
    {
      "contactId": 1, // Labourer ID
      "attendance": 1,
      "amount": 200
    },
    {
       "contactId": 2,
       "attendance": 0.5,
       "amount": 0
    }
  ]
}
```

### Backend Logic (Critical)
1.  **Immutability Check**: Checks `LabourSettlement` table. If the target `date` is on or before the labourer's last `settlementDate`, the request throws an error.
2.  **Attendance**:
    *   If `attendance > 0`: UPSERT (Update if exists, Create if not) into `Attendance` table.
    *   If `attendance == 0`: DELETE from `Attendance` table.
3.  **Expenses (Payments)**:
    *   If `amount > 0`: UPSERT into `Expense` table (Category = 'Labour').
    *   If `amount == 0`: DELETE from `Expense` table.

### Database Tables Touched
- `labour_settlements` (Read - Validation)
- `attendance` (Create/Update/Delete)
- `expenses` (Create/Update/Delete)
- `expense_categories` (Read/Create)

---

## 3. Get Labour Report (Individual)
**Endpoint**: `GET /labour/report`
**Used In**: `LabourReport.jsx`

### Description
Generates a detailed report of work and payments for a specific labourer, calculating the current balance.

### Parameters
| param      | type   | required | description |
|------------|--------|----------|-------------|
| labourerId | number | Yes      | ID of the labourer to report on. |

### Backend Logic
1.  Fetches the labourer and their latest `LabourSettlement`.
2.  Determines `StartDate`:
    *   If a settlement exists, `StartDate` = `settlementDate` records strictly **AFTER** this date are fetched.
    *   If no settlement, all history is fetched.
3.  Fetches `Attendance` and `Expense` records after `StartDate`.
4.  Calculates:
    *   `TotalDays` = Sum of attendance values.
    *   `TotalSalary` = `TotalDays` * `defaultDailyWage`.
    *   `TotalPaid` = Sum of expense amounts.
    *   `Balance` = `TotalSalary` - `TotalPaid`.

### Database Tables Touched
- `labourers` (Read)
- `labour_settlements` (Read)
- `attendance` (Read)
- `expenses` (Read)

### Example Response
```json
[
  {
    "id": 1,
    "name": "Ramesh",
    "salary": 500, // Current Wage
    "totalDays": 5.5,
    "totalSalary": 2750,
    "totalPaid": 1000,
    "balance": 1750, // Positive = Payable to Labourer
    "lastSettlementDate": "2025-11-30T00:00:00.000Z",
    "records": [
        { "date": "2025-12-01", "attendance": 1, "amount": 0 },
        { "date": "2025-12-02", "attendance": 1, "amount": 500 }
    ]
  }
]
```

---

## 4. Create Settlement (Zero Date)
**Endpoint**: `POST /labour/:id/settle`
**Used In**: `LabourReport.jsx`

### Description
"Zeros" the account by creating a snapshot of the current balance up to a specific date. All records prior to this date become immutable history.

### Payload
```json
{
  "settlementDate": "2025-12-14",
  "note": "Diwali Settlement" // Optional
}
```

### Backend Logic
1.  Calculates the report stats (days, salary, paid, balance) for the period ending on `settlementDate`.
2.  Creates a new record in `LabourSettlement` with these snapshots.
3.  Future reports will now only look for data *after* `2025-12-14`.

### Database Tables Touched
- `labour_settlements` (Create)

---

## 5. Manage Labourers (CRUD)
**Used In**: `LabourManage.jsx`

### List All
*   **Endpoint**: `GET /labour` (Via `getReport` internal reuse or direct list)
*   **Returns**: List of all `isDeleted: false` labourers.

### Create
*   **Endpoint**: `POST /labour`
*   **Payload**: `{ "name": "Name", "defaultDailyWage": 500 }`
*   **Action**: Creates record in `labourers` table.

### Update
*   **Endpoint**: `POST /labour/:id`
*   **Payload**: `{ "name": "Updated Name", "defaultDailyWage": 600 }`
*   **Action**: Updates name/wage in `labourers` table. Does **not** affect historical wage snapshots in settlements.

### Delete (Soft)
*   **Endpoint**: `DELETE /labour/:id`
*   **Action**: Sets `isDeleted = true` in `labourers` table. Data is preserved but hidden from UI.

---
