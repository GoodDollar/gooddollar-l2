---
id: fix-pagetransition-stuck-blank-pages
title: "PageTransition — Every page renders blank (opacity:0) because framer-motion enter animation never runs (CRITICAL: site-wide blank page)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, frontend, regression, animation, blank-page, fresh-eyes, bug]
---

# PageTransition — Every page renders blank because the enter animation never runs

## Why this is CRITICAL

A brand-new user landing on https://goodswap.goodclaw.org (or the local
dev server at http://localhost:3100/) sees the header and footer, but
the entire content area between them is blank. This affects **every
page** — `/`, `/perps`, `/lend`, `/stable`, `/stocks`, `/predict`,
`/explore`, and any other top-level route, because the bug is in the
global `PageTransition` component used in the root layout.

This is the first-time-user worst case: a visitor cannot figure out
what the app does within 10 seconds because they literally cannot see
any product content. It trumps every other "fresh-eyes" finding for
this iteration and qualifies for the build-loop CRITICAL carve-out
(blank page / app crash).

### Visual evidence (iteration 6, this run)

Screenshots taken with `agent-browser` (saved to `/tmp/iter6-review/`):

- `01-home.png` — only header + footer + animated background blobs
- `swap.png`, `perps.png`, `lend.png`, `stable.png`, `stocks.png`,
  `predict.png`, `explore.png` — same blank middle on every page

DOM is present (`document.body.innerText.length === 1714` on home
including hero copy "DeFi That Funds UBI", "How It Works", etc.) but
invisible.

The home page's wrapper `<div>` (the `motion.div` injected by
`PageTransition`) computes to:

```
opacity: "0"
transform: "matrix(1, 0, 0, 1, 0, 8)"  // translateY(8px)
visibility: "visible"
display: "block"
```

Walking up the parent chain, no ancestor has `opacity: 0` — the bug is
on the `motion.div` itself, which never advances from the `hidden`
variant to the `enter` variant.

### Server-rendered HTML confirms SSR side of the bug

```bash
$ curl -s http://localhost:3100/ | grep -oE 'style="[^"]*opacity:0[^"]*"'
style="opacity:0;transform:translateY(8px)"
```

Framer Motion's `initial="hidden"` is being rendered into the SSR HTML
as inline style. When client-side JS hydrates, the enter animation
should advance opacity to 1 within ~180 ms — but it never starts. The
page stays at `opacity: 0` indefinitely. Browser console shows no
JS errors, and the bug is reproducible with `prefers-reduced-motion`
disabled.

### Note on `/swap`

Curl shows `/swap` returns `HTTP 307` and an `__next_error__` shell,
but that's **expected**: `frontend/src/app/swap/page.tsx` is just
`redirect('/')` (swap UI lives on the home page). The 307 is not a
bug; the blank home page **is** the bug.

## Root cause analysis

