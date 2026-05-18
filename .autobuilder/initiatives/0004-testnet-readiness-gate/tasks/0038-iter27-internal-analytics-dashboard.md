---
id: testnet-iter27-internal-analytics-dashboard
title: "Iter 27 — Internal analytics dashboard: tx counts, protocol activity, UBI fees, service status, indexer freshness"
parent: gooddollar-l2
deps: [testnet-iter26-analytics-address-book]
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [analytics, dashboard, ubi, indexer, status, frontend, testnet-readiness, iter27]
---

# Iter 27 — Internal analytics dashboard

## Problem statement

Row 27 of [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../../../../docs/TESTNET-READINESS-50-ITERATIONS.md)
requires:

> **Internal analytics dashboard** — Public/interim page shows tx counts,
> protocol activity, UBI fees, status.
> **Proof:** Screenshot + API check.

Today an operator (or a public testnet visitor) has to cross-reference
**four** different surfaces to answer the question _"is the chain alive
and is anything actually happening?"_:

1. `https://goodswap.goodclaw.org/api/status` — service health JSON.
2. `http://<indexer>:4200/api/overview` — total events + per-protocol +
   top events (currently shows 34 events, mostly `Transfer`/`Approval`).
3. `op-stack/addresses.json` + `analytics/address-book.json` — protocol
   labels, contract counts, 14 UBI fee routes, 5 pending specialised
   splitters.
4. JSON-RPC `eth_blockNumber` — current chain tip, used to compute the
   indexer freshness lag.

No single page on `goodswap.goodclaw.org` joins those four sources, so
nobody can answer at a glance:

- Are all 12 services healthy?
- How many transactions/events has the chain seen, split by protocol?
- Which events are most active right now?
- Is the indexer caught up with the chain (lag in blocks)?
- How are UBI fees flowing? (14 routes, 5 still pending splitter deploy.)
- Where do I get the next layer of detail (status page, indexer events
  API, fee accounting doc)?

This iteration fills that gap by adding **one read-only page** at
`/analytics`, backed by **one new Next.js API route** that does the
join in-process so we don't expose the indexer/status backends to the
public internet.

This task is the **iter 27 row** of the 50-iteration plan. It depends on
the address book artifact produced by iter 26 (and only that). It does
**not** touch contracts, does **not** deploy anything, does **not**
change PM2 topology, and does **not** ship a new backend service.

## Scope (in / out)

**In scope — produced by this task:**

