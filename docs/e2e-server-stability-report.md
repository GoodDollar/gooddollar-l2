# E2E server stability — lane report (2026-05-22)

## Verdict

PARTIAL PASS. The server-refusal cascade is fixed and verified on representative Chromium + mobile slices. The full E2E gate is still blocked by at least one real perps on-chain assertion failure.

## Root cause fixed

`frontend/playwright.config.ts` used `http://localhost:3119` while `next-runtime-server.mjs` listens on IPv4 (`0.0.0.0`). On this host, some Playwright paths, especially `mobile-chrome` and `apiRequest`, resolve `localhost` to `::1` first, producing `ECONNREFUSED ::1:3119` even though the IPv4 server is healthy.

The previous full JSON at `/home/goodclaw/goodchain-rc-lanes/e2e-gate/.playwright-test-results/app-regression.json` showed:
- 499 passed
- 7 skipped
- 308 unexpected
- 305 / 308 unexpected failures were server-unavailable / ECONNREFUSED

A second issue appeared during verification: Playwright reused an old production E2E server after `build:e2e:force`, causing stale HTML/chunk mismatches. Production E2E now disables server reuse.

## Changes

- `frontend/playwright.config.ts`
  - default host is now `127.0.0.1` instead of `localhost`
  - production E2E does not reuse an existing server
- `frontend/scripts/e2e-web-server.mjs`
  - uses async `spawn` and forwards SIGINT/SIGTERM to the child runtime server
- `frontend/scripts/next-runtime-server.mjs`
  - passes `NEXT_DIST_DIR` into Next config so `.next.e2e` is actually served
- `frontend/e2e/quick-screenshots.spec.ts`
  - uses the same `E2E_HOST` default
- `frontend/src/app/activity/page.tsx`
  - expected RPC upstream errors are surfaced in UI without `console.error`, keeping smoke tests focused on unhandled app errors
- `frontend/e2e/perps-journey.spec.ts`
  - full on-chain flow test timeout now matches its 90s polling expectation

## Verification run after fixes

- `cd frontend && npm run build:e2e:force` — PASS
- `cd frontend && E2E_PROD_SERVER=1 npx playwright test e2e/analytics.spec.ts e2e/app-regression.spec.ts --project=chromium --project=mobile-chrome` — 62/62 PASS
- `cd frontend && E2E_PROD_SERVER=1 npx playwright test e2e/faucet-reliability.spec.ts --project=chromium` — 10 passed, 1 skipped
- `cd frontend && E2E_PROD_SERVER=1 npx playwright test e2e/perps-journey.spec.ts --project=chromium` — 19 passed, 1 failed
- `git diff --check` — PASS

## Remaining blocker

`e2e/perps-journey.spec.ts` full on-chain flow still fails after `Order Placed!`: `readOpenTesterPositions()` does not observe an open position within 90s. This is no longer a server-connectivity failure; it is a real perps/on-chain state or test expectation blocker.

## Recommendation

Include this lane’s server/harness fixes before rerunning the full E2E gate. Do not declare RC green until the perps on-chain position assertion is fixed or explicitly scoped out by product decision.
