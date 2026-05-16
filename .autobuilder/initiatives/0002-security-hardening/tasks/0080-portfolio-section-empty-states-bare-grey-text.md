---
id: gooddollar-l2-portfolio-section-empty-states-bare-grey-text
title: "Portfolio Sections — Replace Bare Grey-Text Empty States in Stocks/Predictions/Perps With Iconified, Action-Oriented Empty States"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
priority: P3
labels: [frontend, portfolio, polish, empty-state, visual-quality, ui]
---

# Portfolio Sections — Replace Bare Grey-Text Empty States

> Scope note: This is a frontend visual-polish defect filed under the Phase 1
> initiative because `goodswap.goodclaw.org/portfolio` is the user-facing
> aggregate of every protocol the QA Bot exercises (Swap, Stocks, Predict,
> Perps, Lend) per the project context. Until users actually deposit and trade,
> this is the page they look at first — and the current empty states make it
> look unfinished even when the underlying protocols all work. Priority P3
> because no on-chain logic, Foundry test, or Slither finding is affected;
> only perceived production polish changes.

## Problem statement

`/portfolio` has three section cards — **Stocks**, **Predictions**, and
**Perpetual Futures** — that, for any user without holdings in that protocol,
each render a single line of dim grey text inside an otherwise empty card:

```
┌─ Stocks ─────────────────── View All → ┐
│                                          │
│            No stock holdings             │
│                                          │
└──────────────────────────────────────────┘

┌─ Predictions ────────────── View All → ┐
│                                          │
│         No prediction positions          │
│                                          │
└──────────────────────────────────────────┘

┌─ Perpetual Futures ──────── View All → ┐
│                                          │
│         No open perps positions          │
│                                          │
└──────────────────────────────────────────┘
```

