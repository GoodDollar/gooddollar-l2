# QA Surfaces — Tests, Dashboard & Invite

## Routes

| Route | Purpose |
|-------|---------|
| `/tests` | Public E2E test registry (Playwright coverage cards) |
| `/test-dashboard` | QA evidence dashboard |
| `/invite` | Alpha tester invitation template |

**Live:**

- https://goodswap.goodclaw.org/tests
- https://goodswap.goodclaw.org/test-dashboard
- https://goodswap.goodclaw.org/invite

## Purpose

Transparency layer for testnet readiness: shows which app routes have Playwright coverage, how to run tests locally, and invites external testers.

## Source of truth

| Artifact | Role |
|----------|------|
| [`frontend/src/lib/tests/e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json) | 29 registered app routes |
| [`docs/tests/e2eRegistry.json`](../tests/e2eRegistry.json) | Doc mirror (if synced) |
| `scripts/publish-tests-page.py` | Root `npm run tests:publish` |

## Running tests locally

```bash
cd frontend
npm run test:e2e          # app-regression registry (chromium)
npm run test:e2e:all      # full Playwright suite (E2E_PROD_SERVER=1)
```

## Frontend source

- `frontend/src/app/tests/page.tsx`
- `frontend/src/app/(app)/test-dashboard/page.tsx`
- `frontend/src/app/(app)/invite/page.tsx`

## Tests & evidence

- E2E registry includes self-referential `tests`, `test-dashboard`, `invite` entries
- RC coordinator: `app-regression.spec.ts` **62/62** (chromium + mobile-chrome) post-integration
- Full suite (`test:e2e:all`): **807 passed, 7 skipped, 0 failed** on 2026-05-22 after RC merge/deploy — see root README

## Status (2026-05-22)

All three routes returned HTTP **200** in public sweep. Do not claim full E2E green until `npm run test:e2e:all` completes with summary.
