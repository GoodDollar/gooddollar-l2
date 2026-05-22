# Explore — Token & Market Discovery

## Routes

| Route | Purpose |
|-------|---------|
| `/explore` | Token explorer listing |
| `/explore/[symbol]` | Individual token detail |

**Live:** https://goodswap.goodclaw.org/explore

## Purpose

Discovery surface for tokens and markets on GoodDollar L2. Helps testers find assets before swapping or supplying liquidity.

## On-chain contracts

Reads token metadata and prices from devnet contracts via `frontend/src/lib/devnet.ts` (router, oracles, mock tokens from `op-stack/addresses.json`).

## Backend services

Indirect — price/status data may come from `swap-oracle`, `indexer`, and `/api/prices`.

## Frontend source

- `frontend/src/app/(app)/explore/page.tsx`
- `frontend/src/app/(app)/explore/[symbol]/page.tsx`

## Tests & evidence

- E2E registry: `explore` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)
- Lane script: `./scripts/run-dapp-lane.sh explore`

## UBI fee routing

Explore is read-only discovery; fees accrue when users trade on linked protocols.

## Status (2026-05-22)

Registered E2E route; public HTTP **200** at last sweep.