This is the **default state** for every newly connected wallet (and every
visitor on `goodswap.goodclaw.org` who connects but hasn't traded yet).
Compare to:

- **GoodLend** card on the same page (rendered by `PortfolioOnChain`) which
  has a polished mock-data banner and a structured layout, and
- **Connect Wallet** banner on the same page which uses an icon, gradient
  background, and a clear CTA.

The bare `<p className="text-sm text-gray-500 py-4 text-center">No X</p>`
treatment looks unfinished next to the surrounding chrome. There is no
visual hint that the section is intentional, no icon, no CTA back to the
protocol page, and no consistency between the three sections (the wording is
even slightly different: "No stock holdings", "No prediction positions",
"No open perps positions").

Captured during iteration #38 visual-polish review at
`/tmp/iter38-screenshots/portfolio.png` against the live deployment
`https://goodswap.goodclaw.org/portfolio`.

## Root cause

`frontend/src/app/(app)/portfolio/page.tsx` renders three near-identical
empty-state branches at lines 84–85, 144–145, and 187–188:

```tsx
{stockHoldings.length === 0 ? (
  <p className="text-sm text-gray-500 py-4 text-center">No stock holdings</p>
) : ( /* … */ )}

{predictPositions.length === 0 ? (
  <p className="text-sm text-gray-500 py-4 text-center">No prediction positions</p>
) : ( /* … */ )}

{perpsPositions.length === 0 ? (
  <p className="text-sm text-gray-500 py-4 text-center">No open perps positions</p>
) : ( /* … */ )}
```

The project does not yet have a reusable `<EmptyState />` primitive in
`frontend/src/components/ui/`, but the existing visual language on the
portfolio page (rounded cards, gradient icon halos, ghost CTA buttons) is
clear and consistent. The fix is to introduce a small shared `EmptyState`
component and use it in all three spots, with section-appropriate copy and a
"Browse Stocks" / "Explore Markets" / "Open a Position" CTA linking back to
the relevant protocol entry point — turning a dead-end card into a productive
one.

## Impact

- First-impression of `/portfolio` for a newly connected wallet looks
  half-built: three otherwise-empty cards with one dim grey sentence each.
- Reduces conversion to first trade — there is currently no in-card path from
  "I have nothing in Stocks" to "Browse stocks". Users have to know to use
  the existing **View All** link in `SectionHeader`, which reads as "view all
  holdings" not "go discover stocks".
- Inconsistency across the three identical-shaped cards: copy differs
  ("holdings" vs "positions" vs "open positions"), no icon, no action.
- No on-chain or test consequence; this is purely a copy/layout improvement.

## Acceptance criteria

1. A new `<EmptyState />` component exists at
   `frontend/src/components/ui/empty-state.tsx` with the following API:
   ```tsx
   interface EmptyStateProps {
     icon: ReactNode
     title: string
     description?: string
     action?: { label: string; href: string }
     className?: string
   }
   ```
   Visual treatment matches the rest of the portfolio page: rounded layout,
   subtle icon halo (gradient circle background like the existing stock-ticker
   bubbles), ghost-style CTA when `action` is provided.
2. The component is exported from `frontend/src/components/ui/index.ts`
   alongside `SummaryCard` and `SectionHeader` so future empty states can
   reuse it.
3. The Stocks empty branch in `portfolio/page.tsx` is replaced with:
   ```tsx
   <EmptyState
     icon={/* small chart-up SVG, matching existing section icon */}
     title="No stock holdings yet"
     description="Synthetic stocks let you trade exposure to AAPL, TSLA, and more."
     action={{ label: 'Browse Stocks', href: '/stocks' }}
   />
   ```
4. The Predictions empty branch is replaced with an `EmptyState` titled
   "No prediction positions" with a description (e.g. "Bet on real-world
   outcomes — sports, crypto, politics.") and an action linking to
   `/predict`.
5. The Perps empty branch is replaced with an `EmptyState` titled "No open
   perps positions" with a description (e.g. "Trade BTC, ETH, and more with
   up to 50× leverage.") and an action linking to `/perps`.
6. All three CTAs render as ghost buttons consistent with the existing
   `Button` variants (no new variant is introduced — reuse what's there).
7. Spacing / typography matches the rest of the portfolio cards: the empty
   state should not look more or less prominent than a single position row
   would in the same card.
8. Connected user with at least one holding in **any** of the three sections
   sees the same UI as today (no regression on populated cards).
9. No props drilling, no global state changes; the component is purely
   presentational.

## Out of scope

- Changing the connected/disconnected detection logic or the existing
  `ConnectWalletEmptyState` / `ConnectWalletBanner` components — those handle
  the page-level disconnected case and remain untouched.
- The GoodLend card (rendered by `PortfolioOnChain.tsx`) — it already has
  its own polished empty state and mock-data banner. Out of scope for this
  task.
- Other pages with bare empty states (Activity recent-transactions list,
  Perps Open Positions panel, etc.) — those can adopt the same `EmptyState`
  primitive in follow-up tasks once it lands.
- Visual redesign of `SectionHeader` or the surrounding card chrome.
- Animations, transitions, or skeleton states.

## Files likely to change

- `frontend/src/components/ui/empty-state.tsx` — **new file**, ~50 lines.
- `frontend/src/components/ui/index.ts` — add export.
- `frontend/src/app/(app)/portfolio/page.tsx` — replace three `<p>` branches
  with `<EmptyState />` calls (~20 lines net change).

## Verification

1. Manual: open `/portfolio` while disconnected — `ConnectWalletEmptyState`
   still wraps the whole page (unchanged).
2. Manual: connect a fresh wallet on chain 42069 with no holdings — the three
   section cards now show iconified empty states with working "Browse
   Stocks", "Explore Markets", "Open a Position" CTAs.
3. Manual: deposit into one section (e.g. mint a synthetic stock) — that
   section's empty state disappears and the populated row renders as before.
   The other two sections still show the new empty state.
4. Manual: click each CTA — verify navigation lands on the correct protocol
   page.
5. `npm test` in `frontend/` — existing portfolio tests pass; add a single
   render test for `EmptyState` itself (renders title, description, optional
   action).
6. `react-doctor` score ≥ 75 with no new errors.

## Planning

### Research notes

- The three identical empty-state branches confirmed at
  `frontend/src/app/(app)/portfolio/page.tsx` lines 84–85, 144–145,
  187–188, all using
  `<p className="text-sm text-gray-500 py-4 text-center">No X</p>`.
- `frontend/src/components/ui/` directory listing shows `summary-card.tsx`,
  `price-display.tsx`, `button.tsx`, `section-header.tsx`, `sparkline.tsx`,
  etc. — but no `empty-state.tsx`. There is no `index.ts` barrel currently
  re-exporting these (each is imported by direct path), so I will follow
  the prevailing pattern: ship `empty-state.tsx` and import it via direct
  path. **Revised AC #2:** drop the requirement to add to a non-existent
  `index.ts` — direct imports are project convention.
- `Button` component (`frontend/src/components/ui/button.tsx`) supports a
  `variant` prop including `'ghost'` per existing call sites in the
  portfolio page. Reuse that for the CTA.
- Sibling component `ConnectWalletEmptyState` in
  `frontend/src/components/wallet/` already establishes the visual idiom for
  empty states on this page (icon halo + title + description + CTA). The
  new `EmptyState` should match that idiom but be generic and section-sized
  (smaller padding) rather than page-sized.
- Section-icon SVGs already exist inline in `portfolio/page.tsx` for each
  section header (chart-up for Stocks, bar-chart for Predictions,
  trending-up for Perps). The empty state can reuse the **same** SVG paths
  to keep visual coherence with the section header.
- No existing portfolio test asserts the literal "No stock holdings" string,
  but I'll grep before changing copy. If a test does, update the test
  alongside the copy.

### Architecture

```mermaid
flowchart TD
  A[portfolio/page.tsx] -->|stockHoldings.length === 0| B[EmptyState — Stocks]
  A -->|predictPositions.length === 0| C[EmptyState — Predictions]
  A -->|perpsPositions.length === 0| D[EmptyState — Perps]

  B --> E[ui/empty-state.tsx]
  C --> E
  D --> E

  E -->|reuses| F[ui/button.tsx — variant='ghost']

  B -->|action.href| G[/stocks]
  C -->|action.href| H[/predict]
  D -->|action.href| I[/perps]

  classDef new fill:#1f3a1f,stroke:#4ade80,color:#fff;
  class E new;
```

`EmptyState` is a single new pure-presentational component. It is consumed
in three sibling spots in one file. CTAs link to existing protocol entry
pages — no new routes.

### One-week decision

**YES** — one new ~50-line presentational component, three call-site
replacements in a single file, no state, no data fetching, no API contracts.
Estimated 1–2 hours including a render test for `EmptyState`. `split: false`.

### Implementation plan

1. **Create** `frontend/src/components/ui/empty-state.tsx`. Component
   signature per AC #1:
   ```tsx
   interface EmptyStateProps {
     icon: ReactNode
     title: string
     description?: string
     action?: { label: string; href: string }
     className?: string
   }
   ```
   Layout: vertical stack, centered. Icon rendered inside a 40×40 rounded
   gradient halo (`bg-gradient-to-br from-goodgreen/20 to-goodgreen/5
   border border-goodgreen/15`) matching the existing portfolio bubbles.
   Title in `text-sm font-medium text-white`. Description in
   `text-xs text-gray-400`. Action rendered as a `<Link>` wrapped around
   `<Button variant="ghost" size="sm">…</Button>` so the CTA is a real
   navigation, not a button-styled `<a>`. Padding: `py-6` (one extra unit
   over the current `py-4` of bare text — avoids the empty card looking
   smaller than a populated card with one row).
2. **Add a render test** at `frontend/src/components/ui/empty-state.test.tsx`
   (or in the test convention used by sibling components — verify by
   reading one neighboring `.test.tsx`): renders title, optional
   description, optional action with correct href.
3. **Edit** `frontend/src/app/(app)/portfolio/page.tsx`:
   - Add `import { EmptyState } from '@/components/ui/empty-state'`.
   - Replace the three `<p>` empty-state branches with `<EmptyState … />`
     calls. Reuse the existing inline SVGs from each `SectionHeader` as
     the `icon` prop (extract them into local consts at the top of the
     component, or inline — the file is already verbose, prefer inline).
   - Copy:
     - Stocks: title `"No stock holdings yet"`, description `"Synthetic
       stocks let you trade exposure to AAPL, TSLA, and more."`, action
       `{ label: 'Browse Stocks', href: '/stocks' }`.
     - Predictions: title `"No prediction positions"`, description
       `"Bet on real-world outcomes — sports, crypto, politics."`, action
       `{ label: 'Explore Markets', href: '/predict' }`.
     - Perps: title `"No open perps positions"`, description `"Trade BTC,
       ETH, and more with up to 50× leverage."`, action `{ label: 'Open a
       Position', href: '/perps' }`.
4. **Verify** populated cards still render correctly: connect a wallet on
   chain 42069 and ensure at least one synthetic stock holding is present;
   confirm the populated branch is untouched.
5. **Tests:** run `npm test` in `frontend/`. Add the new EmptyState render
   test. Existing portfolio tests pass.
6. **react-doctor:** `npx -y react-doctor@latest . --verbose --diff` from
   project root. Target score ≥ 75; commit only if ≥ 50.
7. **README:** update `Updated:` date and increment commit count.
8. **Commit:** `git commit -m "Portfolio — replace bare empty states with
   EmptyState component (Stocks/Predictions/Perps)"`. No `git push`.
