# Threat & Invariant Notes: Symbol Sync Gate (Iteration 10)

## Invariant
- For each active stock symbol, risk-increasing actions are allowed only when:
  - quote is not stale,
  - divergence is <= 50 bps (0.5%),
  - `lastSyncedBlock(product, symbol) >= oracleBlock(symbol)`.

## Threats addressed
- **Stale propagation:** A lagging or stale quote can cause AMM/perps/predict/lend/yield disagreement and unsafe entry prices.
- **Cross-product drift:** Products using different block snapshots can expose contradictory valuations and liquidation math.
- **Silent risk escalation:** UI/action paths that do not check sync state can open/increase positions before propagation completes.

## Mitigations added
- Normalized quote status payload now carries per-symbol `oracleBlock` and per-product `productSync.lastSyncedBlock`.
- Shared invariant evaluator blocks risk-increasing actions on:
  - stale quote,
  - divergence > 0.5%,
  - lagging product sync.
- Stocks and perps order surfaces now consume the invariant and present explicit blocked reasons.

## Residual risk
- Non-stock symbols may not have strict sync enforcement if upstream does not provide symbol-level snapshots.
- Full backend-onchain proof of block-consistent value propagation remains tracked by follow-up drift dashboard/proof tasks.

