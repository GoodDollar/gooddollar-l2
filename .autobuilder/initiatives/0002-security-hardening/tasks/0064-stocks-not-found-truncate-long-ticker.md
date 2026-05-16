---
id: gooddollar-l2-stocks-not-found-truncate-long-ticker
title: "Stocks — Truncate Long Ticker Symbols on 'Stock Not Found' Page to Prevent Horizontal Overflow"
parent: gooddollar-l2
deps: []
split: null
depth: 1
planned: true
executed: true
priority: P3
split: false
labels: [frontend, goodstocks, edge-cases, ux, production-readiness, display-overflow]
---

# Stocks — Truncate Long Ticker Symbols on 'Stock Not Found' Page to Prevent Horizontal Overflow

## Overview (planner)

Apply the executed task 0054 (Explore "Token Not Found") truncation
pattern to the Stocks "Stock Not Found" detail page. Cap visible
ticker at 24 characters with an ellipsis, expose the full raw
value via `title=`, ensure no horizontal page scrollbar. Pure
display-layer fix, no logic change.

## Research notes

- The detail route lives at `frontend/src/app/(app)/stocks/[ticker]/page.tsx`
  (App Router segment). The "Not Found" branch renders when the
  segment doesn't match any known synthetic stock.
- The "Token Not Found" Explore fix (task 0054) used a small
  `truncateMiddle(value, 24)` helper plus `break-all max-w-full
  truncate` on the wrapper. Same helper can be reused — currently
  exported from `frontend/src/lib/strings.ts` per the 0054
  implementation notes.
- The raw URL segment is already URL-decoded by Next.js before
  reaching `params.ticker`; it is rendered safely (no
  `dangerouslySetInnerHTML`) so this is purely a layout fix, not
  a security fix.
- The site header, UBI banner, and footer all live in the App
  Router root layout. They use `w-full` containers but no
  `overflow-x-hidden` guard at the body level. The right fix is at
  the leaf component (the "Not Found" card), not the global
  layout, because adding `overflow-x-hidden` to body would mask
  similar bugs elsewhere instead of fixing them.

## Assumptions

- 24 characters with middle ellipsis matches the Explore precedent.
  No need to introduce a different cap.
- A `title=` attribute is sufficient accessibility for the full
  ticker. We don't need a screen-reader-only span because the
  truncated text is still informative.
- The `truncateMiddle` helper from `lib/strings.ts` exists and is
  shared. If not (e.g. it was inlined in the Explore fix), we
  promote it to `lib/strings.ts` in this task and update the
  Explore caller — that promotion still fits in the same task.

## Architecture diagram

```mermaid
flowchart TD
    URL[/stocks/AAAAAAA…(500 A's)] --> Param[params.ticker raw]
    Param --> Lookup{stock exists?}
    Lookup -->|no| NotFound[StockNotFound component]
    NotFound --> Trunc[truncateMiddle ticker, 24]
    Trunc --> Span["<span title={ticker}>"]
    Span --> Card[bounded card with break-all max-w-full]
    Card --> Page[page fits viewport — no h-scroll]
```

## One-week decision

**YES** — ~15 minutes of edits, plus a small test. Well under one
day; no split.

## Implementation plan

1. Open `frontend/src/app/(app)/stocks/[ticker]/page.tsx` (or the
   "Stock Not Found" subcomponent it renders).

2. If `truncateMiddle` is not already exported from
   `frontend/src/lib/strings.ts`, add:

   ```ts
   export function truncateMiddle(value: string, max = 24): string {
     if (!value || value.length <= max) return value
     const head = Math.ceil((max - 1) / 2)
     const tail = Math.floor((max - 1) / 2)
     return `${value.slice(0, head)}…${value.slice(-tail)}`
   }
   ```

3. In the "Stock Not Found" branch, wrap the ticker rendering
   with the helper and the bounded container:

   ```tsx
   <p className="text-sm text-gray-400 break-all max-w-full">
     The ticker{' '}
     <span
       className="font-mono text-white"
       title={ticker}
     >
       {truncateMiddle(ticker, 24)}
     </span>{' '}
     is not available.
   </p>
   ```

   Ensure the parent card has `max-w-full` and no fixed-width
   `white-space: nowrap` ancestor.

4. Add a snapshot/unit test
   `frontend/src/app/(app)/stocks/[ticker]/__tests__/not-found.test.tsx`:
   - empty ticker → renders default copy without crashing
   - `AAPL` → renders `AAPL` verbatim (no ellipsis at length 4)
   - 25-char ticker → renders with ellipsis, full value on
     `title=`
   - 500-char ticker → renders with ellipsis, full value on
     `title=`, wrapper class list contains `break-all` and
     `max-w-full`.

5. Manual verification with agent-browser:
   - `/stocks/AAPL` at 1280px → no h-scroll, ticker visible
     verbatim.
   - `/stocks/A…(500 A's)` at 320px, 768px, 1280px → no h-scroll,
     header + UBI banner + footer all aligned.

