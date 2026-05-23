---
id: 0007d-stocks-search-empty-state-renders-full-untruncated-query
title: "Stocks search empty-state ('No matches for \"…\"') renders the full untruncated query verbatim — long inputs blow up the empty-state cell and stretch the page on narrow viewports"
parent: 0007d-app-integration
deps: []
split: false
depth: 1
planned: true
executed: true
---

## Planning notes

### Overview

Small UX hygiene pass on the `/stocks` Browse table empty-state. Today
the empty-state copy reads `"No matches for "{searchQuery}"."` where
`searchQuery` is interpolated raw — a 128-character `Z`-run blows up
the cell visually, and a `<script>…</script>` string (correctly
escaped) still gets a distracting red spell-check underline.

Three small fixes, all surgical:

1. Add a tiny `truncateQuery` helper:
   `q.length <= 24 ? q : q.slice(0, 24) + '…'`.
2. Render the empty-state copy as
   `"No matches for "{truncateQuery(searchQuery)}"."` in **both**
   the desktop empty-TD branch and any mobile empty-card branch (if a
   separate branch exists).
3. Add `spellcheck="false"` and Tailwind `break-all` to the
   empty-state span so even bypassed long runs wrap.
4. Sweep any other call sites in `stocks/page.tsx` that interpolate
   raw `searchQuery` into chips/captions (e.g. `Search: {q} ×`) and
   apply the same truncation.

### Research notes

- `frontend/src/app/(app)/stocks/page.tsx` line ~313 contains the
  current `No matches for "${query.trim()}".` interpolation (confirmed
  via Grep in this planning round). It's a single match, but the
  executor sweeps for any other `{searchQuery}` interpolations in
  surrounding UI text (active filter chip row, etc.).
- `MAX_SEARCH_LEN = 128` already caps the input — the truncation
  helper only needs to handle ≤128-char inputs sensibly.
- The chosen cap `24` is a UX call from the PRD — long enough that any
  realistic ticker or company name fits unchanged, short enough to
  comfortably fit in a single empty-state line on a 320-px mobile
  viewport.
- The helper is a pure string function — easy unit test, no React
  required.

### Assumptions

- The "mobile empty-card branch" may not exist as a separate render
  path in `stocks/page.tsx`. The executor verifies at implementation
  time; if there's only one empty-state render path the PRD's
  "BOTH desktop and mobile" requirement is satisfied by a single edit.
- The Unicode ellipsis `…` is locale-neutral and the existing rest of
  the UI uses it already (e.g. `Search stocks…`). No translation hook
  required.

### Architecture

```mermaid
flowchart TD
  Input["Search input<br/>(maxlength=128)"] --> Q["searchQuery state"]

  subgraph helper["frontend/src/lib/truncateQuery.ts (new)"]
    F["truncateQuery(q, max=24)"]
  end

  Q --> F
  F --> EmptyTd["Desktop empty-TD render<br/>'No matches for \"…\"'<br/>spellcheck=false · break-all"]
  F --> ChipRow["Active filter chip<br/>'Search: {q} ×' (if present)"]
  F --> EmptyCard["Mobile empty-card render<br/>(if separate branch exists)"]

  subgraph tests["tests"]
    UT["truncateQuery.test.ts<br/>short/exact/long/HTML inputs"]
    IT["long-search-empty-state.test.tsx<br/>128 Z's → truncated copy<br/>spellcheck=false attribute"]
  end

  F -.tested by.-> UT
  EmptyTd -.tested by.-> IT
```

### One-week decision

**YES** — half a day at most. Pure string helper + a single attribute
flip + one unit test + one integration test. The helper has five
unambiguous unit-test cases enumerated in the PRD.

### Implementation plan

**Phase 1 — Failing unit + integration tests (TDD).**
1. Add `frontend/src/lib/__tests__/truncateQuery.test.ts`:
   - 5-char input → unchanged.
   - 24-char input → unchanged.
   - 25-char input → truncated to 24 + `…`.
   - 128 `Z`s → `ZZZZZZZZZZZZZZZZZZZZZZZZ…`.
   - HTML-like input `<script>alert(1)</script>` → preserved literally
     (the React layer handles escaping, not this helper).
