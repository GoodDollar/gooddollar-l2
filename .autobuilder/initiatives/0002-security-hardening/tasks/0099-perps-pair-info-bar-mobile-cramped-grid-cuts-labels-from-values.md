---
id: gooddollar-l2-perps-pair-info-bar-mobile-cramped-grid-cuts-labels-from-values
slug: perps-pair-info-bar-mobile-cramped-grid-cuts-labels-from-values
title: "Perps — `PairInfoBar` Mobile (≤640px) Renders 8 Stats in a 3-Column Grid That Wraps Labels Onto Different Lines From Their Values"
parent: gooddollar-l2
deps: []
priority: P2
status: open
planned: true
split: false
executed: true
strategy: visual-polish
iteration: 50
created: 2026-05-16
labels: [frontend, perps, mobile, polish, responsive, typography]
---

# Perps — `PairInfoBar` Mobile (≤640px) Renders 8 Stats in a 3-Column Grid That Wraps Labels Onto Different Lines From Their Values

## Observed problem (visual-polish review, iteration #50)

Screenshot `/tmp/iter50-screenshots/perps-mobile.png` (375×812 viewport, the
iPhone 12/13 reference width) shows the Perps `PairInfoBar` directly under
the price headline rendering as a cramped grid where:

- "Mark $84,247.0" wraps to two lines because the cell can't fit
  the formatted price plus its label inline.
- "Funding in" appears on one line and the time string `5h 12m` appears on
  the next, so the eye reads "Funding in / 5h 12m" as two unrelated rows.
- "24h H" and "24h L" are missing on mobile (their parent `<div>` does
  render, but the green/red price wraps under the label).
- Two columns end up mostly empty in some rows, leaving the visual weight
  unbalanced — a 3-col grid forces 8 stats into a 3×3 layout where the last
  row has only two cells.

The desktop version (≥640px) is fine — it uses `sm:flex sm:flex-wrap` which
allows the natural `label value` pairs to flow horizontally. The break is
purely below the `sm:` breakpoint.

## Root cause

`frontend/src/app/(app)/perps/page.tsx:127`:

```tsx
function PairInfoBar({ pair }: { pair: PerpPair }) {
  return (
    <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-6 text-xs py-2">
      <div>
        <span className="text-gray-500">Mark</span>
        <span className="text-white font-medium ml-1.5">{formatPerpsPrice(pair.markPrice)}</span>
      </div>
      ...
```

Two problems together:

1. `grid-cols-3` at ≤640px gives each cell ~`(375px - 24px padding - 24px gap) / 3 ≈ 109px`.
   `formatPerpsPrice(84247)` renders as `"$84,247.00"` (≈ 90px wide at 12px),
   plus the `Mark` label and `ml-1.5` gap (≈ 38px), giving a natural width
   of ~128px — wider than the cell, so it wraps.
2. The label and value live in the same line via `ml-1.5`, so when the cell
   is too narrow they wrap as two visually disconnected rows. There's no
   `<div className="flex flex-col">` to group them, and no minimum-width
   reservation for the value.

## Files affected

- `frontend/src/app/(app)/perps/page.tsx` — `PairInfoBar` only.

## Target behavior

On mobile (≤640px), every stat must render as a **stacked tile**: label on
the first line, value directly below it, both clearly belonging to the same
cell. On desktop (≥640px) the existing inline `flex flex-wrap` layout must
remain unchanged.

Concretely:

