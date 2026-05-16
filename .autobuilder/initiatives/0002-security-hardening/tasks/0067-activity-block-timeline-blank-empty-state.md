---
id: gooddollar-l2-activity-block-timeline-blank-empty-state
title: "Activity — Fix Blank Block Timeline When Recent Blocks Have Zero Transactions"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
priority: P0
labels: [frontend, activity, critical, blank-area, empty-state, visual-polish, security-hardening]
---

# Activity — Fix Blank Block Timeline When Recent Blocks Have Zero Transactions

## Problem (Observed)

The Activity page (`/activity`) renders a "Block Timeline" card showing transaction
counts across the last 20 blocks. During the visual-polish product review for
iteration #31 (May 2026), the timeline area appeared **completely blank** — a
64-pixel tall card with the heading "Block Timeline" and two corner block-number
labels, but no bars at all between them.

This is a CRITICAL visual issue per the product-review skill's definition
("blank area / visually broken page") and undermines trust in the on-chain
monitoring surface the security-hardening initiative depends on (Acceptance
Criteria #3: "Real on-chain transactions executed across all 6 protocols" — the
operator literally cannot see whether transactions are landing).

## Root Cause

`frontend/src/app/activity/page.tsx` renders each block bar with:

```tsx
<div className="flex items-end gap-1 h-16">
  {blocks.slice().reverse().map((b) => (
    <div className="flex-1 group relative" title={`Block ${b.number}: ${b.txCount} txs`}>
      <div
        className={`w-full rounded-t transition-all ${b.txCount > 0 ? 'bg-goodgreen' : 'bg-gray-700/30'}`}
        style={{ height: `${Math.max(4, (b.txCount / maxBlockTxs) * 64)}px` }}
      />
    </div>
  ))}
</div>
```

Two failure modes combine to produce the "blank" look:

1. **Division by zero on quiet chain.** When all 20 most-recent blocks have
   `txCount === 0` (Anvil idle, off-hours, or fresh deploy), `maxBlockTxs` is
   `Math.max(...[0,0,...]) === 0`. The expression `b.txCount / maxBlockTxs`
   evaluates to `0 / 0 = NaN`, so `Math.max(4, NaN) === NaN`. Browsers treat
   `height: NaNpx` as invalid and the bars collapse to zero height.

2. **No empty state.** Even when the floor-of-4px kicks in (mixed case with at
   least one non-zero block), the empty bars are `bg-gray-700/30` — a 30%-opacity
   dark gray on a dark-100 background, so they are nearly invisible. There is no
   textual fallback explaining "no transactions in the last 20 blocks" — the user
   just sees a blank rectangle.

3. **Pre-render race.** Before the first `fetchData()` resolves, `blocks` is
   `[]`, so the inner `.map(...)` renders nothing at all. The skeleton path only
   covers the initial `loading` boolean; subsequent refreshes do not, but the
   Block Timeline card always renders regardless.

## User Story

As a QA engineer or security auditor verifying that GoodSwap / GoodPerps / etc.
are emitting on-chain transactions for the security-hardening initiative, when I
open the Activity page I expect the Block Timeline to clearly communicate
either (a) recent transaction throughput at a glance OR (b) an unambiguous "no
recent activity" empty state. I should never see a blank rectangle that makes me
question whether the page itself is broken.

## How Found

