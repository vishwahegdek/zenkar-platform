
# Test Execution Logs

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
