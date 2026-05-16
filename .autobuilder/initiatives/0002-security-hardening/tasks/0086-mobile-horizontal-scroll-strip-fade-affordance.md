---
id: gooddollar-l2-mobile-horizontal-scroll-strip-fade-affordance
slug: mobile-horizontal-scroll-strip-fade-affordance
title: "Mobile — Horizontal Scroll Strips Clip Without Affordance (Predict / Explore / Perps Filter Bars Look Broken on 375px)"
parent: gooddollar-l2
priority: P1
status: done
planned: true
split: false
executed: true
strategy: visual-polish
iteration: 43
created: 2026-05-16
executed_at: 2026-05-16
---

# Mobile — Horizontal Scroll Strips Clip Without Affordance

## Problem

On the 375px mobile viewport, multiple filter strips overflow horizontally and the rightmost item is **clipped at the viewport edge with no visual indication that more content exists to the right**. The current implementation uses `overflow-x-auto` together with a `scrollbar-none` class to hide the scrollbar. On iOS/Android Safari and Chrome, horizontal scrollbars are not rendered at rest anyway, so the user is left looking at a strip whose last chip ends in a hard, partial cut — which reads as a broken layout rather than a scrollable list.

Compounding factors:

1. `scrollbar-none` is referenced in 6 source files but is **not actually defined anywhere** — not in `frontend/src/app/globals.css`, not in `frontend/tailwind.config.ts`, and not via a Tailwind plugin. The class is dead. The "no scrollbar" effect users see on mobile is purely the platform default. On desktop browsers that do render scrollbars (Chrome/Firefox on Linux/Windows), the scrollbar is still visible — so the existing intent of the class is also leaking through inconsistently.

2. Professional production apps that ship horizontal pill rows on mobile (Polymarket, Robinhood, Coinbase, Uniswap mobile web, Apple News) universally add a **right-edge fade gradient** so the user can tell content extends past the viewport. We do not have this.

### Concrete locations observed (iter 43 visual review, viewport 375×812)

Screenshots captured to `/tmp/iter43-screens/` confirm clipped strips on:

- **`/predict`** — sort options strip and category chips strip both clip the last item.
  - `frontend/src/app/(app)/predict/page.tsx:517` — `flex gap-1 overflow-x-auto scrollbar-none` (sort bar)
  - `frontend/src/app/(app)/predict/page.tsx:531` — `flex gap-2 overflow-x-auto pb-1 scrollbar-none` (category chips)
- **`/explore`** — category chip row clips rightmost label.
  - `frontend/src/app/(app)/explore/page.tsx` — `flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none`
- **`/perps`** — market pair selector tabs clip the rightmost pair.
  - `frontend/src/app/(app)/perps/page.tsx:115` — `flex gap-1 overflow-x-auto pb-1 scrollbar-none`

