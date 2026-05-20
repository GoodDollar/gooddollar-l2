---
id: gooddollar-l2-restore-useMounted-on-stocks-detail
title: "CRITICAL — Restore useMounted gating on /stocks/[ticker] (next/dynamic ssr:false regression breaks prod build)"
type: fix
priority: P0
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
---

# CRITICAL — Restore useMounted gating on /stocks/[ticker] (next/dynamic ssr:false regression breaks prod build)

## Problem Statement

`frontend/src/__tests__/dynamic-routes-no-ssr-false.test.ts` (a regression guard for task 0090) is **failing** in the current worktree. The test asserts that the three dynamic App Router segments below MUST NOT import `dynamic` from `next/dynamic` and MUST NOT use `ssr: false`:

- `src/app/(app)/predict/[marketId]/page.tsx` ✅ passes (uses `useMounted()`)
- `src/app/(app)/explore/[symbol]/page.tsx` ✅ passes (uses `useMounted()`)
- `src/app/(app)/stocks/[ticker]/page.tsx` ❌ **FAILS** — has been reverted

The fix from task 0090 (commit `07f64aa` — "fix HTTP 500 on dynamic detail pages caused by next/dynamic({ssr:false}) manifest corruption") was undone by a later commit `05bef5d` ("0052: split stocks detail chart/oracle bundles"), which re-introduced this pattern in `stocks/[ticker]/page.tsx`:

```ts
// Lines 5, 26-34 of src/app/(app)/stocks/[ticker]/page.tsx — CURRENTLY BROKEN
import dynamic from 'next/dynamic'

const PriceChart = dynamic(
  () => import('@/components/PriceChart').then((m) => ({ default: m.PriceChart })),
  { ssr: false }
)

const OracleStatusBadge = dynamic(
  () => import('@/components/OracleStatusBadge').then((m) => ({ default: m.OracleStatusBadge })),
  { ssr: false }
)
```

This pattern inside a dynamic route segment (`[ticker]`) corrupts the Next.js client-reference manifest in `next build`, producing **HTTP 500 with `TypeError: Cannot read properties of undefined (reading 'call')`** at runtime when navigating to any `/stocks/<ticker>` page.

The fix is exactly what tasks 0090 already established: keep static imports and gate the client-only render behind `useMounted()` — `useMounted` is already imported on line 20 of the same file but is no longer doing the work the chart/oracle components need.

## Research Notes

### Test failure (from `npx vitest run`, frontend dir)

```
FAIL  src/__tests__/dynamic-routes-no-ssr-false.test.ts > dynamic route segments do not use next/dynamic({ ssr: false }) > src/app/(app)/stocks/[ticker]/page.tsx does not import or call next/dynamic
AssertionError: src/app/(app)/stocks/[ticker]/page.tsx must not `import dynamic from 'next/dynamic'` — see task 0090
+ expected - actual
- "...
- import dynamic from 'next/dynamic'
- ..."
```

Tests: **1 failed | 1302 passed (1303)**

### Reference implementations already in repo

`/predict/[marketId]/page.tsx` (correct pattern):

```ts
import { PriceChart } from '@/components/PriceChart'
import { useMounted } from '@/lib/useMounted'
// ...
const chartMounted = useMounted()
// ...
{chartMounted ? <PriceChart ... /> : <ChartSkeleton />}
```

`/explore/[symbol]/page.tsx` (correct pattern): same — static import + `useMounted()` gate.

`stocks/[ticker]/page.tsx` already imports `useMounted` on line 20 — it just isn't used to gate `PriceChart` / `OracleStatusBadge` anymore.

### Git history

- `07f64aa` — "0090: fix HTTP 500 on dynamic detail pages caused by next/dynamic({ssr:false}) manifest corruption" — original fix across all three pages, introduced `frontend/src/lib/useMounted.ts` (9 LOC).
- `05bef5d` — "0052: split stocks detail chart/oracle bundles" — **reverted** the fix for `stocks/[ticker]` only, in pursuit of a bundle-size win. Lane B note: bundle splitting is on-charter for this lane, but it must not regress the test guard. `next/dynamic` without `ssr:false` (or `loading: ...`) is acceptable; `ssr:false` on a dynamic route segment is not.

### Bundle-split context (preserve the original intent of 0052)

The original goal of `0052` was to keep the initial JS for `/stocks/[ticker]` small. We can preserve that goal by:

1. Using a static import + `useMounted()` gate (matches sibling pages), OR
2. Using `next/dynamic(...)` **without** `ssr: false`, which still code-splits the chunk but leaves SSR enabled (no manifest corruption).

The simpler and lower-risk path is (1) — it is what the other two dynamic segments already do and what the test guard explicitly endorses.

## Architecture Diagram

