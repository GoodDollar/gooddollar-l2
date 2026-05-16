---
id: gooddollar-l2-remove-tests-link-from-user-navigation
title: "Header — Remove Internal Tests/Test-Dashboard Link from User-Facing Navigation"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, header, navigation, production-readiness, fresh-eyes, security-hardening]
---

# Header — Remove Internal Tests/Test-Dashboard Link from User-Facing Navigation

> Note: Filed under Phase 1 (Security Hardening & Production Readiness) because
> production readiness explicitly requires that internal dev/QA surfaces NOT be
> reachable from the user-facing navigation. This was caught by the iteration #32
> fresh-eyes product review — pretending to be a brand-new visitor opening the
> hamburger menu for the first time.

## Problem statement (what a fresh-eyes user sees)

A brand-new visitor lands at `https://goodswap.goodclaw.org`, sees a clean
homepage ("Trade. Predict. Invest. Fund UBI."), and opens the hamburger menu in
the top-right to look around. The menu reads, in order:

```
Swap
Explore
Pool                 [Coming Soon]
Bridge               [Coming Soon]
Stocks
Predict
Perps
Lend
Stable
Yield
Govern
🤖 Agents
🌍 UBI Impact
• Activity
Tests                ← !!!
─────────────────
Portfolio
```

The last item before the divider is **"Tests"**. Clicking it routes to
`/test-dashboard` — an internal QA dashboard for the dev team, not a product
surface intended for end users.

Reproducible:

```bash
# Fresh incognito session
open http://localhost:3100/
# → click hamburger (top-right) → see "Tests" in the menu
# → click "Tests" → land on /test-dashboard (internal QA UI)
```

### Why this matters (fresh-eyes first-impression damage)

A first-time visitor will react to "Tests" in the main nav in one of three ways,
all bad:

1. **"This app isn't finished yet."** — Erodes trust the moment the user opens
   the menu. The product looks under construction.
2. **"What is this — is it for me?"** — Confuses navigation. They click it,
   land on an internal page, and get lost.
3. **"Why is the dev surface public?"** — Sophisticated users (the ones we
   want — they bridge funds and trade) immediately spot the leak and downgrade
   their trust in our operational maturity. This directly contradicts the
   initiative goal of "production readiness."

`Pool` and `Bridge` have proper `[Coming Soon]` badges and are marked as
unavailable. `Tests` has no such gating — it sits in the menu alongside live
product pages with no indication that it's internal.

## Source of the leak

`frontend/src/components/Header.tsx`, lines 242–248:

```tsx
<Link
  href="/test-dashboard"
  onClick={() => setMobileMenuOpen(false)}
  className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
    isTestDashboard ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'
  }`}
>
  Tests
</Link>
```

There is no environment-based gate, no `process.env.NEXT_PUBLIC_SHOW_DEV_NAV`
check, and no role-based hide. The link renders for every visitor in every
environment, including production.

A quick grep confirms only this one entry point exists:

```
$ rg "/tests|/test-dashboard" frontend/src
frontend/src/components/Header.tsx:243:  href="/test-dashboard"
```

The route is still wired (`/test-dashboard` page exists under
`frontend/src/app/test-dashboard/` if present) — so we are not removing the
internal tool, only its public discoverability.

## User story

> As a brand-new visitor to GoodDollar L2, I want the navigation menu to show
> only product pages I can actually use, so that I trust the platform is
> production-ready and don't accidentally land on internal dev tools.

## Proposed UX

**Primary fix — remove the link in production builds.**

1. Replace the unconditional `<Link href="/test-dashboard">Tests</Link>` block
   with a build-time/env-time guard so it does NOT render for end users:
   ```tsx
   {process.env.NEXT_PUBLIC_SHOW_DEV_NAV === '1' && (
     <Link href="/test-dashboard" ...>Tests</Link>
   )}
   ```
   Default is unset → hidden. Developers can set
   `NEXT_PUBLIC_SHOW_DEV_NAV=1` in `frontend/.env.local` to keep the link for
   themselves.

2. Audit `Header.tsx` for any other dev-only routes hiding in the menu and
   apply the same guard. Specifically review:
   - `🤖 Agents` (`/agents`) — is this a user surface or internal?
   - `Yield` (`/yield`) — currently shows "No vaults deployed yet"; if it has
     zero live vaults, gate it behind the same flag OR add a `[Coming Soon]`
     badge consistent with `Pool` and `Bridge`. (See out-of-scope below — not
     required by this task, just call out in the planning notes.)

3. Keep the `/test-dashboard` route itself fully functional. The QA bot and
   internal team continue to use it via direct URL.

4. **No URL leak in HTML.** Confirm the link is not rendered into the static
   HTML at all when the env flag is off (server-side gating, not just
   `display: none`), so view-source or crawler bots also do not see it.

## Acceptance criteria

- [ ] In a default production build (`NEXT_PUBLIC_SHOW_DEV_NAV` unset), the
      hamburger menu does NOT contain "Tests" or any link to `/test-dashboard`.
- [ ] In a dev build with `NEXT_PUBLIC_SHOW_DEV_NAV=1`, the "Tests" link
      still renders and routes to `/test-dashboard`.
- [ ] `view-source:` on the homepage in a production build contains no string
      `test-dashboard` and no string `>Tests<` inside the nav.
- [ ] The `/test-dashboard` route still loads when navigated to directly.
- [ ] Header unit tests (`frontend/src/components/__tests__/Header.test.tsx`
      if present, or create one) cover both env states.
- [ ] No regression to the live `• Activity` indicator (with the pulsing dot)
      or the `🌍 UBI Impact` link, which both legitimately belong in the menu.

## Verification

```bash
# 1. Build in production mode without the flag.
cd frontend
NEXT_PUBLIC_SHOW_DEV_NAV= npm run build
npm run start -- -p 3100 &
curl -s http://localhost:3100/ | grep -c "test-dashboard"   # → 0
curl -s http://localhost:3100/ | grep -c ">Tests<"          # → 0

