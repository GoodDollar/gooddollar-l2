# Price / Yield Rebalance Design — every-block invariant

Date: 2026-05-21
Status: Proposed SpecKit addendum for `0006-etoro-synthetic-stocks-100`

## Goal

All GoodChain stock surfaces must converge around one canonical eToro-derived index price and one canonical stock carry/yield curve. GoodStocks AMMs, StockPerps, prediction markets, GoodLend, GoodYield, and the frontend must rebalance from the same block-indexed state, not from independent app-local prices.

## Canonical price path

1. eToro quote ingestion normalizes bid/ask/last into `NormalizedQuote` with `priceE8`, market-hours state, and freshness metadata.
2. Signer quorum signs the canonical quote for each symbol.
3. `StockOracleV2` stores the per-symbol price, timestamp, block number, confidence/deviation flags, and market-hours state.
4. `BlockRebalanceKeeper` runs once per block and calls product sync hooks for all active symbols.
5. Every app reads the same `StockOracleV2` block snapshot:
   - GoodStocks AMM: oracle mid ± dynamic spread/inventory skew.
   - StockPerps: index price from oracle; mark price = index + bounded OI/skew premium.
   - Prediction markets: outcome/market UI and risk checks consume the same index snapshot; prediction AMM prices are probabilities, but settlement/reference equity price is the same oracle snapshot.
   - GoodLend/GoodYield: collateral value, borrow limits, vault NAV, and stock carry use the same oracle snapshot.
   - Frontend/API: display block number and oracle timestamp for every quoted price.

## Every-block rebalance invariant

For each active symbol and block `B`:

- `oraclePrice(symbol, B)` is the only index price used by products.
- If no fresh eToro quote exists, products reuse the last-good oracle value only until the staleness threshold, then risk-increasing actions halt.
- AMM, perp, lend, yield, and prediction modules expose `lastSyncedBlock(symbol)`.
- A product may not execute a risk-increasing action if `lastSyncedBlock(symbol) < currentBlock` unless it first runs `syncSymbol(symbol)`.
- P0 stop condition: oracle divergence > 0.5%, stale price propagation, or product price drift beyond tolerance.

## Cross-product price formulas

### AMM synthetic stock price

- `mid = StockOracleV2.priceE8(symbol)`
- `spread = baseSpread + volatilitySpread + stalenessPenalty + inventorySkew + marketHoursFactor`
- Buy from AMM: `ask = mid * (1 + spread)`
- Sell to AMM: `bid = mid * (1 - spread)`

### Perp mark/funding

- `index = StockOracleV2.priceE8(symbol)`
- `mark = index * (1 + boundedSkewPremium)`
- `fundingRate = clamp((mark - index) / index + oiImbalanceTerm, ±fundingRateCap)`
- Funding accrues continuously but is checkpointed on `syncSymbol`, open, close, liquidate, and keeper tick.

### Prediction markets

Prediction AMM prices remain probability prices, not equity prices. However:

- equity settlement/reference price comes from `StockOracleV2`;
- market resolution checks use the same block-indexed oracle snapshot;
- displayed stock reference price and risk controls must match the canonical oracle block.

## Stock carry / lending / perps cost balancing

Define a per-symbol `StockCarryRate` updated daily but accrued per block:

`stockCarry = borrowRate - lendSupplyYield - dividendYield + hedgeBorrowCost + fundingBasisAdjustment`

Usage:

- GoodLend: supply/borrow rates for stock collateral include `stockCarry` and utilization.
- StockPerps: daily funding includes mark/index premium plus `stockCarry` so long/short economics match lending/yield costs.
- GoodYield: vault NAV accrues stock dividends/borrow/rebate components from the same `StockCarryRate`.
- Reconciliation: net carry paid by perps + borrow interest must reconcile against lend/yield accrual and hedge costs within tolerance.

## Implementation targets

- Add `BlockRebalanceKeeper` service and/or contract-facing keeper loop.
- Add `syncSymbol(symbol)` to StockAMM, StockPerpEngine, GoodLend stock adapter, GoodYield stock vault adapter, and prediction settlement/risk adapter.
- Add `lastSyncedBlock(symbol)` assertions and tests.
- Add every-block proof pack: two consecutive block receipts showing oracle update, product syncs, and equal reference price across products.
- Add dashboard row per symbol: eToro price, oracle block, AMM bid/ask, perp index/mark/funding, lend APY, yield APY, prediction reference price, drift bps.

## Interaction flow: any app action

When a user or AI agent touches any app, the app must follow the same pre-trade pipeline:

1. Identify the symbol(s) affected by the action, e.g. `AAPL`, `TSLA`, `SPY`.
2. Read `StockOracleV2.latest(symbol)` and current block.
3. If the product's `lastSyncedBlock(symbol)` is below current block, call `syncSymbol(symbol)` before executing.
4. Recompute the product-local quote from the canonical oracle block:
   - AMM bid/ask,
   - perp index/mark/funding,
   - prediction reference/settlement price,
   - lend collateral and borrow/supply rates,
   - yield vault NAV and carry accrual.
5. Route the proposed action through `UnifiedRiskEngine`.
6. Execute only if price freshness, margin, collateral, exposure, and kill-switch checks pass.
7. After execution, update net exposure by symbol.
8. If exposure crosses hedge thresholds, `HedgeEngine` creates a hedge instruction for the eToro account and reconciliation verifies GoodChain exposure vs eToro position.

## AMM-per-asset decision

Yes: every tokenized stock should have its own market/pool, e.g. `gAAPL/gUSD`, `gTSLA/gUSD`, `gSPY/gUSD`, deployed by a factory/registry.

But no: every pool must not have independent price discovery as source of truth. The source of truth is shared `StockOracleV2`; each asset AMM is an oracle-anchored execution venue with asset-specific spread, inventory skew, liquidity caps, market-hours behavior, and halt controls.

This gives per-asset liquidity/risk isolation without fragmenting the canonical price.

## Diagram

See `price-rebalance-diagram.png` in this directory.