1. **`/analytics` page** (`frontend/src/app/(app)/analytics/page.tsx`,
   client component) with four panels:
   - **Service health** — overall (`healthy` / `degraded` / `down`),
     `<healthy>/<total>` count, aggregator uptime in seconds, last
     refresh timestamp, link to `/api/status` for the raw JSON.
   - **Chain & indexer activity** — current chain tip (block #), last
     indexed block, indexer lag in blocks, total events indexed,
     per-protocol event counts (joined with labels from
     `analytics/address-book.json`), and a top-5 event-name table.
   - **UBI fee landscape** — total fee routes (`14`), how many resolve
     to a deployed source today, how many are pending splitter deploy
     (the 5 `notes.specialised_splitters_pending` entries from
     `address-book.json`), and a link to
     `docs/UBI-FEE-ACCOUNTING.md` for the full table.
   - **Protocols** — for each of the 9 protocols (swap, perps, predict,
     lend, stable, stocks, ubi_core, infrastructure, deprecated):
     `label`, contract count, first 3 contract names. Source of truth
     is `analytics/address-book.json`.
   - A small footer with the data-source links (status page, indexer
     overview shape, address-book artifact, fee accounting doc) and the
     command that regenerates the address book.

2. **`/api/analytics/overview` route**
   (`frontend/src/app/api/analytics/overview/route.ts`,
   `runtime = 'nodejs'`) that:
   - Reads `analytics/address-book.json` from disk (in repo at
     build time — already committed by iter 26).
   - Fetches `/api/status` (same origin) for service health.
   - Fetches `INDEXER_API_URL/api/overview` (default
     `http://127.0.0.1:4200`) with a 4 s timeout. If the indexer is
     offline the route still returns 200 with `indexer: { ok: false,
     error: '…' }` so the dashboard never crashes.
   - Fetches `eth_blockNumber` via the existing `/api/rpc` proxy
     (so we reuse its rate limiting and timeouts) with a 4 s timeout.
     Same fallback rule on error.
   - Computes derived fields: `indexer.lagBlocks`, `ubi.pendingCount`,
     `protocols[].count`, `summary.totalContracts`,
     `summary.totalProtocols`, and `summary.generatedAt`.
   - Sends `Cache-Control: s-maxage=10, stale-while-revalidate=30` so
     the page is cheap to refresh and the upstreams are not hammered.
   - Wraps the handler in `withApiRateLimit(…)` matching the existing
     `/api/rpc` pattern so the route can't be DoS'd.

3. **Smoke E2E** (`frontend/tests/e2e/analytics.spec.ts`,
   `@smoke` grep tag) that visits `/analytics` against the prod build
   (Playwright config already targets `https://goodswap.goodclaw.org`
   for `@smoke` runs) and asserts:
   - HTTP 200, no runtime overlay (`react-error-overlay`).
   - The four panel headings exist (`Service Health`,
     `Chain & Indexer Activity`, `UBI Fee Landscape`, `Protocols`).
   - The page links to `/api/status` and `/api/analytics/overview`.
   - `GET /api/analytics/overview` returns `200` with
     `{ ok: true, status: …, indexer: …, chain: …, ubi: …,
     protocols: […], summary: … }`.

4. **Proof doc** (`docs/testnet/iter27-analytics-dashboard.md`)
   recording: route paths, the captured `curl` output of
   `/api/analytics/overview`, the Playwright smoke output, the
   screenshot path, and the iter-27 row check from the 50-iteration
   plan.

5. **One screenshot** at `docs/testnet/iter27-analytics-dashboard.png`
   (or `.webp`), captured via `agent-browser screenshot
   https://goodswap.goodclaw.org/analytics`, showing all four panels
   populated with live data.

**Out of scope — deferred to later iterations:**

- Dune SQL pack / third-party indexer onboarding (**iter 28**).
- Feedback button / capture pipeline (**iter 29**).
- README/doc index update tying iter 26 + 27 + 28 + 29 together
  (**iter 30**, the checkpoint).
- Historical time-series charts (would need a new time-series DB; the
  indexer's SQLite only stores raw events). The dashboard shows
  point-in-time snapshots only.
- Per-address drill-downs (would require a deep events explorer; the
  existing `/explore` page already covers token-level browsing).
- Exposing the indexer's `:4200` API to the public internet (we keep
  it server-side via the Next.js route).
- Refactoring the indexer to add new event types or protocols (the
  dashboard renders what the indexer currently emits, and surfaces
  the 34-event truth so iter 28/29 can fix the upstream gap
  honestly — Non-Negotiable #8).

## Acceptance criteria

1. **Page reachable** — `https://goodswap.goodclaw.org/analytics`
   returns `HTTP 200` with no runtime overlay, on production build.
2. **Four panels present** — every panel listed under Scope #1
   renders with live data from `/api/analytics/overview`. Skeleton
   states show while loading; error states show if a sub-source fails
   (the page never blank-fails when the indexer or RPC is down —
   Non-Negotiable #8).
3. **API route healthy** — `curl
   https://goodswap.goodclaw.org/api/analytics/overview` returns
   `200` with the documented JSON shape; each sub-source has an
   explicit `ok: bool` plus error message on failure (no silent
   nulls).
4. **No new hardcoded addresses** — the dashboard and its API route
   only consume `analytics/address-book.json`, `/api/status`,
   `/api/rpc`, and `INDEXER_API_URL`. No address strings appear in
   the new code (Non-Negotiable #7).
5. **Indexer freshness surfaced** — `indexer.lagBlocks` is computed
   as `chain.blockNumber - indexer.lastBlock`. If lag is ≥ 1000 the
   UI shows an amber `Stale` badge; ≥ 10000 shows red `Far behind`.
   This is the iter-26→iter-27 freshness contract.
6. **Smoke E2E** — `npx playwright test
   tests/e2e/analytics.spec.ts --project=chromium` passes against the
   prod build.
7. **react-doctor** — `npx -y react-doctor@latest frontend
   --verbose --diff` returns score ≥ 75 with no new errors introduced
   by this task (per build-loop CRITICAL RULES).
8. **Proof recorded** — `docs/testnet/iter27-analytics-dashboard.md`
   contains: `curl` output, Playwright PASS line, screenshot path,
   and the iter-27 row check.
9. **No on-chain calls beyond the existing `/api/rpc` proxy**, no
   `forge build`, no new long-running agent, no PM2 changes
   (Non-Negotiable #9 — cost control).
10. **No locked file modified** — no task file with `executed: true`
    is touched; no file under
    `analytics/` (frozen by iter 26) is mutated except read access.

## Proof to record (per Non-Negotiable #3)

In `docs/testnet/iter27-analytics-dashboard.md`:

- `curl -s https://goodswap.goodclaw.org/api/analytics/overview | jq '
    {ok, summary, status: .status.overall, indexer: .indexer.ok,
     chain: .chain.blockNumber, ubi_routes: (.ubi.routes | length),
     ubi_pending: .ubi.pendingCount,
     protocols: (.protocols | length)}'` output.
- `curl -s -o /dev/null -w "%{http_code}\n"
    https://goodswap.goodclaw.org/analytics` returning `200`.
- Playwright smoke output (last 10 lines, showing PASS).
- Screenshot path + size (`docs/testnet/iter27-analytics-dashboard.png`,
  ≤ 600 KB after compression).
- The iter-27 row of the 50-iteration plan reproduced for the gate's
  benefit.

## Notes

- **Why a new Next.js API route instead of calling the indexer
  directly from the client?** The indexer's `:4200` API is bound to
  `127.0.0.1` for security and the address-book file lives in the
  Next.js process's filesystem. Doing the join server-side is the
  only way to surface the data without either exposing internal
  ports or bundling the address book into a 165 KB client payload
  (it's a server-only resource).
- **Why client component for the page?** Matches the existing
  `/test-dashboard` page (`'use client'` + `useEffect` polling) so
  the navbar/footer wrappers and dark-theme styling stay consistent
  with the rest of the (app) shell. SSR is not required because the
  data is fully dynamic and refreshes every 30 s.
- **No new dependencies.** Reuse `Tabs`/`Link`/`StatCard` patterns
  from `frontend/src/app/(app)/test-dashboard/page.tsx`. Tailwind
  classes already cover the layout.
- **Why this counts as "polish" mode work.** The page itself is
  net-new but it's a 100% read-only join of already-public data
  surfaces; it's the canonical iter-27 deliverable and unblocks
  iter 28 (Dune pack reuses the same per-protocol counts) and iter 29
  (feedback pipeline needs a stable place to embed the feedback
  widget). No contracts, no new services, no schema changes.

---

## Planning (filled by plan-task)

### Research summary

Six pre-flight checks already done during the surface sweep:

1. **Indexer `/api/overview` shape (live, `127.0.0.1:4200`).**
   ```json
   { "ok": true,
     "data": {
       "lastBlock": 808967,
       "totalEvents": 34,
       "protocols": [
         { "protocol":"core",
           "total_events":34,
           "last_event_block":47350,
           "last_updated":1775421970112 }
       ],
       "topEvents": [ { "event_name":"Transfer", "cnt":31 } ] } }
   ```
   Action: pass `data.lastBlock`, `data.totalEvents`,
   `data.protocols`, `data.topEvents` straight through into
   `indexer: { ok, lastBlock, totalEvents, protocols, topEvents }`.
   The single `"core"` row today is a known iter-26 gap and is
   surfaced honestly (not hidden) — Non-Negotiable #8.

2. **Chain tip via the existing `/api/rpc` proxy.**
   `curl -s -X POST localhost:8545 -H 'Content-Type: application/json'
   -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'` →
   `{"result":"0x2ff4d"}` = block `196429`. Status aggregator
   independently reports `chainBlock: 196427`, confirming the value.

3. **`indexer.lastBlock` (808 967) > `chain.blockNumber` (196 429)
   today.** This is a real operational defect from a chain reset and
   the dashboard must surface it (not hide it). The lag formula:
   ```ts
   const lagBlocks = chain.ok && indexer.ok
     ? chain.blockNumber - indexer.lastBlock
     : null
   const lagStatus =
     !chain.ok || !indexer.ok ? 'unknown'
     : lagBlocks < 0            ? 'db_ahead_of_chain'  // ← today
     : lagBlocks < 1_000        ? 'fresh'
     : lagBlocks < 10_000       ? 'stale'
     : 'far_behind'
   ```
   The UI shows badges: `Fresh` (green), `Stale` (amber),
   `Far behind` (red), `DB ahead of chain — reset` (red) for the
   negative-lag case.

4. **Status aggregator (`/api/status` proxy).** Already implemented at
   `frontend/src/app/api/status/route.ts`, wrapped in
   `withApiRateLimit`, 5 s timeout, returns
   `{ overall, healthy, total, services, aggregatorUptime, … }`.
   Last live response: `overall: "healthy"`, `12/12`.

5. **Address book artifact (`analytics/address-book.json`).** Shape
   verified with `jq`: 9 protocols as a **map** (`swap`, `perps`,
   `predict`, `lend`, `stable`, `stocks`, `ubi_core`,
   `infrastructure`, `deprecated`), each with `label` and `contracts[]
   { address, name }`. `fee_routes` is a 14-element **array** of
   `{ id, protocol, label, kind, source_contract, sink_contract,
   sink_method, source_address_pending_deploy, event_signature, …}`.
   `notes.specialised_splitters_pending` lists the 5 splitters not
   yet deployed.

6. **`withApiRateLimit` + `runtime = 'nodejs'`** is the canonical
   shape for new Next.js API routes (see
   `frontend/src/app/api/{rpc,status}/route.ts`). No new deps.

### Architecture

```
┌────────── browser (https://goodswap.goodclaw.org/analytics) ─────────┐
│   page.tsx (client component, polls every 30 s)                       │
│     ┌─ fetch('/api/analytics/overview')                               │
│     ├─ <ServiceHealthPanel/>     ◀── status                           │
│     ├─ <ChainActivityPanel/>     ◀── indexer + chain                  │
│     ├─ <UbiFeePanel/>            ◀── ubi (from address book)          │
│     └─ <ProtocolsPanel/>         ◀── protocols (from address book)    │
└────────────────────────────────────┬──────────────────────────────────┘
                                     │  GET, rate-limited (60 rpm)
                                     ▼
        frontend/src/app/api/analytics/overview/route.ts  (Node runtime)
                ┌────────────┬─────────────────┬──────────┐
                │            │                 │          │
                ▼            ▼                 ▼          ▼
        analytics/      /api/status        /api/rpc    INDEXER_API_URL
        address-book    (aggregator        (chain        (indexer
        .json (fs)      :9200)             eth_block#)   :4200
        — synchronous   — 5 s timeout      — 4 s         /api/overview)
                                                         — 4 s timeout

        Failure mode for every sub-source: route still returns 200 with
        { ok: false, error: "…" } for that source only; never blank-fails.
```

### One-week (one-iteration) decision

Single iteration — **no split**. The deliverable is:

- 1 page (`frontend/src/app/(app)/analytics/page.tsx`, ~220 LOC).
- 1 API route (`frontend/src/app/api/analytics/overview/route.ts`,
  ~140 LOC).
- 1 Playwright smoke spec (`frontend/tests/e2e/analytics.spec.ts`,
  ~50 LOC).
- 1 proof doc (`docs/testnet/iter27-analytics-dashboard.md`).
- 1 screenshot (`docs/testnet/iter27-analytics-dashboard.png`).

Why no split:

- No backend, contract, schema, or PM2 change.
- All four data sources are already live & verified.
- Single PR review; no migration; no rollback complexity.
- Reuses existing patterns (`runtime = 'nodejs'`,
  `withApiRateLimit`, `StatCard`, `Tabs`).

### Execution steps (TDD-ish, in this order)

1. **Write Playwright smoke first** — `analytics.spec.ts` asserting
   the route returns 200, the four panel headings exist, and
   `/api/analytics/overview` returns the union shape. Run it; expect
   failure (404 on `/analytics`).
2. **Implement the API route** — `route.ts` joining the four sources
   with the failure-isolation contract. Curl it locally to verify the
   shape against the test's expectation.
3. **Implement the page** — wire the four panels to
   `/api/analytics/overview`; reuse `StatCard`; show skeleton on first
   load; show per-panel error states (not a global error) when a
   sub-source returns `ok: false`. Implement the freshness-badge
   logic exactly as specified in research item 3.
4. **Re-run smoke; expect pass.**
5. **Lint:** `npm run lint` in `frontend/` (zero warnings is the
   current baseline, must not regress).
6. **Build:** `npm run build` in `frontend/` (must succeed; the page
   is a client component so no SSR/data-fetching surprises).
7. **react-doctor:** `npx -y react-doctor@latest frontend
   --verbose --diff` ≥ 75.
8. **Capture proof** — three commands, one screenshot:
   - `curl -s https://goodswap.goodclaw.org/api/analytics/overview
     | jq '…'` → paste output into the proof doc.
   - `curl -s -o /dev/null -w "%{http_code}\n"
     https://goodswap.goodclaw.org/analytics` → must be `200`.
   - `agent-browser screenshot
     https://goodswap.goodclaw.org/analytics --out
     docs/testnet/iter27-analytics-dashboard.png`.
9. **Commit** — single conventional commit:
   `feat(testnet): iter 27 — internal analytics dashboard
   (status + indexer + UBI + protocols)`.

### Risks & mitigations

| Risk                                                         | Likelihood | Mitigation                                                                                          |
|--------------------------------------------------------------|-----------:|-----------------------------------------------------------------------------------------------------|
| Indexer at `:4200` unreachable from prod (different host).   | M          | Honor `INDEXER_API_URL` env; default `http://127.0.0.1:4200`. Panel degrades gracefully on timeout. |
| Static import of `analytics/address-book.json` bloats bundle.| M          | Read it server-side **only**, never `import` it from the page; ship a slim derived payload (~5 KB). |
| Rate-limit 429 from `/api/status` re-fetched every 30 s.     | L          | Default 60 rpm/IP is fine; document polling cadence.                                                |
| Chain reset → `indexer.lastBlock > chain` (today's reality). | H (today)  | `lagStatus = 'db_ahead_of_chain'` badge; doc note linking to iter-26 / future iter-28 follow-up.    |
| Playwright smoke flakes on cold prod build.                  | L          | Use `waitForResponse('/api/analytics/overview')` instead of arbitrary `waitForTimeout`.             |

### Files touched (final)

- **NEW** `frontend/src/app/(app)/analytics/page.tsx`
- **NEW** `frontend/src/app/api/analytics/overview/route.ts`
- **NEW** `frontend/tests/e2e/analytics.spec.ts`
- **NEW** `docs/testnet/iter27-analytics-dashboard.md`
- **NEW** `docs/testnet/iter27-analytics-dashboard.png`

No file with `executed: true` is modified. No `analytics/*` file
(frozen by iter 26) is mutated.