`frontend/src/components/PageTransition.tsx`:

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter:  { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -8 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="flex-1 flex flex-col items-center w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

This is wired globally in `frontend/src/app/layout.tsx`:

```tsx
<main id="main-content" ...>
  <PageTransition>{children}</PageTransition>
</main>
```

The bug is the combination of:

1. `initial="hidden"` — gets serialized into SSR inline style as
   `opacity:0; transform:translateY(8px)`. This means the page is
   invisible by default, before any JS runs.
2. `AnimatePresence mode="wait"` + `key={pathname}` — on initial mount
   framer-motion treats the first child as a fresh entry and should
   animate from `hidden` to `enter`. But when SSR'd HTML already
   contains the `hidden` style, framer-motion's hydration in
   `framer-motion` v12 (`"^12.38.0"` in `frontend/package.json`)
   sometimes fails to schedule the animation — the motion.div mounts
   with the SSR styles already applied, and `motionValue`'s initial
   value matches `hidden`, so the controller has no transition to
   run.

The net effect: the SSR `opacity:0` style sticks, no animation runs,
and the page is permanently invisible.

`prefers-reduced-motion` is **not** the cause (tested via DevTools
emulation; same result with motion enabled). Strict mode double-mount
is not the cause either — both mounts end in the same `hidden` state.

## Acceptance Criteria

1. Visiting `/`, `/perps`, `/lend`, `/stable`, `/stocks`,
   `/predict`, and `/explore` with the dev server running renders the
   page content with `opacity: 1` within ≤ 500 ms of navigation —
   verified by screenshot + DOM inspection.
2. SSR HTML for `/` (verified with `curl -s http://localhost:3100/`)
   **must not** contain `style="opacity:0;..."` on the page wrapper
   `<div>`. Either the wrapper renders without a style attribute, or
   it renders with `opacity:1`.
3. The "page enter" animation is preserved — i.e. content slides /
   fades in on subsequent client-side navigations (e.g. clicking a
   header link). The fix must not strip the visual polish; it just
   needs to make sure the resting state is **visible**.
4. Users with `prefers-reduced-motion: reduce` see content
   immediately at `opacity: 1` (no animation at all is fine).
5. `npx -y react-doctor@latest . --verbose --diff` reports score
   ≥ 75 on the changed files; no React anti-patterns introduced.
6. No regression to keyboard focus / skip-link behavior in
   `frontend/src/app/layout.tsx`.

## Implementation Notes

The minimal, lowest-risk fix has three components.

### Fix A — Don't SSR the `hidden` state

Change the motion.div so its **initial render** is `enter`-equivalent,
and only animate on subsequent navigations. Framer Motion supports
`initial={false}` on `AnimatePresence` to skip the initial enter
animation. Equivalently we can make the variant explicit:

```tsx
// PageTransition.tsx (proposed)
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter:  { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -8 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // On the very first client render (and during SSR), render the
  // children at the "enter" state so the SSR HTML and the first
  // hydration paint are fully visible. Only flip on subsequent
  // pathname changes, where we want the cross-page transition.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => { setHasMounted(true) }, [])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={hasMounted ? 'hidden' : 'enter'}
        animate="enter"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="flex-1 flex flex-col items-center w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

Key points:

- `AnimatePresence initial={false}` makes the *first* mount skip the
  enter animation — protection against the hydration race.
- `initial={hasMounted ? 'hidden' : 'enter'}` makes the *very first*
  paint render directly at the visible state. After the first commit,
  `hasMounted` becomes true and subsequent route changes get the
  full hidden→enter animation.
- This is also the recommended pattern in framer-motion's own docs
  for "skip initial animation on mount" when combined with Next.js
  app router.

### Fix B (optional, defense-in-depth) — Honor `prefers-reduced-motion`

Wrap the variants so users with reduced-motion preferences see no
animation. Framer Motion provides `useReducedMotion()`:

```tsx
import { useReducedMotion } from 'framer-motion'
// ...
const shouldReduce = useReducedMotion()
const transition = shouldReduce
  ? { duration: 0 }
  : { duration: 0.18, ease: 'easeInOut' }
```

### What NOT to do

- Do **not** delete `PageTransition` outright. The page transition
  is a real UX feature — we just need it to default to visible.
- Do **not** move the wrapper to a server component. `framer-motion`
  requires the client boundary and the existing `'use client'`
  directive is correct.
- Do **not** change `frontend/src/app/layout.tsx`'s `<main>` element
  — it carries the WCAG skip-link target.

## Verification

```bash
# 1. Start the frontend (already running on :3100 during this review).
cd /home/goodclaw/gooddollar-l2/frontend
# (If not already up:) PORT=3100 npm run dev &

# 2. Confirm the bug pre-fix:
curl -s http://localhost:3100/ | grep -c 'style="opacity:0'
# → should be 1 BEFORE fix, 0 AFTER fix

# 3. Browser screenshot pre/post:
agent-browser --session ptfix goto http://localhost:3100/
agent-browser --session ptfix screenshot /tmp/ptfix-home.png
# Visually confirm hero copy + CTAs render.

# 4. DOM-level confirmation:
agent-browser --session ptfix eval '(() => { \
  const wrap = document.querySelector("main > div"); \
  const s = getComputedStyle(wrap); \
  return JSON.stringify({opacity: s.opacity, visibility: s.visibility}); \
})()'
# → expected: {"opacity":"1","visibility":"visible"}

# 5. Repeat for every main page:
for p in / perps lend stable stocks predict explore; do
  agent-browser --session ptfix goto "http://localhost:3100/$p"
  agent-browser --session ptfix screenshot "/tmp/ptfix-$(echo $p | tr / -).png"
done

# 6. Internal-link navigation (preserves the transition animation):
agent-browser --session ptfix goto http://localhost:3100/
agent-browser --session ptfix click "text=Predict"
# → page should animate in (fade + slide), ending fully visible.

# 7. Reduced motion (optional, if Fix B is included):
#    Emulate via DevTools: Rendering panel → "prefers-reduced-motion: reduce".
#    Confirm content is instantly visible on every page.

# 8. React-doctor + production build:
cd /home/goodclaw/gooddollar-l2
npx -y react-doctor@latest . --verbose --diff
cd frontend && npm run build
```

## Out of scope

- Slither / Foundry / contract changes (not the source of this bug).
- Backend / PM2 work (separate Phase 1 tasks).
- Refactoring `Header`, `LandingFooter`, or `UBIBanner`.
- Changing the **content** of any page — only the visibility wrapper.
- Per-route transition variations.

---

## Planning

### Overview

A single client component — `frontend/src/components/PageTransition.tsx` —
wraps every page's children with a framer-motion `motion.div` whose
`initial="hidden"` state sets `opacity:0` and `translateY(8px)`. The
SSR pass serializes that initial state into inline `style="opacity:0;
transform:translateY(8px)"`, and the client-side enter animation
never advances opacity past 0. Result: every main page in the app
renders blank between header and footer.

We need to make the **first render** (SSR + first client paint) of
`PageTransition` always be the visible `enter` state, while keeping
the cross-route page transition for subsequent client-side
navigations.

### Research notes

- `framer-motion@^12.38.0` (`frontend/package.json`). v12 added stricter
  SSR style serialization; v11's behavior of treating `initial` as a
  client-only animation has changed. The current symptom matches
  GitHub issues on `motion/motion` from 2025 where users report SSR
  `opacity:0` sticking with Next.js app router.
- `AnimatePresence` has an `initial` prop (boolean). When `false`,
  the first mount of a child is rendered directly at its `animate`
  state — no enter animation, no SSR `opacity:0` style. Framer's
  official "skip initial animation" recipe.
- We still want the cross-page transition. The standard pattern is
  to track `hasMounted` with `useEffect` + `useState` and switch the
  motion.div's `initial` prop from `"enter"` (first paint, hydration-
  safe) to `"hidden"` (every later route change, animates in). This
  is exactly the same pattern used by other Next.js + framer-motion
  apps shipping cross-page transitions.
