---
id: gooddollar-l2-stocks-e2e-networkidle-timeout-fix
title: "Stocks E2E tests time out — networkidle never resolves due to keeper connection retries"
type: bug
priority: P0
status: open
created: 2026-05-21
parent: 0006-etoro-synthetic-stocks-100
planned: true
executed: true
split: false
---

# Stocks E2E tests time out due to networkidle + keeper retries

## Problem
`stocks-journey.spec.ts` and `app-regression.spec.ts` time out on stocks pages because:

1. **`stocks-journey.spec.ts`** — Every test uses `page.waitForLoadState('networkidle')`. The stocks page continuously retries the keeper WebSocket connection (`ERR_CONNECTION_REFUSED`), so `networkidle` (0 pending connections for 500ms) never resolves.

2. **`app-regression.spec.ts`** — The `isAllowedConsoleError` function does not include `ERR_CONNECTION_REFUSED`, so stocks pages that log keeper connection errors fail the "unexpected console errors" assertion.

## Evidence
- `surface-sweep.spec.ts` passes because it already filters `ERR_CONNECTION_REFUSED` at line 35
- `stocks-journey.spec.ts` times out after 30s on every test
- `app-regression.spec.ts` fails stocks routes due to unallowed console errors
- This blocks the 10-iteration quality gate (Operating Rule #4)

## Fix
1. In `stocks-journey.spec.ts`: replace all `waitForLoadState('networkidle')` with `waitForLoadState('domcontentloaded')` — the tests already wait for specific content via `expect(heading).toBeVisible({ timeout: 10_000 })`
2. In `app-regression.spec.ts`: add `ERR_CONNECTION_REFUSED` to `isAllowedConsoleError` regex pattern

## Scope
- `frontend/e2e/stocks-journey.spec.ts`
- `frontend/e2e/app-regression.spec.ts`
