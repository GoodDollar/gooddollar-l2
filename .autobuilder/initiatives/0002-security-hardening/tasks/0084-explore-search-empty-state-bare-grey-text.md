---
id: gooddollar-l2-explore-search-empty-state-bare-grey-text
title: "Explore — Replace Bare Grey 'No tokens match' Empty State With Iconified, Action-Oriented Recovery"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P2
labels: [frontend, explore, error-handling, empty-state, ux-polish]
---

# Explore — Replace Bare Grey "No tokens match" Empty State With Iconified, Action-Oriented Recovery

## Overview (planner)

Single-file edit in `frontend/src/app/(app)/explore/page.tsx`
(the inner client component around lines 606–611). Replace the
flat `"No tokens match your search"` cell with a small iconified
empty state that:

- Echoes the user's actual query (or category) in white.
- Offers a "Clear search" and/or "Show all tokens" button that
  resets `query` / category state and the URL.
- Uses the SearchX lucide icon for visual signal.

Same pattern previously used for the Portfolio empty states in task
#0080, applied to the Explore table.

## Research notes

- `lucide-react` is already a frontend dep — no new packages.
- State helpers `setQuery` and `handleCategoryClick('All')` already
  exist in the component, so the buttons are pure UI wiring.
- The empty-state cell sits inside a `<tbody>` with `colSpan={10}`
  so any new markup must remain inside the single `<td>`.
- No existing unit test directly asserts on the old string (verified
  via grep) but `react-doctor` will catch obvious regressions.

## Architecture

```mermaid
flowchart TD
  Search[Search input + Category chips] --> Filter{filtered.length}
  Filter -- ">0" --> Rows[TokenRow * N]
  Filter -- 0 --> Empty["EmptyState td"]
  Empty --> Icon[SearchX icon]
  Empty --> Msg{query.trim()?}
  Msg -- yes --> Echo[No tokens match "{query}"]
  Msg -- no --> Cat["No {category} tokens"]
  Empty --> Btns{Active filters?}
  Btns -- query --> Clear[Clear search button]
  Btns -- category --> AllBtn[Show all tokens button]
```

## One-week decision

**YES.** Pure UI change inside one `<td>`. Total edit ~30 lines of
JSX. Well under a day.

## Implementation plan

1. Add `SearchX` to the existing `lucide-react` import in
   `frontend/src/app/(app)/explore/page.tsx`.
2. Replace the empty `<tr>` with the iconified empty-state shown in
   the suggested skeleton below (icon + dynamic message + reset
   buttons). The buttons must use the existing `setQuery` and
   `handleCategoryClick` handlers so URL state stays in sync.
3. Ensure focus styles are visible — use the existing site button
   pattern (`border border-white/10 hover:bg-white/5` with default
   focus ring from the global stylesheet).
4. Manually verify the three cases (query-only, category-only,
   both) on the local Next dev server.
5. `npx react-doctor@latest . --verbose --diff` then commit.

## Problem

When a user searches for a string that matches no tokens on `/explore`
(e.g. typing `asdfqwerzxcvnonsense` in the search box), the table body
collapses to a single row of small grey text:

> No tokens match your search

No icon. No suggestion. No way to clear the search except by manually
deleting the input. The query the user typed is not echoed back, so it
feels like the page silently broke instead of "I searched and found
nothing".

Captured in iteration #41 review:
- `.autobuilder/review-screenshots/iter41/explore-empty-search.png`

This is the same empty-state pattern we already fixed in the Portfolio
sections in task #0080, applied to the Explore table.

## Current code

`frontend/src/app/(app)/explore/page.tsx` lines 606–611:

```tsx
{filtered.length === 0 ? (
  <tr>
    <td colSpan={10} className="py-12 text-center text-gray-500">
      No tokens match your search
    </td>
  </tr>
) : ( ... )}
```

## Fix

1. Echo the user's actual query in the message:
   `No tokens match "asdfqwerzxcvnonsense"`.
2. Add a Lucide search icon above the line (matching the pattern from
   task #0080 — `SearchX` icon, `text-gray-600`, `mx-auto mb-3`).
3. Add a "Clear search" button (and "Clear filter" if a non-`All`
   category is also active) that resets the query/filter to the
   default empty state.
4. Differentiate two empty-state reasons:
   - **Query filtered everything out** → show the search icon +
     "No tokens match \"{query}\"" + "Clear search" button.
   - **Category filtered everything out** (no query, just category) →
     "No {category} tokens available right now" + "Show all tokens"
     button.
   - **Both** → combine both clear actions.
5. The button styling should match the existing `Back to Explore`
   button on `[symbol]/page.tsx` (rounded, goodgreen, white text)
   but smaller — secondary outline style with rounded-lg.

Suggested skeleton:

```tsx
{filtered.length === 0 ? (
  <tr>
    <td colSpan={10} className="py-12 text-center text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <SearchX className="w-10 h-10 text-gray-600" aria-hidden="true" />
        <p className="text-sm">
          {query.trim()
            ? <>No tokens match &quot;<span className="text-white">{query.trim()}</span>&quot;</>
            : `No ${selectedCategory} tokens available right now.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition"
            >
              Clear search
            </button>
          )}
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => handleCategoryClick('All')}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition"
            >
              Show all tokens
            </button>
          )}
        </div>
      </div>
    </td>
  </tr>
) : ( ... )}
```

## Acceptance Criteria

1. Typing a nonsense search on `/explore` shows the SearchX icon,
   echoes the query in white, and renders a "Clear search" button.
2. Clicking "Clear search" sets `query` to `''` and the full table
   renders again.
3. Choosing a category with no tokens (rare, but possible) shows the
   category-specific message and a "Show all tokens" button that
   resets the URL to `/explore`.
4. When BOTH a query and a non-`All` category are active and zero
   tokens match, BOTH buttons appear.
5. The empty-state text is keyboard-accessible — buttons have visible
   focus rings and the icon is marked `aria-hidden="true"`.
6. Existing tests in `frontend/src/app/(app)/explore/__tests__/*` (if
   any) pass; if a test asserts on the old "No tokens match your
   search" copy, update it.
7. `react-doctor` passes with score ≥ 75 and no new violations.

## Non-Goals

- Do **not** change the search input itself.
- Do **not** restructure the table or its sort/filter logic.
- Do **not** add fuzzy-match suggestions ("did you mean…?") — that's
  a separate, larger task.
- Do **not** touch the `[symbol]` "Token Not Found" page (separate
  task #0083 covers that).

## Risk

Low. Single component change in one file. No data, contract, or
routing changes. The icon import (`SearchX`) is already in
`lucide-react`, which is already a dependency.