6. Update README.md "Updated:" date. No other functional change.

## Out of scope

- Reworking the success path of the Stocks detail page.
- Server-side validation of ticker URL segments.
- Any sanitization beyond display truncation.
- Any change outside the Stocks "Not Found" component, the strings
  helper (if promoting `truncateMiddle`), its tests, and the
  README date bump.

---

## Problem statement

The Stocks detail route (`/stocks/[ticker]`) interpolates the raw
`ticker` URL segment into its "Stock Not Found" empty state without
any length cap or `break-all`. When a user (or a crawler, or a
mistyped link) hits a URL with a very long ticker, the page renders
the entire string on a single line, blowing past the viewport edge
and introducing a horizontal scrollbar on the whole document.

Verified locally during the iteration #30 edge-cases review:

- Visited `http://localhost:3100/stocks/<500 'A's>` and the "The
  ticker `A…A` is not available." line stretches the full viewport
  width with no wrapping. Screenshot at
  `/tmp/edge-stock-longticker.png`.
- A `<script>alert(1)</script>` ticker correctly stays URL-encoded
  in the display (good — no XSS), so this is purely a
  display-overflow issue, not a security one.

This is the same class of bug as the already-fixed Explore
`token-not-found-symbol-overflow` task (0054) but on a different
route, so the existing fix doesn't carry over.

## User story

As a user who lands on a malformed `/stocks/<garbage>` URL — by
mis-typing, by following a stale link, or by clicking a fuzzer's
deep link — I want the "Stock Not Found" page to fit inside my
viewport instead of introducing a horizontal scrollbar that breaks
every other UI affordance on the page (header, footer, banner close
button).

## How it was found

agent-browser navigation to
`http://localhost:3100/stocks/AAAAAA…(500 A's)`. The resulting
screenshot (`/tmp/edge-stock-longticker.png`) shows the ticker text
on a single line crossing well past the right viewport edge,
producing a horizontal scrollbar that also shifts the GoodDollar
header, the UBI banner, and the footer out of alignment.

Cross-checked against task 0054
(`0054-explore-token-not-found-symbol-overflow.md`, executed) — same
pattern, different route. The Explore fix established the agreed
truncation style for this app: cap at 24 characters with an ellipsis,
use `break-all` on the wrapper, keep the full value available via
`title=` for accessibility.

## Proposed UX

On the `/stocks/[ticker]` "Stock Not Found" page:

- Cap the visible ticker at 24 characters with an ellipsis
  (`AAAAAAA…AAAAAAA…`).
- Wrap the ticker text in a container with `break-all max-w-full`
  and Tailwind `truncate` semantics so it never escapes the card.
- Preserve the full (raw) ticker as a `title=` attribute on the
  span so screen readers and hover tooltips can still expose it.
- The "Back to Stocks" button position must not move when the
  ticker is short, long, or empty.

Match the visual cap, ellipsis style, and `title=` exposure used by
the Explore "Token Not Found" page from task 0054 so the two empty
states feel consistent.

## Acceptance criteria

- [ ] The "Stock Not Found" component used by the `/stocks/[ticker]`
      route truncates the displayed ticker to at most 24 visible
      characters with an ellipsis.
- [ ] The full raw ticker value is preserved on a `title=` attribute
      on the span.
- [ ] At viewport widths 320px, 768px, and 1280px, visiting
      `/stocks/<500 A's>` produces NO horizontal page scrollbar.
      Verified via `agent-browser screenshot`.
- [ ] The header, UBI banner, and footer remain horizontally
      aligned at the same viewport widths regardless of ticker
      length.
- [ ] A unit/snapshot test covers: empty ticker, normal ticker
      (`AAPL`), 25-character ticker (just over the cap), and
      500-character ticker.
- [ ] No regression: the existing "Back to Stocks" button still
      navigates to `/stocks` and remains visually centered.

## Verification

- `pnpm --filter frontend test -- stocks` passes (new tests
  included).
- `pnpm --filter frontend test` full frontend suite passes.
- `pnpm --filter frontend build` succeeds with no new warnings.
- `npx -y react-doctor@latest . --verbose --diff` — score ≥ 75 on
  touched files; no new errors.
- agent-browser regression: open
  `http://localhost:3100/stocks/AAAA…(500 A's)`, take a
  screenshot, confirm no horizontal scrollbar and ellipsis
  rendering.
- agent-browser regression: open
  `http://localhost:3100/stocks/AAPL` — page still renders normally
  (so the truncation doesn't accidentally affect real tickers).
- README "Updated:" date refreshed, no other functional change.

## Out of scope

- Reworking the success path of the Stocks detail page.
- Server-side validation of ticker URL segments.
- Any sanitization beyond display truncation (the raw value is
  already URL-encoded and rendered safely).
- Any change outside the Stocks detail "not found" component, its
  tests, and the README date bump.
