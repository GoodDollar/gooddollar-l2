# E2E failure audit — 2026-05-22

Source: `/home/goodclaw/goodchain-rc-lanes/e2e-gate/.playwright-test-results/app-regression.json`

## JSON stats

- Expected/pass: 499
- Skipped: 7
- Unexpected: 308
- Flaky: 0
- Duration: 964,837 ms

## Failure signatures

- 305 × server unavailable / `ECONNREFUSED` / `ERR_CONNECTION_REFUSED` on `localhost:3119`
- 2 × perps submit/on-chain flow button or state assertion failed
- 1 × faucet burn/null/contract address should reject with 400

By project:
- `mobile-chrome`: 250 failures
- `chromium`: 58 failures

## True non-server failures visible before fixing the server cascade

1. `faucet-reliability.spec.ts` — burn address rejection expected 400. The `e2e-gate` lane commit `b4b6fa38` addresses this; targeted rerun later passed 10/10 non-skipped faucet tests.
2. `perps-journey.spec.ts` — submit enabled / full on-chain position state. After server fixes, the simple submit-enabled path passed, but the full on-chain flow still fails because `readOpenTesterPositions()` does not observe an open position after `Order Placed!`.

## Recommendation

- Include `b4b6fa38` only with the follow-up server-stability fix commit `db6f6914`; by itself, the full E2E result remains dominated by server cascade.
- Treat the 305 connection failures as harness/server configuration, not individual product failures.
- Treat the remaining perps full on-chain assertion as the active E2E blocker for RC.