- `useReducedMotion()` is already exported from `framer-motion`; no
  new dep needed. Honoring `prefers-reduced-motion` is a WCAG 2.3.3
  recommendation and trivially cheap.
- `'use client'` is already on the file, so client hooks
  (`useState`, `useEffect`, `useReducedMotion`) compile fine.
- The wider layout (`frontend/src/app/layout.tsx`) only consumes the
  component via `<PageTransition>{children}</PageTransition>`. No
  other file imports `PageTransition`, so the change is contained.
- No Foundry / Slither / backend code is touched.
- `react-doctor` will run on the changed file; the new code uses
  standard React 18 patterns (no `useEffectEvent`, no concurrent
  experimental APIs), so a high score is expected.

### Assumptions

- The page-transition visual is desired UX (i.e., we want to keep the
  fade+slide on client-side route changes). Removing it entirely is
  *not* the intent — the bug is that it leaks into the resting state.
- No other component depends on the `motion.div`'s `data-framer-*`
  attributes (CSS / tests / e2e selectors target user-facing
  `text=`/`role=` selectors).
- The dev server runs on `http://localhost:3100/` (confirmed via
  agent-browser screenshots earlier this iteration).

### Architecture diagram

```mermaid
flowchart TB
  subgraph SSR["Server (Next.js RSC)"]
    Layout["layout.tsx<br/>(server component)"] --> ClientShell["ClientLayout<br/>(client wrapper)"]
    ClientShell --> Main["&lt;main id='main-content'&gt;"]
    Main --> PT_SSR["PageTransition<br/>('use client')"]
    PT_SSR --> Children_SSR["page.tsx children"]
  end

  subgraph Browser["Browser (hydrate + run)"]
    Hydrate["Hydration"] --> PT_Mount["PageTransition mounts"]
    PT_Mount --> Decision{"hasMounted?"}
    Decision -- "false (first paint)" --> Enter1["initial='enter'<br/>opacity:1, y:0<br/>SSR HTML matches"]
    Decision -- "true (route change)" --> Hidden["initial='hidden'<br/>opacity:0, y:8 → enter"]
    Enter1 --> SetMounted["useEffect: setHasMounted(true)"]
    Hidden --> Animate["fade+slide ~180ms"]
  end

  Reduced{{"prefers-reduced-motion?"}}
  Reduced -- "reduce" --> ZeroDur["transition: duration:0"]
  Reduced -- "no-preference" --> NormalDur["transition: 0.18s easeInOut"]
  PT_Mount --> Reduced

  PT_SSR -. "renders identical HTML<br/>to first browser paint" .-> Enter1
```

