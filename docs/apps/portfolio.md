# Portfolio — Wallet Overview & Claim

## Routes

| Route | Purpose |
|-------|---------|
| `/portfolio` | Cross-protocol balances, positions, claim-oriented UX |

**Live:** https://goodswap.goodclaw.org/portfolio

## Purpose

Unified wallet dashboard showing assets and protocol positions across GoodDollar L2, including UBI claim context.

## On-chain contracts

Reads across protocols via `frontend/src/lib/devnet.ts`:

- `GoodDollarToken`, `UBIClaimV2`
- Perps, Predict, Lend, Stable, Stocks contract sets

## Backend services

`indexer`, `activity-reporter`, `revenue-tracker` (indirect data sources).

## Frontend source

- `frontend/src/app/(app)/portfolio/page.tsx`

## Tests & evidence

- E2E: `frontend/e2e/portfolio-journey.spec.ts` (iter 21)
- E2E registry: `portfolio`
- Lane script: `./scripts/run-dapp-lane.sh portfolio-claim`

## UBI fee routing

Display-only; claim path uses `UBIClaimV2` — not a fee source.

## Status (2026-05-22)

Public HTTP **200**; portfolio journey E2E hardened iter 21.
