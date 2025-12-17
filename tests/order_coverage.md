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

## Technical Implementation
- **Test File**: `backend/test/strict_orders.e2e-spec.ts`
- **Strict DTOs**: 
    - `CreateContactDto`: Phone mandatory.
    - `CreateCustomerDto`: Validation Logic in Service.
    - `CreateProductDto`: Price mandatory.
    - `CreateOrderDto`: PaymentMethod mandatory, Items check.
- **Authentication**: All tests run as Authenticated User.