1. Switch the mobile layout from `grid grid-cols-3` to `grid grid-cols-2`
   (or keep `grid-cols-3` but with stacked label/value tiles — see #2).
   `grid-cols-2` produces 4 rows of 2 stats at 375px which preserves
   readability without sacrificing density.
2. Inside each stat cell, on mobile, stack label-above-value:
   `<div className="flex flex-col sm:inline">` or equivalent. The label
   uses `text-[10px] uppercase tracking-wide text-gray-500` (smaller, all-caps)
   to read as a header, and the value keeps its current font weight. On
   desktop (≥640px), revert to inline via `sm:inline`.
3. Remove `ml-1.5` on mobile (the stack handles spacing) — gate it with
   `sm:ml-1.5` so desktop is preserved.
4. The two conditional cells (`24h H`, `24h L`) must render at full width
   on mobile too — the conditional `{pair.high24h != null && ...}` stays.

This is a CSS-only refactor of a single ~45-line component. No data,
hooks, or formatting helpers change.

## Acceptance criteria

- At 375×812:
  - Each stat cell shows its label on one line and its value on the next,
    no mid-value wrapping.
  - No two adjacent cells share a label/value across rows (the eye should
    never read a value as belonging to the wrong label).
  - The bar fits within the viewport without horizontal scroll.
- At 1440×900: layout is byte-identical to today (visual diff zero).
- React-doctor (`npx -y react-doctor@latest .`) score does not regress;
  targets ≥ 75.
- No new dependencies introduced.

## Out of scope

- Re-ordering which stats appear (Mark / 24h / 24h H / 24h L / Vol /
  Funding / Funding in / OI stays as-is).
- Hiding any stats on mobile — all current stats remain visible.
- Adding new stats or sparklines.
- Touching the price headline or the `MarketSelector` above the bar
  (covered by other tasks).

## Verification steps

1. `pm2 restart goodswap` and open `http://localhost:3100/perps` in
   `agent-browser` at 375×812 — confirm each stat is a stacked tile and
   no value wraps.
2. Resize to 640×900 and 1440×900 — confirm desktop layout is unchanged.
3. Re-take screenshots and diff against `/tmp/iter50-screenshots/perps-mobile.png`.
4. Switch pair (BTC → ETH → SOL) and confirm the layout doesn't break for
   pairs with shorter prices.

## Planning

### Research notes

- `PairInfoBar` is a local function inside `frontend/src/app/(app)/perps/page.tsx`,
  not exported. No tests reference it. Edits are contained to the file.
- The page already uses `text-[10px]`, `uppercase`, `tracking-wide` and
  `flex flex-col` patterns elsewhere (e.g. the `PortfolioSummary` cards
  on the same `(app)` group), so the new tile style fits the design system.
- Tailwind v3 supports per-breakpoint `flex flex-col` → `sm:flex-row sm:items-center`
  toggles cleanly with no JS.
- Existing pair selector tab clipping fix lives in task `0086` (already
  executed, with a fade-gradient affordance) — no overlap with this task.

### Assumptions

- 8 stats × 2 columns = 4 rows on mobile; the bar gains ~30 px of height
  vs. today (still well under 200 px). Acceptable.
- `Mark` stays the longest stat (`"$84,247.00"` is 11 chars). At 50% of
  375 - 24 = 351 px = ~163 px per cell, the value comfortably fits on
  one line.

### Architecture

```mermaid
flowchart TD
    A[PerpPair prop] --> B[PairInfoBar]
    B --> C{viewport}
    C -->|≤640px| D[grid grid-cols-2 gap-3]
    C -->|≥640px| E[flex flex-wrap gap-6]
    D --> F[stat cell: flex flex-col]
    F --> G[label: text-[10px] uppercase tracking-wide]
    F --> H[value: text-xs font-medium]
    E --> I[stat cell: inline label + value with ml-1.5]
    style D fill:#1f2937,color:#fff
    style E fill:#0f172a,color:#fff
```

### One-week decision: **YES**

CSS-only refactor of a single ~50-line component. ~30 minutes of work.

### Implementation plan

1. **Wrapper classes** — change the outer `<div>` from
   `grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-6` to
   `grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-0`.
   Two columns on mobile produces 4 even rows for 8 stats.
2. **Per-stat cells** — replace each
   `<div><span class="text-gray-500">Label</span><span class="ml-1.5">Value</span></div>`
   with
   `<div className="flex flex-col sm:flex-row sm:items-baseline"><span className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs sm:normal-case sm:tracking-normal">Label</span><span className="text-white font-medium sm:ml-1.5">Value</span></div>`
   (color of value depends on the stat — preserve `text-green-400` /
   `text-red-400` for high/low/funding).
3. **Manual verification** at 375 / 640 / 1440 viewports per the steps.

No git push; commit message: `Perps — stack PairInfoBar stats into label/value tiles on mobile`.
