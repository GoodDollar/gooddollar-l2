# GoodPerps — Perpetual Futures

## Routes

| Route | Purpose |
|-------|---------|
| `/perps` | Trading terminal |
| `/perps/leaderboard` | Trader rankings |
| `/perps/portfolio` | Open positions & history |

**Live:** https://goodswap.goodclaw.org/perps

## Purpose

Perpetual futures UX backed by on-chain `PerpEngine`, margin vault, funding, and liquidation logic, plus an off-chain order-book service.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `PerpEngine` | `src/perps/PerpEngine.sol` |
| `MarginVault` | `src/perps/MarginVault.sol` |
| `FundingRate` | `src/perps/FundingRate.sol` |
| `PerpPriceOracle` | `src/perps/PerpPriceOracle.sol` |
| `PerpUBIFeeSplitter` | `src/perps/PerpUBIFeeSplitter.sol` |
| `StockPerpEngine` | `src/perps/StockPerpEngine.sol` |

Perps contracts were redeployed 2026-05-22 per comment in [`op-stack/addresses.json`](../../op-stack/addresses.json).

## Backend services

| Service | Port (default) | Role |
|---------|----------------|------|
| `goodperps` / `perps` | `8082` | Order book + API (`backend/perps/`) |
| `liquidator` | `9103` | Liquidation automation |
| `swap-oracle` | — | Shared price infra |

PM2 name may be `goodperps` (root `pm2-ecosystem.config.js`) or `perps` (backend ecosystem).

## Frontend source

- `frontend/src/app/(app)/perps/page.tsx`
- `frontend/src/app/(app)/perps/leaderboard/page.tsx`
- `frontend/src/app/(app)/perps/portfolio/page.tsx`

## Tests & evidence

- E2E: `frontend/e2e/perps-journey.spec.ts` — **20/20 chromium** after RC perps follow-up ([`docs/release/RC_COORDINATOR_20260522.md`](../release/RC_COORDINATOR_20260522.md))
- E2E registry: `perps`, `perps-leaderboard`, `perps-portfolio`
- Foundry: `test/perps/`, UBI proof routes 3–5
- Lane script: `./scripts/run-dapp-lane.sh perps`

## UBI fee routing

Trading, funding, and liquidation fees — routes 3–5 in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

- RC coordinator: perps journey spec green after `cb225e16` fix.
- Prior full-suite E2E (`npm run test:e2e:all`): incomplete — do not treat as release gate until rerun completes.