2. Add `frontend/src/app/(app)/stocks/__tests__/long-search-empty-state.test.tsx`:
   - Renders the page.
   - Types 128 `Z`s into the search input.
   - Asserts the empty-state copy contains
     `'No matches for "ZZZZZZZZZZZZZZZZZZZZZZZZ…"'` and does **not**
     contain the full 128 `Z`s.
   - Asserts the empty-state span has `spellcheck="false"`.

**Phase 2 — Add helper.**
3. Create `frontend/src/lib/truncateQuery.ts` exporting
   `truncateQuery(q: string, max = 24): string` with the
   `q.length <= max ? q : q.slice(0, max) + '…'` implementation.
   Unit test passes.

**Phase 3 — Wire helper into the page.**
4. In `frontend/src/app/(app)/stocks/page.tsx`:
   - Import `truncateQuery`.
   - Replace the empty-state interpolation
     `` `No matches for “${query.trim()}”.` ``
     with
     `` `No matches for “${truncateQuery(query.trim())}”.` ``
   - Add `spellcheck="false"` and `className+="… break-all"` to the
     surrounding `<span>`.
   - If a separate mobile empty-card branch exists, apply the same
     edits there.
   - Sweep for any active-filter chip interpolation
     (`Search: {q} ×`) and wrap with `truncateQuery`.

**Phase 4 — Verification.**
5. `cd frontend && npm run test -- stocks truncate` passes (existing +
   new tests green). `search-resilience.test.tsx` stays green.
6. `cd frontend && npm run lint` passes for changed files.
7. Restart dev server, drive `/stocks` with `agent-browser`, fill the
   search input with 128 `Z`s, screenshot. Repeat with
   `<script>alert(1)</script>`. Save under
   `.autobuilder/initiatives/0007d-app-integration/review-screenshots/`.

## Problem statement

The `/stocks` Browse table renders a centred empty state when the
search query yields zero matches:

```
"No matches for “{searchQuery}”. Clear search"
```

The query is the raw user input — there is no truncation, ellipsis, or
length cap on display. Typed inputs up to the search field's
`maxlength` (currently 128 characters, see `MAX_SEARCH_LEN` in
`stocks/page.tsx`) round-trip into the empty state, where they:

1. Render a single long string of repeating glyphs that takes ~600 px of
   horizontal space on the desktop layout.
2. On narrower viewports (≤ 640 px mobile cards), the same string flows
   inside the `text-center` cell and forces the table card to grow
   beyond the page width or wraps awkwardly into 4–6 lines of
   identical letters.
3. With special characters (`<script>alert(1)</script>` etc.) the text
   is correctly React-escaped, but spell-check underlines it with a
   distracting red wavy line because the empty-state span is not
   `spellcheck="false"`. Combined with the long string it looks like
   the page is broken.

Observed during this iteration:

- Filled the search input with 128 `Z` characters via
  `agent-browser fill`.
- Screenshot:
  `.autobuilder/initiatives/0007d-app-integration/review-screenshots/16-stocks-long-search.png`.
  The empty-state cell reads
  `"No matches for “ZZZZ…ZZZZ”."` for ~600 px of unbroken text.
  Even though the cell technically fits inside the table container
  (959 px wide on this viewport), the visual effect dominates the
  page.
- Filled with `<script>alert(1)</script>`:
  `…/review-screenshots/23-stocks-xss-search.png`.
  Text is escaped (good, not exploitable) but underlined with a red
  spell-check wave because the span has no `spellcheck` attribute.

The lane-4 spec asks us to "preserve existing UX but make
source/timestamp explicit". The current empty-state is the opposite —
it lets unbounded user input dominate the layout and undermine the
trust signals (source badges, market-closed pill) around it.

## User story

> As a user typing a long or unusual search string into the stocks
> search, I want the empty-state to acknowledge my query without
> letting it visually dominate the table — show a sensible truncated
> echo, escape any markup, and never blow up the table card width.

## How it was found

Strategy: edge-cases iteration — special characters, very long strings.

1. Opened `/stocks` in `agent-browser`.
2. `agent-browser fill @e14 "ZZZ…ZZZ"` (128 Z's, max the search
   field accepts).
3. Captured full-page screenshot at
   `.autobuilder/initiatives/0007d-app-integration/review-screenshots/16-stocks-long-search.png`.
4. Confirmed via `getBoundingClientRect()` that the empty-state TD has
   `width: 959.5px` while the viewport is 1280 px — the text fits but
   visually dominates because it's a single unbroken run.