# 2. Build in dev mode with the flag.
NEXT_PUBLIC_SHOW_DEV_NAV=1 npm run build
npm run start -- -p 3100 &
curl -s http://localhost:3100/ | grep -c "test-dashboard"   # → ≥ 1

# 3. Direct route still works.
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/test-dashboard
# → 200
```

Also: open the homepage in a real browser with the menu open and screenshot
it — the menu should end at `Activity` (with the divider, then `Portfolio`),
with no `Tests` row.

## Out of scope (separate tasks)

- Adding `[Coming Soon]` badges to `Yield` and `🤖 Agents` (filed separately
  if confirmed during planning).
- Re-ordering the menu (Coming-Soon items mixed with live products) — this is
  worth its own UX task but is not required to remove the Tests leak.
- Header icon-row labels (grid / sun / clock / hamburger have no aria-labels
  or tooltips) — separate accessibility/discoverability task.

## Justification for inclusion in security-hardening initiative

The Definition of Done for Phase 1 includes "production readiness." A
user-facing nav that exposes the internal QA dashboard fails that bar — it
visibly signals "this app is still in test" and routes curious users into an
internal-only surface. Removing the link is a one-file, low-risk change that
ships immediate trust improvement, consistent with the initiative's promise
that Phase 1 leaves the product looking and behaving like a production system
before we move on to OP Stack migration in Phase 2.

---

# Planning (added during STEP 2)

## Overview

Single-component fix. `frontend/src/components/Header.tsx` renders an
unconditional `<Link href="/test-dashboard">Tests</Link>` in the mobile
hamburger menu, leaking an internal QA surface to every visitor. Replace
with an env-gated conditional render. Add a Vitest covering both states.
Document the flag in `frontend/.env.example`. Keep the `/test-dashboard`
route itself intact so the dev team and QA bot still reach it via direct
URL.

## Research notes

- Source confirmed at `frontend/src/components/Header.tsx` lines 242–248.
- `rg "/tests|/test-dashboard" frontend/src` returns only one nav entry
  (Header.tsx) — no other public links.
- Next.js evaluates `process.env.NEXT_PUBLIC_*` at build time and inlines
  the value into client bundles. An `===` comparison removes the branch
  entirely when the flag is unset, so the link does not appear in
  view-source.
- `frontend/.env.example` exists at the project root; documenting the
  new flag there is the project convention.
- No tests currently exist for Header.tsx mobile menu (or are minimal —
  to be confirmed during execution); the task will add coverage.

## Assumptions

- Default behaviour is "hidden" — only developers who explicitly set
  `NEXT_PUBLIC_SHOW_DEV_NAV=1` in `.env.local` see the link. No build
  pipeline currently sets this flag.
- The PM2-managed Next.js process (`goodswap`) loads env from
  `frontend/.env.local` and `frontend/.env` at build time. After this
  change, the build will need a restart to pick up the new branch.
- Adding `[Coming Soon]` badges to `Yield` / `🤖 Agents` is explicitly
  out of scope per the task body (separate tasks).

## Architecture

```mermaid
flowchart LR
  Env[process.env.NEXT_PUBLIC_SHOW_DEV_NAV] -->|inlined at build| Header[Header.tsx mobile menu]
  Header -->|flag === '1'?| Branch{render?}
  Branch -->|yes - dev only| Link[Link Tests --> /test-dashboard]
  Branch -->|no - default + production| Hidden[Nothing rendered]

  Route[/test-dashboard route] -->|still reachable via direct URL| QABot[QA bot + dev team]