Visual product review (iteration #31, `visual-polish` strategy). Captured a
screenshot of the Activity page and observed the Block Timeline card rendering
as a heading + 64px-tall empty box + two corner labels, with no visible bars.

## Proposed Fix (UX direction — implementer fills in details)

1. **Guard the divisor.** Replace `(b.txCount / maxBlockTxs) * 64` with
   `(b.txCount / Math.max(maxBlockTxs, 1)) * 64` so the NaN case becomes 0 and
   the `Math.max(4, ...)` floor reliably wins.

2. **Increase the minimum bar visibility.** Bump the empty-bar contrast (e.g.
   `bg-gray-600/50` or a thin top border) so blocks with zero transactions are
   visible as ticks rather than disappearing into the background.

3. **Add an explicit empty state when `blocks.length === 0` OR
   `maxBlockTxs === 0`.** Show "No transactions in the last 20 blocks yet."
   (matching the existing "No transactions in recent blocks" pattern used by
   the Transaction Feed below) inside the chart area. Keep the existing block
   number labels suppressed in the empty state.

4. **Show a skeleton while `loading && blocks.length === 0`.** Use the existing
   `Skeleton` component (already imported) for the bar area, matching the rest
   of the page's loading style.

## Acceptance Criteria

- [ ] When the last 20 blocks all have `txCount === 0`, the Block Timeline card
      renders a visible empty state ("No transactions in the last 20 blocks
      yet.") instead of a blank rectangle.
- [ ] When at least one of the last 20 blocks has transactions, all 20 bars
      render with a visible minimum height; the busiest block reaches the top
      of the chart (~64px).
- [ ] Hovering any bar still shows the existing tooltip with block number and
      tx count.
- [ ] On first paint (before RPC resolves), the chart area shows a skeleton
      instead of an empty box.
- [ ] No console warnings or `NaN` values in the computed inline `style`.
- [ ] No regression to the rest of the Activity page (Tester cards, Contract
      Activity, Recent Transactions feed).
- [ ] Initiative Acceptance Criteria #3 monitoring surface is restored —
      operator can confirm at a glance whether on-chain transactions are
      landing.

## Verification

1. Force the empty case on devnet by pausing all keepers and observing the
   page for >20 blocks of idle time.
2. Force the populated case by running a `cast send` swap on GoodSwap and
   confirming bars appear within ~12 seconds (the auto-refresh interval).
3. Run `npx -y react-doctor@latest . --verbose --diff` and confirm score
   ≥ 75 with no errors introduced.
4. Visual diff against the screenshot captured during iteration #31 to confirm
   the blank rectangle is gone.

## Out of Scope

- Adding new metrics (TPS, block time) — handled by future tasks.
- Changing the 20-block window length or the refresh interval.
- Replacing the bar chart with a different visualization.
- Backend / contract changes — this is a pure frontend defensive-render fix.

## Overview (Planner)

Three independent failure modes collapse the "Block Timeline" card to
a blank rectangle. All three are fixable inside the existing
`frontend/src/app/activity/page.tsx` component without changing the
component contract or adding new files. The fix is a small,
defensive-render patch plus an explicit empty-state branch and a
skeleton on first paint.

## Research notes (Planner)

- `frontend/src/app/activity/page.tsx` (lines around the Block
  Timeline) — the existing code:
  ```ts
  const maxBlockTxs = Math.max(1, ...blocks.map(b => b.txCount))
  ```
  The `Math.max(1, ...)` guard *does* prevent `0 / 0`, but only when
  `blocks.length > 0`. When `blocks === []` (initial load or post-RPC
  reset), `.map(...)` is empty, the inner div is never rendered, and
  the bar row collapses to a blank 64px box.
- The bar empty colour is `bg-gray-700/30` — 30% opacity gray on a
  dark page. Even with a 4px floor, the bar is nearly invisible.
- The `Skeleton` component is already imported but only used at the
  page-top "loading" branch, not for the chart area specifically.
- The page already has the empty-state pattern *(`No transactions in
  recent blocks`)* used by the Transaction Feed below — we should
  match that copy + visual treatment for consistency.
- Auto-refresh interval is ~12s; the chart re-mounts cheaply, so
  toggling between empty-state and populated state has no perf cost.
- No other component renders Block Timeline; the fix is fully
  contained inside `activity/page.tsx`.

## Assumptions (Planner)

- The frontend test runner can mount this page component in isolation
  via `@testing-library/react` with the existing wagmi / viem mocks
  used elsewhere in `frontend/src/**/__tests__/`. If not, we fall
  back to a smaller pure-function test for a new helper
  `computeBarHeights(blocks, chartHeightPx)` extracted from the JSX.
- Tailwind classes `bg-gray-600/50` and existing `text-gray-*` tokens
  already exist in the project's design system (verified — used in
  other dark-mode cards).

## Architecture diagram

```mermaid
flowchart TD
    A[fetchData every 12s] --> B{blocks state}
    B -->|loading & blocks=[]| S[Skeleton bars]
    B -->|blocks.length=0<br/>after load| E[Empty state copy<br/>"No transactions in the<br/>last 20 blocks yet."]
    B -->|all txCount=0| E
    B -->|≥1 block has txs| C[Compute maxBlockTxs<br/>= Math.max&#40;1, ...counts&#41;]
    C --> D[Render 20 bars<br/>height = max&#40;4, count/max * 64&#41;<br/>txCount=0 → bg-gray-600/50<br/>txCount>0 → bg-goodgreen]
    D --> T[Tooltip on hover<br/>block# + txCount]
    classDef fix fill:#efe,stroke:#3a3;
    class S,E,D fix;
```

## One-week decision

**YES** — half-day fix.

Rationale: single file change, no contract or backend work, no new
dependencies, existing `Skeleton` component and empty-state copy
pattern can be reused. Tests are unit-level around a small render
helper.

## Implementation plan

Phase 1 — Reproduce + test scaffold (~30 min):
1. Add `frontend/src/app/activity/__tests__/block-timeline.test.tsx`
   (or a colocated test). Mock the wagmi `usePublicClient` reads so
   `blocks` resolves to:
   - case A: `[]` (initial load) → expect a skeleton element.
   - case B: 20 blocks all `txCount: 0` → expect the empty-state copy
     `"No transactions in the last 20 blocks yet."` and *no* bars.
   - case C: mixed (`[0,0,3,0,1,...]`) → expect 20 bar elements, the
     `3`-tx bar to be the tallest, and the busiest bar to use
     `bg-goodgreen` while zero bars use `bg-gray-600/50`.
2. Run tests — they should fail on `main`.

Phase 2 — Defensive computation + extracted helper (~30 min):
1. Inside `activity/page.tsx`, near the Block Timeline JSX, replace
   the inline `Math.max(...)` with a small helper:
   ```ts
   function computeBarHeights(
     blocks: Block[],
     chartHeightPx = 64,
     minBarPx = 4,
   ): { height: number; hasTxs: boolean }[] {
     const counts = blocks.map((b) => b.txCount)
     const max = Math.max(1, ...counts)
     return blocks.map((b) => ({
       height: Math.max(minBarPx, (b.txCount / max) * chartHeightPx),
       hasTxs: b.txCount > 0,
     }))
   }
   ```
2. Use this helper in the render. This isolates the math from the
   JSX and makes it unit-testable without rendering.

Phase 3 — Empty-state + skeleton branches (~45 min):
1. Compute `hasAnyTxs = blocks.some(b => b.txCount > 0)`.
2. Replace the bar row with three render branches:
   - `loading && blocks.length === 0` → `<Skeleton className="h-16 w-full" />`
   - `!loading && (blocks.length === 0 || !hasAnyTxs)` → centered
     `<p className="text-sm text-gray-400">No transactions in the
     last 20 blocks yet.</p>` inside a `h-16` flexbox.
   - otherwise → existing bar map, using `computeBarHeights(...)`.
3. Bump the empty-bar contrast from `bg-gray-700/30` to
   `bg-gray-600/50`.
4. Keep the top-corner block-number labels visible in the populated
   case; hide them in the empty/loading case (they would label
   nothing).

Phase 4 — Verification (~30 min):
1. `pnpm --filter frontend test` — new tests pass.
2. `pnpm --filter frontend typecheck` — no new errors.
3. Manually pause keepers and refresh the page; confirm empty-state
   copy renders.
4. Issue a `cast send` swap; confirm bars reappear within ~12s.
5. Resize browser to 320 / 768 / 1280 widths; confirm empty-state
   text does not wrap awkwardly.
6. `npx -y react-doctor@latest . --verbose --diff` — score ≥ 75.

Phase 5 — README hygiene (~10 min):
1. If the Known Issues table lists the blank Block Timeline, remove
   that row.
2. Add a one-line entry under `Security Hardening` (or Frontend
   Hardening) noting the defensive-render fix.
3. Bump `Updated:` date to today.