Two additional locations should be reviewed for the same pattern but are lower priority (they're inside cards/panels, not full-bleed page filters):

- `frontend/src/components/OrderBook.tsx`
- `frontend/src/components/RecentTrades.tsx`
- `frontend/src/components/SectionNav.tsx`

## Why P1 (not P0)

- App is not crashing, no data loss, no security implication.
- Page is still functionally usable — swiping does scroll the strip.
- But the perceived quality across three of our most-trafficked pages on mobile is "broken layout," which is exactly the gap the `visual-polish` strategy targets.
- Within Phase 1 initiative scope only because **no new UI features** are introduced — this is pure polish on an existing layout pattern.

## Acceptance Criteria

1. **Reusable scroll-strip primitive** introduced (e.g. `frontend/src/components/ScrollStrip.tsx`) that:
   - Accepts children and renders them inside a `overflow-x-auto` container.
   - Renders a right-edge fade gradient (~24–32px wide) from `transparent` to the page background color so the user sees content fade out, not get sliced.
   - Hides scrollbars cross-browser using `scrollbar-width: none` (Firefox), `-ms-overflow-style: none` (legacy Edge/IE), and `::-webkit-scrollbar { display: none }` (WebKit/Blink). This replaces the currently-dead `scrollbar-none` class.
   - Optionally also shows a left-edge fade once `scrollLeft > 0` (nice-to-have, can be a second sub-task if needed).
   - Inherits the background fade color from a prop or CSS variable so it works on cards as well as full-page backgrounds.
   - Has no JavaScript dependency beyond optional `useEffect` for left-edge fade visibility — pure CSS for the right fade.

2. **Use the primitive** on the three observed locations:
   - `/predict` sort options strip
   - `/predict` category chips strip
   - `/explore` category chips strip
   - `/perps` market pair selector tabs

3. **Define the `scrollbar-none` utility properly** as a Tailwind component layer in `globals.css` OR delete it everywhere the new `ScrollStrip` replaces it. Leaving the dead class in place is not acceptable.

4. **Mobile screenshots (375×812)** of the four locations show:
   - A subtle gradient fading the right edge of the strip into the page background.
   - The rightmost chip no longer appears "guillotined" — it visually fades.

5. **Desktop screenshots (1440×900)** show:
   - When the strip fits without overflow, the fade gradient is not visible (don't show fade if there's nothing to scroll to). Acceptable to always show it on mobile and conditionally hide on desktop where chips fit — implementer's call as long as desktop doesn't look weird.

6. **No regression** on existing tests:
   - `frontend/src/components/__tests__/Header.test.tsx`
   - Any predict/explore/perps page unit tests
   - All Foundry tests still pass (untouched — frontend-only change).

7. **README update** per initiative spec — bump frontend stats date and append a polish entry.

## Out of Scope

- No changes to filter logic, no changes to chip labels or ordering, no new chips.
- No changes to OrderBook / RecentTrades / SectionNav strips in this task. Those are inside cards, not full-bleed page filters, and the visual symptom is much less noticeable. File a follow-up task if they show the same problem after this lands.
- No mobile redesign — only the fade affordance plus proper scrollbar-hiding utility.
- No changes to backend services, smart contracts, or test infrastructure.

## Risks & Mitigations

- **Risk:** Fade gradient color doesn't match the page background, leaving a visible seam.
  **Mitigation:** Drive the fade color from a CSS variable defaulting to `--background` (already defined in `globals.css`). Allow override prop for cards.

- **Risk:** Conditionally rendering left fade based on `scrollLeft` requires JS and could re-render too often.
  **Mitigation:** Right fade is pure CSS (no JS). Left fade is optional and out of MVP — defer.

- **Risk:** Replacing `scrollbar-none` with a real utility might suddenly render scrollbars on Linux Chrome where we currently have nothing.
  **Mitigation:** The new `ScrollStrip` hides scrollbars properly cross-browser, so the visible behavior on desktop Chrome/Firefox becomes consistent with mobile (no scrollbar at all). No surprise scrollbars appear.

## Verification Plan

1. Build the frontend: `cd frontend && npm run build`.
2. `npx -y react-doctor@latest frontend --verbose --diff` — target score ≥ 75.
3. Visual: open `https://goodswap.goodclaw.org/predict`, `/explore`, `/perps` at 375px and 1440px viewports, confirm rightmost chip fades into background instead of being cut.
4. Run frontend unit tests: `cd frontend && npm test`.
5. Spot-check no horizontal scrollbar visible on desktop Chrome/Firefox after the change.

---

# Planning Notes (Iteration 43)

## Inventory of Affected Code

`grep` for `overflow-x-auto.*scrollbar-none` confirms 5 occurrences across 4 files:

| File | Line | Strip purpose | Has fade today? | Notes |
|---|---|---|---|---|
| `frontend/src/app/(app)/predict/page.tsx` | 517 | Sort options | ❌ NO fade | Lives next to a sibling `<input>` in a `flex` wrapper — strip clips on mobile. |
| `frontend/src/app/(app)/predict/page.tsx` | 531 | Category chips | ✅ Has fade (line 548) | Hardcoded `from-[#0f1117]` does not exactly match body bg `#0f1729` — subtle seam. |
| `frontend/src/app/(app)/explore/page.tsx` | 522 | Category chips | ❌ NO fade | |
| `frontend/src/app/(app)/perps/page.tsx` | 115 | Pair selector | ✅ Has fade (line 123) | Same hardcoded color mismatch. |
| `frontend/src/components/SectionNav.tsx` | 21 | Tab nav | ❌ NO fade | Used by multiple screens — fading needs to match each caller's bg. |

Also relevant: `frontend/src/components/OrderBook.tsx` and `frontend/src/components/RecentTrades.tsx` reference `scrollbar-none` for **vertical** scrolling inside cards — out of scope for this task (no horizontal clip symptom).

## The Three Real Problems

1. **`scrollbar-none` is dead.** Not defined in `frontend/src/app/globals.css`, not in `frontend/tailwind.config.ts`, no plugin. On Linux Chrome the scrollbar still shows on desktop; on mobile WebKit/Blink hide it by default — pure coincidence the code "works."
2. **Two strips already have a fade, two don't, one (SectionNav) doesn't either.** Inconsistent quality across the same UI primitive across pages.
3. **The fade color (`#0f1117`) doesn't match the actual body background (`#0f1729`).** Side-by-side at 200% zoom you can see the ~2-shade mismatch. Pixel polish should match.

## Architecture

```mermaid
graph TD
    A[ScrollStrip.tsx<br/>new component] -->|wraps children<br/>in overflow-x-auto<br/>scroll container| B[scroll container]
    A -->|renders absolute<br/>positioned span| C[right-edge fade gradient]
    A -->|optional prop| D[fadeColor / fadeFrom]
    A -.->|reads default from| E[--background CSS var<br/>in globals.css]
    F[globals.css] -->|defines .scrollbar-none<br/>as proper utility:<br/>scrollbar-width none<br/>+ ::-webkit-scrollbar display none] --> A
    G[predict/page.tsx<br/>sort + category strips] --> A
    H[explore/page.tsx<br/>category strip] --> A
    I[perps/page.tsx<br/>pair selector] --> A
    J[SectionNav.tsx] --> A
    A -.->|removes hardcoded<br/>fade gradient divs| K[predict line 548<br/>perps line 123]
```

**Contract for `ScrollStrip`:**

```tsx
interface ScrollStripProps {
  children: ReactNode;
  className?: string;       // applied to inner scroll container
  fadeFrom?: string;        // tailwind color/arbitrary value, default 'from-[hsl(var(--background))]'
  fadeWidth?: 'w-6' | 'w-8' | 'w-10'; // default 'w-8'
  ariaLabel?: string;
}
```

Renders:
```
<div class="relative {wrapperClassName}">
  <div class="flex overflow-x-auto scrollbar-none {className}" role="..."> {children} </div>
  <span aria-hidden class="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l {fadeFrom} to-transparent" />
</div>
```

Right fade is pure CSS, no JS, no useEffect. Left fade is **deferred** — adds complexity for marginal polish; not in MVP. If a future review notes it, file a follow-up.

## Research Notes

- **MDN: hiding scrollbars portably.** The accepted cross-browser pattern is `scrollbar-width: none` (Firefox), `-ms-overflow-style: none` (Edge legacy), and `&::-webkit-scrollbar { display: none }` (WebKit/Blink). Source: https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width
- **Tailwind v3 component layer** is the idiomatic place for cross-browser scrollbar-hiding utilities (vs. installing `tailwind-scrollbar-hide`). Adding it directly to `globals.css` avoids a new dependency.
- **CSS variable for fade color** — `globals.css` already exposes `--background` as `218 41% 12%` (= `#11192a`), which is much closer to the actual body gradient end (`#0f1729`) than the hardcoded `#0f1117`. Driving the fade from this var makes the polish theme-aware (light mode already toggles `--background` via the `.light` class on `html`).
- **No need for IntersectionObserver / ResizeObserver** for MVP — we always render the right fade. If strip fits the viewport, the rightmost chip ends before the fade region, so the fade simply blends over empty space and is visually invisible. This is exactly how Polymarket and Robinhood handle it. Confirmed by mental walk-through, no JS observer needed.

## Assumptions

- Light theme also needs the fade to look right. The current hardcoded `from-[#0f1117]` would look totally wrong on light mode (dark band on white background). Driving the fade from `--background` solves this for free.
- We are not allowed to introduce a new npm dependency (per initiative spec: "No new UI features"). All work uses existing Tailwind utilities + plain CSS.
- The `SectionNav` change is in-scope because it's the same exact pattern, but with **lower priority**: it can be done in the same task or deferred. Plan includes it in Phase 2.

## One-Week Decision: **YES**

This is comfortably under 1 day of work for one engineer:
- ~30 min: write `ScrollStrip.tsx` (~25 lines including types and a fade-gradient story file).
- ~10 min: add `.scrollbar-none` utility to `globals.css` (5 lines).
- ~20 min: refactor 4 call sites in 3 files.
- ~10 min: refactor `SectionNav.tsx` (the 5th call site).
- ~20 min: run frontend tests, `react-doctor`, build, screenshot mobile + desktop on the 3 affected pages, verify fade looks right against `--background`.
- ~10 min: README + commit.

Total: **~1.5 hours of focused work**, well within a single day, no split needed.

## Implementation Plan (Phased)

### Phase 1 — Foundation (15 min)

1. Add the missing `.scrollbar-none` utility to `frontend/src/app/globals.css` inside the `@layer utilities` block:

```css
@layer utilities {
  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
}
```

Verify: desktop Chrome no longer renders a horizontal scrollbar on `/predict` filter bar after this change.

### Phase 2 — Component (20 min)

2. Create `frontend/src/components/ScrollStrip.tsx`:

```tsx
import type { ReactNode } from 'react'

interface ScrollStripProps {
  children: ReactNode
  className?: string
  wrapperClassName?: string
  fadeFromClass?: string   // tailwind 'from-...' classes; default uses --background
  fadeWidthClass?: string  // 'w-6' | 'w-8' | 'w-10'
  ariaLabel?: string
}

export function ScrollStrip({
  children,
  className = '',
  wrapperClassName = '',
  fadeFromClass = 'from-[hsl(var(--background))]',
  fadeWidthClass = 'w-8',
  ariaLabel,
}: ScrollStripProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        className={`overflow-x-auto scrollbar-none ${className}`}
        role={ariaLabel ? 'group' : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 top-0 bottom-0 ${fadeWidthClass} bg-gradient-to-l ${fadeFromClass} to-transparent`}
      />
    </div>
  )
}
```

### Phase 3 — Apply to predict (15 min)

3. In `frontend/src/app/(app)/predict/page.tsx`:
   - Import `ScrollStrip` from `@/components/ScrollStrip`.
   - Line 517 (sort options): wrap in `<ScrollStrip className="flex gap-1" ariaLabel="Sort options">…</ScrollStrip>`.
   - Lines 530–549 (category chips with existing hardcoded fade): replace the manual `relative` + `<div>` + hardcoded fade `<div>` with `<ScrollStrip className="flex gap-2 pb-1" wrapperClassName="mb-6" ariaLabel="Categories">…</ScrollStrip>`. Drops the hardcoded `from-[#0f1117]`.

### Phase 4 — Apply to explore + perps (10 min)

4. `frontend/src/app/(app)/explore/page.tsx:522` — wrap the category chip row in `<ScrollStrip className="flex gap-2 pb-1" wrapperClassName="mb-4" ariaLabel="Token categories">…</ScrollStrip>`.

5. `frontend/src/app/(app)/perps/page.tsx:113–125` — replace the existing inline `relative` + scroll div + hardcoded fade with `<ScrollStrip className="flex gap-1 pb-1" ariaLabel="Trading pairs">…</ScrollStrip>`. Note: the `PairSelector` function body shrinks from ~13 lines to ~9.

### Phase 5 — Apply to SectionNav (5 min)

6. `frontend/src/components/SectionNav.tsx:21` — wrap the nav strip in `<ScrollStrip className="flex gap-1 border-b border-gray-700/20" ariaLabel="Section navigation">…</ScrollStrip>`. The bottom border stays on the inner scroller so it spans the full strip.

### Phase 6 — Verification + README (20 min)

7. `cd frontend && npm run build` — must succeed.
8. `cd frontend && npm test` — must pass (only Header.test.tsx exists today AFAIK; no test for these strips, fine).
9. `npx -y react-doctor@latest frontend --verbose --diff` — score ≥ 75.
10. Open devnet site at `375×812`:
    - `/predict` — sort strip & category strip both fade on the right.
    - `/explore` — category strip fades on the right.
    - `/perps` — pair selector fades on the right.
11. Same at `1440×900` — confirm fade doesn't introduce a visible artifact when chips fit.
12. Switch to light mode (if toggleable) — confirm fade matches white background, not dark blue.
13. Update README.md: bump `Updated:` date, add a "Security Hardening" / "Frontend Polish" bullet noting the new shared `ScrollStrip` primitive replaces 5 ad-hoc implementations.

## Definition of Done

- `frontend/src/components/ScrollStrip.tsx` exists and is exported.
- `.scrollbar-none` defined as a real utility in `globals.css`.
- All 5 call sites refactored to use `ScrollStrip`. No remaining `from-[#0f1117]` or hardcoded fade `<div>` for these strips.
- `npm run build` passes.
- `npm test` passes.
- `react-doctor` score ≥ 75.
- README.md updated.
- One git commit per the executor rule.

