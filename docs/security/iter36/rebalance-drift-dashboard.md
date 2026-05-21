# Rebalance Drift Dashboard (Iter36)

Generated: 2026-05-21T08:56:26.616Z

## Symbol Drift Table

| Symbol | Block Window | Max Divergence (bps) | Stale Products | Stop Reasons | Status |
|---|---|---:|---|---|---|
| AAPL | 1200->1201 | 1 | none | none | PASS |
| TSLA | 1200->1201 | 20 | amm | STALE_PROPAGATION,SECRET_LEAKAGE | FAIL |

## P0 Stop Rule Matrix

| P0 Rule | State |
|---|---|
| divergence > 0.5% | clear |
| stale propagation | TRIGGERED |
| secret leakage | TRIGGERED |
