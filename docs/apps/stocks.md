# GoodStocks — Synthetic Equities

## Routes

| Route | Purpose |
|-------|---------|
| `/stocks` | Markets hub (redirects/screener entry) |
| `/stocks/markets` | Market list |
| `/stocks/[ticker]` | Ticker detail & trade form |
| `/stocks/portfolio` | Holdings & collateral health |
| `/stocks/watchlist` | Saved tickers |

**Live:** https://goodswap.goodclaw.org/stocks

## Purpose

Synthetic stock assets backed by oracles and collateral vaults. 24/7 equity trading on GoodDollar L2 with UBI fee routing.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `SyntheticAssetFactory` | `src/stocks/SyntheticAssetFactory.sol` |
| `SyntheticAsset` | `src/stocks/SyntheticAsset.sol` |
| `CollateralVault` | `src/stocks/CollateralVault.sol` |
| `StockAMM` | `src/stocks/StockAMM.sol` |
| `PriceOracle` / `StockOracleV2` | `src/stocks/PriceOracle.sol`, `src/oracle/StockOracleV2.sol` |
| `StocksUBIFeeSplitter` | `src/stocks/StocksUBIFeeSplitter.sol` |

## Backend services

| Service | Role |
|---------|------|
| `stocks-keeper` | Oracle/price upkeep (`backend/stocks-keeper/`) |
| `oracle-signer` | Signs oracle updates when `ORACLE_SIGNER_KEY` provisioned — otherwise health-only mode |
| `hedge-engine` | Risk hedging when `RISK_ENGINE_ADDRESS` set — otherwise health-only |
| `price-service` | Quote feed (referenced by oracle-signer) |

`/api/status` and stocks UI fall back to `stocks-keeper` health when external quote service is unavailable.

## Frontend source

- `frontend/src/app/(app)/stocks/` (pages, portfolio diagnostics, screener state)
- Oracle / price-service status: `frontend/src/app/api/status/quotes/route.ts` (consumed by `usePriceServiceStatus`)
- Rebalance: `frontend/src/app/api/stocks/rebalance-status/route.ts`

## Tests & evidence

- E2E registry: `stocks`, `stocks-detail`, `stocks-portfolio`
- Foundry: `test/stocks/`, UBI proof routes 13–14
- Lane script: `./scripts/run-dapp-lane.sh stocks`
- Bundle budgets: `npm run check:stocks-bundles` in `frontend/`

## UBI fee routing

Trading + liquidation remnant — routes 13–14 in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

- Public HTTP **200** for stocks routes.
- `stocks-keeper` healthy in status snapshots; `oracle-signer` / `hedge-engine` may show **unreachable** when keys/addresses not provisioned (expected health-only mode per `backend/ecosystem.config.js`).
- Extensive UX hardening landed 2026-05-20–21 (oracle fallback, malformed ticker guards) — see root README milestone notes.