```mermaid
graph TD
    subgraph Current_BROKEN
        TS[stocks/[ticker]/page.tsx]
        TS -->|"import dynamic from 'next/dynamic'"| ND[next/dynamic]
        ND -->|"{ ssr: false }"| MF[Client Ref Manifest]
        MF -->|"prod build corruption"| HTTP500[HTTP 500 TypeError on /stocks/AAPL]
        VT[Vitest guard test] -->|"asserts no next/dynamic"| FAIL[1 failed test]
    end

    subgraph After_Fix
        TS2[stocks/[ticker]/page.tsx]
        TS2 -->|"static import"| PC[PriceChart]
        TS2 -->|"static import"| OB[OracleStatusBadge]
        TS2 -->|"useMounted gate"| RENDER[Render only after client mount]
        VT2[Vitest guard test] -->|"passes"| GREEN[1303/1303]
        BUILD[next build] -->|"clean manifest"| OK[/stocks/AAPL serves 200]
    end
```

## One-Week Decision

**YES — well under one week.** The change is a 3-file-section edit in a single file (no new module needed; `useMounted` already exists and is already imported on line 20). Estimated effort: <30 minutes plus react-doctor + test run.

## Implementation Plan

### Phase 1 — Restore useMounted gating in stocks/[ticker]/page.tsx

1. Remove line 5: `import dynamic from 'next/dynamic'`
2. Replace lines 26–34 with static imports:
   ```ts
   import { PriceChart } from '@/components/PriceChart'
   import { OracleStatusBadge } from '@/components/OracleStatusBadge'
   ```
   (Insert near the other `@/components/...` imports for consistency with sibling pages.)
3. Find the JSX render sites of `<PriceChart />` and `<OracleStatusBadge />` in the file and gate them behind the existing `useMounted()` pattern used in `/predict/[marketId]/page.tsx` and `/explore/[symbol]/page.tsx`:
   ```tsx
   const chartMounted = useMounted()
   // ...
   {chartMounted ? <PriceChart ... /> : <ChartSkeleton />}
   {chartMounted ? <OracleStatusBadge ... /> : null}
   ```
   Reuse whatever skeleton/fallback the previous pre-`0052` revision used; if none, render `null` (matches sibling-page behavior).

### Phase 2 — Verify guard test passes

```bash
cd frontend
npx vitest run src/__tests__/dynamic-routes-no-ssr-false.test.ts
```

Expect: `3 tests passed`.

### Phase 3 — Verify full unit suite still green

```bash
cd frontend
npx vitest run
```

Expect: 1303/1303 passed.

### Phase 4 — react-doctor

```bash
npx -y react-doctor@latest . --verbose --diff
```

Score must be ≥75 to commit; absolutely no commit if <50 (per build-loop rules).

### Phase 5 — Smoke-test /stocks/[ticker] in dev

With dev server on port 3122:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3122/stocks/AAPL
```

Expect: `200`.

## Acceptance Criteria

- [ ] `src/app/(app)/stocks/[ticker]/page.tsx` does not contain `import dynamic from 'next/dynamic'`
- [ ] `src/app/(app)/stocks/[ticker]/page.tsx` does not contain `dynamic(`
- [ ] `src/app/(app)/stocks/[ticker]/page.tsx` does not contain `ssr: false`
- [ ] `src/app/(app)/stocks/[ticker]/page.tsx` uses `useMounted()` to gate `<PriceChart />` and `<OracleStatusBadge />`
- [ ] `npx vitest run src/__tests__/dynamic-routes-no-ssr-false.test.ts` passes 3/3
- [ ] `npx vitest run` passes 1303/1303 (no new failures)
- [ ] `react-doctor` score ≥ 75
- [ ] `curl http://localhost:3122/stocks/AAPL` returns HTTP 200 with no React hydration error in console

## Verification

```bash
cd frontend
npx vitest run src/__tests__/dynamic-routes-no-ssr-false.test.ts
npx vitest run
cd ..
npx -y react-doctor@latest . --verbose --diff
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3122/stocks/AAPL
```

## Out of Scope

- Re-architecting bundle splitting on stocks detail (task 0052 — that goal can be re-attempted later via `next/dynamic` without `ssr:false`, or React.lazy, in a follow-up task).
- `predict/[marketId]/page.tsx` and `explore/[symbol]/page.tsx` (already correct in this worktree).
- The `[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid` console error (will be filed as a separate task — env/config issue, not in lane-b TypeScript guard scope).
- The React hydration mismatch on `/invite` (separate finding — filing as its own follow-up only if reproducible after this fix).

## Lane B Alignment

- **Performance / bundles / caching / route prefetch / test guards** — directly within lane scope: the failing assertion *is* a test guard, and the fix restores the canonical pattern used elsewhere in the codebase.
- **Frontend TypeScript only, no production Solidity** — fix touches only `frontend/src/app/(app)/stocks/[ticker]/page.tsx` (TypeScript/TSX). No Solidity, no backend.
- **Audited primitives, minimal diff** — re-applies a previously-shipped, lane-internal fix (task 0090) rather than introducing a new pattern.
