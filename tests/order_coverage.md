# Order Module E2E Test Coverage

## Overview
This document details the strict validation and logic tests implemented in `backend/test/strict_orders.e2e-spec.ts`. These tests ensure that the API adheres to the strict business rules defined for Contacts, Customers, Products, and Orders.

## Test Scenarios

### 1. Contacts Module
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| C1 | Create Contact without `phone` | `400 Bad Request` | ✅ Verified |
| C2 | Create Contact without `name` | `400 Bad Request` | ✅ Verified |
| C3 | Create Contact with Name & Phone | `201 Created` | ✅ Verified |
| C4 | List Contacts and Verify | `200 OK` & Data Match | ✅ Verified |
| C5 | Update Contact | `200 OK` | ✅ Verified |

### 2. Customers Module
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| CU1 | Create without Name OR ContactId | `400 Bad Request` (Logic Check) | ✅ Verified |
| CU2 | Create with Short Name (<6 chars) | `400 Bad Request` (Validation) | ✅ Verified |
| CU3 | Create via ContactId (Smart Select) | `201 Created` (Auto Name/Phone) | ✅ Verified |
| CU4 | Get Customer Details | `200 OK` | ✅ Verified |

### 3. Products Module
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| P1 | Create without Name | `400 Bad Request` | ✅ Verified |
| P2 | Create without Default Price | `400 Bad Request` | ✅ Verified |
| P3 | Create Valid Product | `201 Created` | ✅ Verified |

### 4. Orders Module
| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| O1 | Create with Empty Items | `400 Bad Request` | ✅ Verified |
| O2 | Create without PaymentMethod | `400 Bad Request` | ✅ Verified |
| O3 | Create without CustomerId & ContactId | `400 Bad Request` (Strict) | ✅ Verified |
| O4 | Create with CustomerID (Legacy Fields Ignored) | `201 Created` & Fields Ignored | ✅ Verified |
| O5 | Create with ContactID (Auto-Resolve Customer) | `201 Created` & Customer Linked | ✅ Verified |
| O6 | Create with Advance Amount | `201 Created` & Payment Record Created | ✅ Verified |

## Technical Implementation
- **Test File**: `backend/test/strict_orders.e2e-spec.ts`
- **Strict DTOs**: 
    - `CreateContactDto`: Phone mandatory.
    - `CreateCustomerDto`: Validation Logic in Service.
    - `CreateProductDto`: Price mandatory.
    - `CreateOrderDto`: PaymentMethod mandatory, Items check.
- **Authentication**: All tests run as Authenticated User.

---

## Backend Orders E2E Tests
**File**: `backend/test/orders.e2e-spec.ts`

| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| BE1 | Create Order with Indian Context | `201 Created` & Customer Linked | ✅ Verified |
| BE2 | Add Partial Payment to Order | `201 Created` | ✅ Verified |
| BE3 | Verify Balance After Payments | `200 OK` & Balance Calculated | ✅ Verified |
| BE4 | Close Order & Write-off Balance | `200 OK` & Discount Created | ✅ Verified |
| BE5 | Create Large Order (20+ Items) | `201 Created` | ✅ Verified |
| BE6 | Update Customer to Existing | `200 OK` & Customer Changed | ✅ Verified |
| BE7 | Update Customer to New (via Contact) | `200 OK` & Customer Created | ✅ Verified |
| BE8 | Create Order with Contact | `201 Created` & Auto-Resolve Customer | ✅ Verified |
| BE9 | Quick Sale Order | `201 Created` & `isQuickSale` Flag | ✅ Verified |
| BE10 | Delete Orders (Cleanup) | `200 OK` | ✅ Verified |

---

## Backend Search Tests
**File**: `backend/test/orders-search.e2e-spec.ts`

| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| BS1 | GET /orders Returns Structure | `200 OK` & `{data, meta}` Format | ✅ Verified |
| BS2 | Search with Non-Existent Name | `200 OK` & Empty `data` Array | ✅ Verified |