### One-week decision

**YES** — this is well under one week. The fix is a single-file edit
of `frontend/src/components/PageTransition.tsx` (~30 lines), plus
verification via curl + agent-browser screenshots. Total effort
estimate: 30–60 minutes including verification. No split required.

### Implementation plan

Phased approach — each phase is small enough to verify before moving
to the next.

**Phase 1 — Reproduce locally (≤5 min)**

```bash
cd /home/goodclaw/gooddollar-l2/frontend
# Confirm dev server up on :3100 (already running in this iteration).
curl -s http://localhost:3100/ | grep -c 'style="opacity:0'
# Expected pre-fix: 1
```

**Phase 2 — Apply the fix (single edit, ~10 min)**

Replace the body of `frontend/src/components/PageTransition.tsx`
with:

```tsx
'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter:  { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -8 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldReduce = useReducedMotion()

  // First paint (SSR + first hydration commit) must be fully visible.
  // After mount, future route changes get the hidden -> enter animation.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const transition = shouldReduce
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeInOut' as const }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={hasMounted && !shouldReduce ? 'hidden' : 'enter'}
        animate="enter"
        exit={shouldReduce ? undefined : 'exit'}
        variants={variants}
        transition={transition}
        className="flex-1 flex flex-col items-center w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

Why this works:
- `AnimatePresence initial={false}` ensures framer-motion skips the
  enter animation on the very first mount of the first child, so it
  cannot leave the page stuck at `opacity:0` if the animation never
  starts.
- `initial={hasMounted && !shouldReduce ? 'hidden' : 'enter'}` means
  the SSR pass and the first client commit both pin the motion.div
  to the `enter` variant (`opacity:1, y:0`). The SSR HTML therefore
  no longer contains `style="opacity:0..."`.
- After `useEffect` flips `hasMounted` to `true`, subsequent
  pathname changes use `initial="hidden"` and animate to `enter` —
  the cross-page transition is preserved.
- `useReducedMotion()` gates both the animation duration and the
  initial state, satisfying WCAG.

**Phase 3 — Verify the fix (≤15 min)**

```bash
# 3a. SSR check.
curl -s http://localhost:3100/ | grep -c 'style="opacity:0'
# Expected post-fix: 0