```

## One-week decision

**YES** — ~0.5 day of focused work.

- 0.1 day: Header.tsx conditional + `.env.example` docs.
- 0.2 day: Header Vitest covering both env states.
- 0.1 day: build verification + curl checks.
- 0.1 day: react-doctor + commit.

## Implementation plan (phased)

### Phase A — Gate the link (~0.1 day)

1. Open `frontend/src/components/Header.tsx`. Locate the `<Link
   href="/test-dashboard">Tests</Link>` block (lines 242–248) and any
   sibling `isTestDashboard` highlight reference.
2. Wrap with an env check at module scope (so the branch is statically
   resolvable at build time):
   ```tsx
   const SHOW_DEV_NAV = process.env.NEXT_PUBLIC_SHOW_DEV_NAV === '1'
   // ...inside the menu...
   {SHOW_DEV_NAV && (
     <Link
       href="/test-dashboard"
       onClick={() => setMobileMenuOpen(false)}
       className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
         isTestDashboard ? 'text-white font-medium bg-dark-50/50' : 'text-gray-400 hover:text-white'
       }`}
     >
       Tests
     </Link>
   )}
   ```
3. If `isTestDashboard` is derived from `usePathname()` and would
   otherwise be unused when `SHOW_DEV_NAV` is false, gate the
   computation too (or accept the no-op as the cost of keeping the
   diff minimal — preferred).

### Phase B — Document the flag (~0.05 day)

1. Add to `frontend/.env.example` (create if missing):
   ```
   # When set to '1', the mobile nav exposes the internal Tests link
   # routing to /test-dashboard (the QA dashboard). Leave unset in
   # production. See .autobuilder/initiatives/0002-security-hardening/
   # tasks/0070-remove-tests-link-from-user-navigation.md
   NEXT_PUBLIC_SHOW_DEV_NAV=
   ```

### Phase C — Test (~0.2 day)

1. Create or extend `frontend/src/components/__tests__/Header.test.tsx`.
   Use Vitest's ability to stub `process.env` per test:
   ```ts
   import { render, screen } from '@testing-library/react'
   import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'

   describe('Header mobile menu Tests link gate', () => {
     const orig = process.env.NEXT_PUBLIC_SHOW_DEV_NAV
     afterEach(() => { process.env.NEXT_PUBLIC_SHOW_DEV_NAV = orig })

     it('hides Tests link when flag unset', () => {
       process.env.NEXT_PUBLIC_SHOW_DEV_NAV = ''
       // render Header with menu open
       expect(screen.queryByRole('link', { name: /tests/i })).toBeNull()
     })

     it('shows Tests link when flag === "1"', () => {
       process.env.NEXT_PUBLIC_SHOW_DEV_NAV = '1'
       // ...
       expect(screen.getByRole('link', { name: /tests/i })).toHaveAttribute('href', '/test-dashboard')
     })
   })
   ```
   Note: because Next.js inlines `process.env.NEXT_PUBLIC_*` at build
   time, the test approach is to compute the gate from a module-scope
   constant that we override via `vi.mock` or by reading
   `process.env` lazily inside the render. The simplest path is to
   import a small helper `getShowDevNav()` from `lib/env.ts` and
   mock that in tests.
2. Add `frontend/src/lib/env.ts`:
   ```ts
   export function getShowDevNav(): boolean {
     return process.env.NEXT_PUBLIC_SHOW_DEV_NAV === '1'
   }
   ```
   Use this in `Header.tsx` instead of the inline env check so the test
   can mock it directly with `vi.mock('@/lib/env', ...)`.

### Phase D — Build verify + commit (~0.15 day)

1. With `NEXT_PUBLIC_SHOW_DEV_NAV` unset:
   ```bash
   cd frontend && pnpm build
   pm2 restart goodswap
   curl -s http://localhost:3100/ | grep -c "test-dashboard"   # → 0
   curl -s http://localhost:3100/ | grep -c ">Tests<"          # → 0
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/test-dashboard   # → 200
   ```
2. Open `agent-browser open http://localhost:3100/` and screenshot the
   open menu to `/tmp/menu-after.png`. Verify the row reads
   `… Activity` then divider, no `Tests`.
3. `pnpm test -- Header`. Both gate states pass.
4. `npx -y react-doctor@latest . --verbose --diff` from `frontend/`.
   Score ≥ 75.
5. `git add -A && git commit -m "feat(header): gate Tests link behind NEXT_PUBLIC_SHOW_DEV_NAV (production-ready nav)"`.
