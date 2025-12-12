
# Test Execution Logs

## [v1.5.0] - 2025-12-12
### Manual Backend E2E (Baseline Run)
**Status**: ✅ Passed (4/4 Suites, 14/14 Tests)
**Time**: 1.736s
**Log**:
```
PASS test/customers.e2e-spec.ts
PASS test/dashboard.e2e-spec.ts
PASS test/auth.e2e-spec.ts
PASS test/orders.e2e-spec.ts

Test Suites: 4 passed, 4 total
Tests:       14 passed, 14 total
```
**Notes**: Baseline run confirmed existing E2E tests are functional.

## [v1.4.0] - 2025-12-11
### Frontend E2E (Playwright)
**Spec**: `orders.spec.ts`
**Status**: ✅ Passed (2/2 tests)
**Duration**: 8.6s
**Browsers**: Desktop Chrome, Mobile Chrome
**Log**:
```
Running 2 tests using 2 workers
  2 passed (8.6s)
```
**Fixes**:
- Resolved selector timeouts in `Order List` (Desktop) and `Status Change` (Mobile) using `:visible` filters and robust container selection.

### E2E Manual Verification - Thu Dec 11 07:44:50 PM IST 2025
**Status**: 🔄 In Progress
- **Product Creation**: ✅ Passed (Created 'E2E Widget')
- **Customer Creation**: ❌ Failed (Retrying...)
- **Order Creation**: ❌ Failed (Retrying...)

> backend@1.2.0 test:e2e
> jest --config ./test/jest-e2e.json

PASS test/customers.e2e-spec.ts
  ● Console

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /?page=1&limit=5

      at ../src/app.module.ts:30:17

PASS test/dashboard.e2e-spec.ts
  ● Console

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

    console.log
      Stats Result (DB Time): { transactionsCount: 93, totalSales: 1533900, totalReceived: 1176800 }

      at DashboardService.getStats (../src/dashboard/dashboard.service.ts:21:13)

    console.log
      Dashboard Stats: { transactionsCount: 93, totalSales: 1533900, totalReceived: 1176800 }

      at Object.<anonymous> (dashboard.e2e-spec.ts:43:13)

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

PASS test/orders.e2e-spec.ts
  ● Console

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

    console.log
      [Request] PATCH /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

    console.log
      [Request] DELETE /

      at ../src/app.module.ts:30:17

PASS test/auth.e2e-spec.ts
  ● Console

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] POST /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17

    console.log
      [Request] GET /

      at ../src/app.module.ts:30:17


Test Suites: 4 passed, 4 total
Tests:       14 passed, 14 total
Snapshots:   0 total
Time:        1.706 s
Ran all test suites.

Running 6 tests using 6 workers

 [1A [2K[1/6] [Desktop Chrome] › e2e/dashboard.spec.ts:40:3 › Dashboard UI › Mobile Responsiveness Check
 [1A [2K[2/6] [Mobile Chrome] › e2e/dashboard.spec.ts:40:3 › Dashboard UI › Mobile Responsiveness Check
 [1A [2K[3/6] [Mobile Chrome] › e2e/dashboard.spec.ts:31:3 › Dashboard UI › Recent Activity and Payments Sections
 [1A [2K[4/6] [Mobile Chrome] › e2e/dashboard.spec.ts:18:3 › Dashboard UI › Stats Cards are visible
 [1A [2K[5/6] [Desktop Chrome] › e2e/dashboard.spec.ts:18:3 › Dashboard UI › Stats Cards are visible
 [1A [2K[6/6] [Desktop Chrome] › e2e/dashboard.spec.ts:31:3 › Dashboard UI › Recent Activity and Payments Sections
 [1A [2K  6 passed (2.4s)

To open last HTML report run:
 [36m [39m
 [36m  npx playwright show-report [39m
 [36m [39m
