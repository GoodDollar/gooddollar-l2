---
id: gooddollar-l2-fix-vitest-teardown-error
title: "Tests — Fix Vitest EnvironmentTeardownError in page.test.tsx"
type: fix
parent: gooddollar-l2
status: open
priority: P0
planned: true
executed: true
---

# Tests — Fix Vitest EnvironmentTeardownError in page.test.tsx

## Problem
Running the full Vitest suite (`npx vitest run`) exits with code 1 due to an unhandled `EnvironmentTeardownError`. The error originates from `SwapPriceChart.tsx` trying to lazily load `@/lib/chartData` after the test environment has been torn down.

The `next/dynamic` mock in `page.test.tsx` eagerly invokes `loader()`, triggering real imports of `SwapPriceChart` → `chartData.ts`. Other dynamic components are mocked but `SwapPriceChart` is not.

## Root Cause
`src/app/__tests__/page.test.tsx` mocks `next/dynamic` to eagerly call `loader()`. All dynamically imported components except `SwapPriceChart` have corresponding `vi.mock()` entries. The real `SwapPriceChart` import resolves after test environment teardown.

## Fix
Add `vi.mock('@/components/SwapPriceChart', ...)` to `page.test.tsx`, consistent with the other component mocks.

## Plan
1. Add mock for `@/components/SwapPriceChart` in `page.test.tsx`
2. Also mock `@/components/LandingSwapCard` since the dynamic import targets that module
3. Run `npx vitest run` to verify 0 errors
4. Commit

## Acceptance Criteria
- `npx vitest run` exits with code 0
- All 834+ tests still pass
- No unhandled errors in test output
