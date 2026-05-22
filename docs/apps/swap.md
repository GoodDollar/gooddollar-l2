# GoodSwap — Token Swap & Landing

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page + primary swap widget |

**Live:** https://goodswap.goodclaw.org/

## Purpose

GoodSwap is the DEX entry point for GoodDollar L2. Users swap tokens on-chain; protocol fees route into UBI accounting via `UBIFeeSplitter` and related hooks.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `GoodSwapRouter` | `src/swap/GoodSwapRouter.sol` |
| `GoodSwap` (legacy) | `src/GoodSwap.sol` |
| `UBIFeeHook` | `src/hooks/UBIFeeHook.sol` |
| `SwapPriceOracle` | `src/oracle/SwapPriceOracle.sol` |
| `LiFiBridgeAggregator` | `src/swap/LiFiBridgeAggregator.sol` |

Canonical deployed addresses: [`op-stack/addresses.json`](../../op-stack/addresses.json). Frontend reads via [`frontend/src/lib/devnet.ts`](../../frontend/src/lib/devnet.ts).

## Backend services

| Service | Role |
|---------|------|
| `swap-oracle` | On-chain swap price updates (`backend/swap-oracle/`) |
| `revenue-tracker` | UBI revenue aggregation |

Health surfaced via `/api/status` → `status-aggregator`.

## Frontend source

- Page: `frontend/src/app/page.tsx`
- Swap components: under `frontend/src/components/` (swap widget, token selector)

## Tests & evidence

- E2E registry: `swap` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)
- Foundry: `test/swap/`, `test/integration/UBIFeeIntegrationProofSwapPerps.t.sol` (routes 1–5)
- Lane script: `./scripts/run-dapp-lane.sh swap`

## UBI fee routing

See [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md) — Swap V4 hook + Li.Fi bridge paths (routes 1–2).

## Status (2026-05-22)

- Public HTTP route sweep: **200** (see root README verified status).
- RC merge on `main` includes coordinator E2E harness fixes; full 830-test suite was **not** green at last full run — treat live HTTP sweep as stronger signal until full E2E completes.