5. Filled with `<script>alert(1)</script>`. React correctly escapes the
   characters, but Chrome's spellcheck underlines the literal text
   because the span lacks `spellcheck="false"`. Screenshot at
   `…/review-screenshots/23-stocks-xss-search.png`.
6. Confirmed the desktop and mobile branches both render the raw
   `searchQuery` (`{searchQuery}` interpolation in
   `stocks/page.tsx`).

## Proposed UX

Small, surgical, no new components.

1. **Truncate the echoed query in the empty-state copy.**
   - Add a tiny helper next to the existing format helpers (or inline
     in the call site) that returns
     `q.length <= 24 ? q : q.slice(0, 24) + '…'`.
   - The empty state renders:
     `"No matches for “{truncated}”."`
     where `truncated = ellipsisTruncate(searchQuery, 24)`.
   - The full raw query is still available to the user — it's already
     in the search input box at the top of the page.

2. **Apply to BOTH the desktop table row AND the mobile card view.**
   Currently both branches render `{searchQuery}` raw.

3. **Spell-check + word-break hygiene.**
   - The empty-state span gets
     `spellcheck="false"` and
     `className="break-all"` (Tailwind utility) so that even if a user
     somehow bypasses the truncation, a run of `ZZZ`-style characters
     wraps inside the cell instead of stretching it.

4. **Keep the existing "Clear search" link.**
   - It already exists right below the copy. No change.

5. **Mobile mover panel + active filter chip row.**
   - Sweep for any other places in `stocks/page.tsx` that interpolate
     raw `searchQuery` into UI text (e.g. an active-filter chip
     `Search: {searchQuery} ×`) and apply the same truncation.

## Acceptance criteria

- The `No matches for "…"` copy in `frontend/src/app/(app)/stocks/page.tsx`
  (desktop empty TD and mobile empty-card branch) wraps the query
  through an ellipsis-truncate helper at `length <= 24`.
- The empty-state span carries `spellcheck="false"` and
  Tailwind class `break-all` (or equivalent inline style) so long
  unbroken runs wrap inside the cell.
- Any active-filter chip that shows the search term (e.g.
  `Search: {q} ×`) uses the same truncation.
- New unit test
  `frontend/src/lib/__tests__/truncateQuery.test.ts` (or inline if the
  helper lives in the page file) covers:
  - Short query (5 chars) → unchanged.
  - Exactly 24 chars → unchanged.
  - 25 chars → truncated to 24 + `…`.
  - 128 chars of `Z` → `ZZZZZZZZZZZZZZZZZZZZZZZZ…`.
  - HTML-like chars → preserved literally (no double-escape).
- New integration test
  `frontend/src/app/(app)/stocks/__tests__/long-search-empty-state.test.tsx`:
  - Renders the page.
  - Types 128 `Z` characters into the search input.
  - Asserts the empty-state copy contains
    `'No matches for "ZZZZZZZZZZZZZZZZZZZZZZZZ…"'` and **does not**
    contain 128 `Z`s.
  - Asserts the empty-state span has `spellcheck="false"`.
- Existing `search-resilience.test.tsx` passes unchanged.

## Verification

- `cd frontend && npm run test -- stocks truncate` passes.
- `cd frontend && npm run lint` passes for changed files.
- Restart dev server, open `/stocks` with `agent-browser`, fill the
  search input with 128 `Z`s, screenshot.
- Expected: empty-state reads
  `"No matches for "ZZZZZZZZZZZZZZZZZZZZZZZZ…". Clear search"`
  — single line, fits comfortably inside the empty-state cell, no
  spell-check underline.
- Repeat with `<script>alert(1)</script>` — text is escaped (as today)
  and no spell-check underline visible.
- Save screenshots to
  `.autobuilder/initiatives/0007d-app-integration/review-screenshots/`.

## Out of scope

- Lowering the search input's `maxlength` (a separate UX concern; the
  current 128 is fine).
- Adding "did you mean?" / fuzzy suggestion logic.
- Reworking the search component itself (debounce, async, etc.).
- Adding the same truncation pattern to other surfaces (Predict
  search, etc.) — separate task if those exhibit the same problem.
- Localising the truncation glyph (`…`) — single Unicode ellipsis is
  locale-neutral.