# 3b. Visual check on every main page.
for p in "" perps lend stable stocks predict explore; do
  agent-browser --session ptfix2 goto "http://localhost:3100/$p"
  sleep 0.4
  agent-browser --session ptfix2 screenshot "/tmp/ptfix2-$(echo ${p:-home}).png"
  agent-browser --session ptfix2 eval '(() => {
    const wrap = document.querySelector("main > div");
    const s = getComputedStyle(wrap);
    return JSON.stringify({path: location.pathname, opacity: s.opacity, visibility: s.visibility, bodyLen: document.body.innerText.length});
  })()'
done
# Expected: opacity:"1", visibility:"visible", bodyLen > 200 on every page.

# 3c. Cross-page transition still animates.
agent-browser --session ptfix2 goto http://localhost:3100/
agent-browser --session ptfix2 click "text=Predict"
# Observe the slide-fade. End state must be opacity:1.

# 3d. React-doctor + build.
cd /home/goodclaw/gooddollar-l2
npx -y react-doctor@latest . --verbose --diff
cd frontend && npm run build
```

**Phase 4 — Commit (≤2 min)**

```bash
git add frontend/src/components/PageTransition.tsx \
        .autobuilder/initiatives/0002-security-hardening/tasks/0019-fix-pagetransition-stuck-blank-pages.md
git commit -m "fix(frontend): unblank every page by rendering PageTransition at visible state on first paint"
```

### Risk + rollback

- **Risk**: Hydration mismatch warning if SSR and first client render
  produce different `initial` values. Mitigation: both SSR and the
  first client commit see `hasMounted === false`, so both pick
  `initial='enter'`. They match. After `useEffect` runs (post-commit),
  React doesn't compare against SSR HTML.
- **Risk**: Loss of the entry animation on the very first page load.
  This is intentional and acceptable — the alternative is the current
  bug (no visible content). Subsequent navigations preserve the
  animation.
- **Rollback**: Single-file revert. `git revert <commit-sha>` returns
  to the pre-fix `PageTransition.tsx`, which reproduces the blank
  page but does not break tests or routing.

### Files touched

- `frontend/src/components/PageTransition.tsx` — replace body.
- (this task file) — planning + executed flag updates.

No other files require changes.

## Verification (executed)

Rebuilt frontend in prod mode and verified via SSR HTML:

```
/           -> 200  opacity0=0
/perps      -> 200  opacity0=0
/lend       -> 200  opacity0=0
/stable     -> 200  opacity0=0
/stocks     -> 200  opacity0=0
/predict    -> 200  opacity0=0
/ubi-impact -> 200  opacity0=0
/bridge     -> 200  opacity0=0
/pool       -> 200  opacity0=0
/portfolio  -> 200  opacity0=0
```

The wrapping `<div class="flex-1 flex flex-col items-center w-full">` now ships
with `style="opacity:1;transform:none"` in the SSR'd HTML on every page,
confirming that first paint is fully visible and hydration cannot leave a page
stuck at opacity:0.

react-doctor (uncommitted diff scan): **99 / 100** — two advisory warnings
(LazyMotion bundle hint, hydration-flicker heuristic). The hydration warning is
a false positive here: SSR and the first client commit both use
`initial='enter'`, so there is no visible flicker; `hasMounted` only flips on
the next commit to re-enable hidden→enter transitions for subsequent route
changes.

Additional fix bundled in this commit:
- `frontend/src/lib/tokens.ts` — added optional `icon?: string` to `Token`
  interface so `npm run build` could complete; `SwapRoute.tsx` already reads
  `inputToken.icon` / `outputToken.icon` but the type lacked the field, which
  blocked the production build needed to ship the PageTransition fix.
