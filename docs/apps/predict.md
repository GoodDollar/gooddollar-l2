# GoodPredict — Prediction Markets

## Routes

| Route | Purpose |
|-------|---------|
| `/predict` | Market listing |
| `/predict/create` | Create market |
| `/predict/portfolio` | User positions |
| `/predict/[marketId]` | Market detail & trading |

**Live:** https://goodswap.goodclaw.org/predict

## Purpose

Binary and multi-outcome prediction markets using conditional tokens, on-chain factory/resolver, and a CLOB-style backend.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `ConditionalTokens` | `src/predict/ConditionalTokens.sol` |
| `MarketFactory` | `src/predict/MarketFactory.sol` |
| `OptimisticResolver` | `src/predict/OptimisticResolver.sol` |
| `PredictUBIFeeSplitter` | `src/predict/PredictUBIFeeSplitter.sol` |

Note: `OptimisticResolver` may be tagged STALE in `frontend/src/lib/devnet.ts` if not present in `addresses.json` — verify before demo.

## Backend services

| Service | Port (default) | Role |
|---------|----------------|------|
| `goodpredict` / `predict` | `3040` | CLOB + REST/WS API — see [`backend/predict/README.md`](../../backend/predict/README.md) |

## Frontend source

- `frontend/src/app/(app)/predict/page.tsx`
- `frontend/src/app/(app)/predict/create/page.tsx`
- `frontend/src/app/(app)/predict/portfolio/page.tsx`
- `frontend/src/app/(app)/predict/[marketId]/page.tsx`
- API proxy: `frontend/src/app/api/predict/comments/route.ts`

## Tests & evidence

- E2E: `frontend/e2e/predict-journey.spec.ts`
- E2E registry: `predict`, `predict-create`, `predict-portfolio`
- Foundry: `test/predict/`, UBI proof routes 6–7
- Lane script: `./scripts/run-dapp-lane.sh predict`

## UBI fee routing

Factory + resolver fees — routes 6–7 in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

Public HTTP **200**; `predict` service healthy in status snapshots. Market grid shows fallback markets when on-chain seeds are empty (iter 18 hardening).