**Key Validations**:
- Response structure has `data` (array) and `meta` (pagination info)
- Search parameter filters by customer name (case-insensitive)
- Returns empty array if no matches found

---

## Frontend Pagination Tests
**File**: `frontend/e2e/orders-pagination.spec.ts`

| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| FP1 | Display 20 Orders Initially | 20 Rows/Cards Visible | ⚠️ Timeout (Selector Wait) |
| FP2 | Load More Button Visible | Button Shows When `hasNextPage` | ⚠️ Timeout (Selector Wait) |
| FP3 | Load More Loads Next 5 Orders | Total 25 Orders After Click | ⚠️ Timeout (Selector Wait) |
| FP4 | Load More Button Disappears | Hidden When No More Pages | ⚠️ Timeout (Selector Wait) |
| FP5 | Search with 15 Results | All 15 Display, No Load More | ✅ Verified (Both Desktop & Mobile) |

**Test Details**:
- **Test 1**: Creates 25 orders via API, verifies initial 20 display, then loads remaining 5
- **Test 2**: Creates 15 orders with specific search term, verifies all display on single page
- **Both Tests**: Work for Desktop (table) and Mobile (card) views

**Known Issues**:
1. **Selector Timeout** (Test 1): `page.waitForSelector('table tbody tr, div.p-3.bg-white')` times out
   - Orders are created successfully via API
   - Page navigates to `/orders` but table/cards don't render in time
   - **Suggested Fix**: Use `page.waitForResponse('/api/orders')` instead of selector wait

---

## Frontend Order Management Tests
**File**: `frontend/e2e/orders.spec.ts`

| ID | Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| FO1 | Navigate to Create Order | URL: `/orders/new` | ⚠️ Navigation Issue |
| FO2 | Create Customer via Modal | Customer Created & Form Populated | ⚠️ Blocked by FO1 |
| FO3 | Create Product via Modal | Product Created & Auto-Fill Price | ⚠️ Blocked by FO1 |
| FO4 | Save Order with Advance Payment | Order Created & Redirect to List | ⚠️ URL Mismatch (`/orders/new#` instead of `/orders`) |
| FO5 | Verify Order in List | Order Visible After Creation | ⚠️ Blocked by FO4 |
| FO6 | Navigate to Order Details | Order Details Page Loads | ⚠️ Blocked by FO5 |
| FO7 | Record Additional Payment | Payment Added & Balance Updated | ⚠️ Blocked by FO6 |
| FO8 | Manage Payments (Edit Mode) | Edit/Add/Delete Payments | ⚠️ Blocked by FO6 |
| FO9 | Close Order from List | Status Changed to Closed | ⚠️ Blocked by FO6 |
| FO10 | Verify Zero Balance on Close | Balance = 0 & No Discount | ⚠️ Blocked by FO6 |

**Known Issues**:
1. **URL Hash Fragment** (Line 95): After saving order, URL is `/orders/new#` instead of `/orders`
   - Likely caused by hash-based modal navigation leaving fragment in URL
   - **Suggested Fix**: Clear hash in `OrderForm.jsx` after successful save

---

## Summary Statistics
- **Total Backend Tests**: 18 scenarios (**18 ✅ Passed**, 0 ❌ Failed)
- **Total Frontend Tests**: 15 scenarios (**1 ✅ Passed**, **14 ⚠️ Timeout/Blocked**)
- **Coverage Areas**:
  - ✅ Strict validation (Contacts, Customers, Products, Orders)
  - ✅ Order lifecycle (Create → Payment → Close)
  - ✅ Customer management in orders
  - ✅ Backend search functionality
  - ✅ Search with pagination (frontend)
  - ⚠️ Frontend pagination (selector timeout)
  - ⚠️ Frontend order form flow (navigation issues)

**Priority Fixes**:
1. Fix URL hash fragment issue in `OrderForm.jsx` after save
2. Replace selector waits with API response waits in pagination test
