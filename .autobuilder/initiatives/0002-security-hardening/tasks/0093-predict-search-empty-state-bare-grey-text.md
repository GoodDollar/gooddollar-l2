---
id: gooddollar-l2-predict-search-empty-state-bare-grey-text
title: "Predict — Replace Bare Grey 'No markets found' Empty State With Iconified, Action-Oriented Recovery"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P2
labels: [frontend, predict, edge-case, empty-state, ux-polish]
---

# Predict — Replace Bare Grey "No markets found" Empty State With Iconified, Action-Oriented Recovery

## Overview (planner)

Single-file edit in `frontend/src/app/(app)/predict/page.tsx`
(lines 553–557). Replace the flat
`"No markets found / Try adjusting your search or filters"` block with a
small iconified empty state that:

- Echoes the user's actual `query` (or active `category`) in white so the
  user sees what they searched for.
- Offers a **"Clear search"** button (visible when `query.trim() !== ''`)
  that calls `setQuery('')`.
- Offers a **"Show all categories"** button (visible when
  `category !== 'All'`) that calls `setCategory('All')`.
- Uses the `SearchX` lucide icon for consistent visual signal.

This is the analogous fix to task #0084 (which fixed the same pattern on
`/explore`) and #0080 (Portfolio empty states). The pattern is well
established in the codebase.

## Edge case observed

During iteration #47 edge-case review, navigating to
`http://localhost:3100/predict`, typing a non-existent query like
`"xyz_no_match_query_zzz"`, or clicking a category like `"Culture"` that
has no markets, surfaces a bare grey "No markets found" state with no
recovery action — the user is stuck and has to manually clear the search
input or click the "All" chip. The featured hero market also disappears
in this state because the search applies to the whole grid via
`filterAndSortMarkets`, leaving the user with a dead-zone page.

## Research notes

- `lucide-react` is already a frontend dep (used by Explore in 0084 and
  Portfolio in 0080) — no new packages.
- State helpers `setQuery` and `setCategory` already exist in scope at
  the call site (lines 514, 537–545), so the buttons are pure UI wiring.
- The empty-state markup sits inside a flex column ancestor, no table
  cell constraints — no `<td colSpan>` issue.
- `filtered.length === 0` is the only branch that triggers this empty
  state (line 553), so the new component fully replaces the existing two
  `<p>` tags.
- Existing test file `frontend/src/app/(app)/predict/__tests__/empty-grid.test.tsx`
  asserts on the `"No markets found"` string at line 117 — must keep
  that string intact in the new markup so the existing test continues to
  pass. The new buttons are additive.

## Architecture

```mermaid
flowchart TD
  Search[Search input + Category chips] --> Filter{filtered.length}
  Filter -- ">0" --> Grid[MarketCard grid]
  Filter -- 0 --> Empty["EmptyState block"]
  Empty --> Icon[SearchX icon]
  Empty --> Msg{query.trim()?}
  Msg -- yes --> Echo["No markets match \"{query}\""]
  Msg -- no --> Cat{category !== All?}
  Cat -- yes --> CatMsg["No markets in {category}"]
  Cat -- no --> Default["No markets found"]
  Empty --> Actions{Recovery}
  Actions --> Clear["Clear search → setQuery('')"]
  Actions --> Reset["Show all → setCategory('All')"]
```

## One-week decision

**Yes, in scope.** Single-file React-only edit, ~30 LOC, mirrors a
proven pattern (0084) the same agent shipped two iterations ago. No new
deps, no test reflow, no API changes. ~25-minute task.

## Implementation steps

1. Add `SearchX` to the existing `lucide-react` import at the top of
   `frontend/src/app/(app)/predict/page.tsx` (it shares an import line
   with other lucide icons used in the page).
2. Replace the block at lines 553–557 with a new flex-column block that:
   - Renders a `SearchX` icon (32px, `text-gray-500`, centered).
   - Renders a heading line that branches on `query.trim()` and `category`:
     - If `query.trim()`: `No markets match "<span class="text-white">{query}</span>"`
     - Else if `category !== 'All'`: `No markets in <span class="text-white">{category}</span>`
     - Else: `No markets found` (kept verbatim for test compat).
   - Renders the existing helper line `Try adjusting your search or filters` underneath in `text-gray-600 text-xs`.
   - Renders a flex row of buttons:
     - "Clear search" if `query.trim() !== ''` → `onClick={() => setQuery('')}`
     - "Show all categories" if `category !== 'All'` → `onClick={() => setCategory('All')}`
   - Use the same `bg-goodgreen/10 text-goodgreen border border-goodgreen/20 hover:bg-goodgreen/20` button styling as task 0084.
3. Wrap the whole thing in the existing
   `bg-dark-100 rounded-2xl border border-gray-700/20 py-12 text-center`
   container (slightly reduce vertical padding from `py-16` to `py-12`
   because the icon + buttons take more space).
4. Keep the literal string `"No markets found"` reachable in the
   default branch so the existing
   `predict/__tests__/empty-grid.test.tsx` "still shows the existing
   No markets found empty state" assertion keeps passing.
5. Run `react-doctor` and confirm score ≥ 75 before committing.
6. Update README.md (commit count, Updated: date).

## Verification

- Visit `/predict`, search for `"zzz_no_match_zzz"` → see iconified
  empty state with echoed query and "Clear search" button. Click
  button — search clears, grid repopulates.
- Visit `/predict`, click `Culture` category (assuming no Culture
  markets exist on devnet) → see "No markets in Culture" with "Show
  all categories" button. Click button — full grid returns.
- Confirm `pnpm --filter frontend test predict/__tests__/empty-grid` (or
  the project's equivalent vitest invocation) still passes — the
  `"No markets found"` default-branch text must remain reachable.
- Confirm no overlap or layout shift at mobile widths (375px) and
  desktop (1280px).

## Out of scope

- Changing the featured-hero behavior in this empty branch — that's
  task 0072's territory.
- Auto-clearing the search field when a category is clicked — separate
  UX decision, not edge-case relevant.
- Touching the `predict/portfolio/page.tsx` empty state ("No markets
  pending resolution") — that's a different empty state with a different
  intent (no actions available; just informational).
