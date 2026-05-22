# Analytics — Protocol KPI Dashboard

## Routes

| Route | Purpose |
|-------|---------|
| `/analytics` | Public protocol KPIs |

**API:** `GET /api/analytics/overview`

**Live:** https://goodswap.goodclaw.org/analytics

## Purpose

Tester-facing dashboard: chain block, G$ supply, UBI revenue, protocol activity counters. Backed by on-chain reads via the analytics address book.

## Data sources

| Artifact | Role |
|----------|------|
| [`analytics/address-book.json`](../../analytics/address-book.json) | Canonical contract index (iter 26) |
| [`analytics/README.md`](../../analytics/README.md) | Regeneration & verify commands |
| [`analytics/dune-package/`](../../analytics/dune-package/README.md) | External indexer kit (iter 28) |

Regenerate address book:

```bash
python3 scripts/build-analytics-address-book.py --output analytics/address-book.json
```

## Frontend source

- `frontend/src/app/(app)/analytics/page.tsx`
- `frontend/src/app/api/analytics/overview/route.ts`

## Tests & evidence

- E2E: `frontend/e2e/analytics.spec.ts` — **passing** in RC coordinator slice (62/62 with app-regression)
- E2E registry: `analytics`

## UBI fee routing

Displays UBI revenue tracker balance — see [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

Restored to public app by iter 30 stale-build redeploy. External Dune indexing: **pending** (package published, indexing not verified here).
