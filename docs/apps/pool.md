# Pool — Liquidity Pools

## Routes

| Route | Purpose |
|-------|---------|
| `/pool` | Liquidity pool UX |

**Live:** https://goodswap.goodclaw.org/pool

## Purpose

Liquidity provision interface for GoodSwap pools. Supports tester flows for adding/removing liquidity on devnet.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `GoodSwapRouter` | `src/swap/GoodSwapRouter.sol` |
| Pool LP tokens | Referenced in `frontend/src/lib/devnet.ts` (`SwapGD`, `SwapWETH`, `SwapUSDC`, pool pair addresses) |

Some pool addresses in `devnet.ts` are tagged `STALE` when not yet in `addresses.json` — verify on-chain before release claims.

## Backend services

`swap-oracle`, `indexer` (indirect).

## Frontend source

- `frontend/src/app/(app)/pool/page.tsx`

## Tests & evidence

- E2E registry: `pool` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)

## UBI fee routing

Swap/pool activity fees follow GoodSwap UBI paths in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

Public HTTP **200**. Pool depth and production liquidity: **unknown without live on-chain probe** — verify against devnet contracts before demo claims.
