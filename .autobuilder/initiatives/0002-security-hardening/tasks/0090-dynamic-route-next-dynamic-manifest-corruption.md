---
id: gooddollar-l2-dynamic-route-next-dynamic-manifest-corruption
title: "CRITICAL — All 3 detail pages (`/predict/[marketId]`, `/explore/[symbol]`, `/stocks/[ticker]`) return HTTP 500 in production because `next/dynamic({ ssr: false })` inside `[param]` route segments emits a corrupt client-reference-manifest with `(ssr)/...` path-style module IDs that don't exist in `webpack-runtime.js`"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [critical, frontend, next-dynamic, production-outage, manifest-corruption, blocks-iter45, blocks-visual-review, dynamic-routes]
---

# CRITICAL — Three detail-page templates serve HTTP 500 in prod; `next/dynamic({ ssr: false })` chart wrappers inside `[param]` routes generate a corrupt RSC client-reference-manifest

## Observed (iter45, mandatory pre-review visual check, 2026-05-16 13:55 UTC)

The build loop's mandatory "screenshot every main page" step is fully
blocked: three of the most important detail templates in the app return
HTTP 500 on both production and local PM2:

```
$ for url in /predict/1 /explore/BTC /stocks/AAPL /agents/0x0...01 /perps /predict /swap; do
    code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100$url)
    printf "%4s  %s\n" "$code" "$url"
  done
 500  http://localhost:3100/predict/1
 500  http://localhost:3100/explore/BTC
 500  http://localhost:3100/stocks/AAPL
 200  http://localhost:3100/agents/0x0000000000000000000000000000000000000001
 200  http://localhost:3100/perps
 307  http://localhost:3100/swap
 200  http://localhost:3100/predict
```

Production (https://goodswap.goodclaw.org) shows the same pattern.

PM2 logs (`/home/goodclaw/.pm2/logs/goodswap-error.log`) show the
matching runtime error firing dozens of times per minute:

```
TypeError: Cannot read properties of undefined (reading 'call')
    at Object.t [as require] (.../frontend/.next/server/webpack-runtime.js:1:128)
    at require (.../next-server/app-page.runtime.prod.js:17:18811)
    at A (.../next-server/app-page.runtime.prod.js:12:94398)
    at B._fromJSON (.../next-server/app-page.runtime.prod.js:12:97164)
    at JSON.parse (<anonymous>)
    at I (.../next-server/app-page.runtime.prod.js:12:94119)
```

`B._fromJSON` is the RSC client-reference-map parser. It looks up the
module by ID and calls `webpack-runtime.t [as require]` on it. The
require fails because `__webpack_modules__[moduleId]` is `undefined` —
the manifest's IDs don't match what the runtime registered.

This is **not** the same defect as task 0089. Task 0089 was a TypeScript
build failure that prevented `.next/BUILD_ID` from existing at all.
Today the build **succeeded** (`.next/BUILD_ID` exists, top-level pages
like `/predict`, `/perps`, `/swap` serve 200), but three dynamic-route
templates ship a broken per-page RSC manifest. Symptom is similar (500
on detail pages), root cause is completely different (runtime manifest
corruption vs build-time type error).

## Root cause — manifest IDs are wrong, not missing

For every Next.js App Router page, `next build` emits a
`page_client-reference-manifest.js` that maps every client component
referenced by that page to the webpack module ID the runtime will use
to `require()` it.

A working page's manifest uses **numeric module IDs** (matching what
ends up in `webpack-runtime.js`):

```js
// .next/server/app/(app)/agents/[address]/page_client-reference-manifest.js
"ssrModuleMapping":{
  "133":  {"*":{"id":"14331","name":"*","chunks":[],"async":false}},
  "6258": {"*":{"id":"51552","name":"*","chunks":[],"async":false}},
  "7084": {"*":{"id":"53643","name":"*","chunks":[],"async":false}},
  ...57 numeric IDs total
}
```

The three broken pages emit **path-string IDs** instead, which the
runtime cannot resolve:

```js
// .next/server/app/(app)/predict/[marketId]/page_client-reference-manifest.js
"ssrModuleMapping":{
  "(app-pages-browser)/./src/components/LandingSwapCard.tsx": {
    "*":{"id":"(ssr)/./src/components/LandingSwapCard.tsx","name":"*","chunks":[],"async":false}
  },
  "(app-pages-browser)/./src/components/SwapPriceChart.tsx": {
    "*":{"id":"(ssr)/./src/components/SwapPriceChart.tsx","name":"*","chunks":[],"async":false}
  },
  ...
}
```

`__webpack_modules__["(ssr)/./src/components/SwapPriceChart.tsx"]`
**does not exist** in the production webpack-runtime (which only
contains numeric-ID modules after the production optimization pass).
Every render of these pages crashes inside `B._fromJSON`.

Quantified across the affected and working pages:

| Route                         | Manifest size | `(ssr)/...` path IDs |
|-------------------------------|---------------|----------------------|
| `(app)/explore/[symbol]`      | 20,912 bytes  | **present (broken)** |
| `(app)/stocks/[ticker]`       | 20,747 bytes  | **present (broken)** |
| `(app)/predict/[marketId]`    | 20,949 bytes  | **present (broken)** |
| `(app)/agents/[address]`      | 28,791 bytes  | none (numeric — OK)  |
| `(app)/perps`                 | 29,413 bytes  | none (numeric — OK)  |

The three corrupt manifests are ~8 KB smaller because the path-style
encoding skips emitting most of the actual module entries — they
contain skeleton SSR mappings only, no real `clientModules` records.

## What triggers the bug

The three failing pages all match this exact shape:

1. They are **dynamic route segments** (`[param]/page.tsx`).
2. They start with `'use client'` at the top of the file.
3. They use **`next/dynamic` with `ssr: false`** at module top level to
   lazy-load a chart component, with the `.then(m => ({ default: m.X }))`
   named-export unwrap pattern:

```tsx
const PriceChart = dynamic(
  () => import('@/components/PriceChart').then(m => ({ default: m.PriceChart })),
  {
    ssr: false,
    loading: () => <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} />,
  }
)
```

Both control pages refute simpler hypotheses:

- `agents/[address]/page.tsx` — same `[param]` shape, same `'use client'`,
  but **no** `next/dynamic`. Works (HTTP 200).
- `perps/page.tsx` — uses `next/dynamic({ ssr: false })` four times for
  `PriceChart`, `OrderBook`, `RecentTrades`, `OpenPositions`, but is at
  a **static path**. Works (HTTP 200, numeric manifest IDs).

So the trigger is the combination *`[param]` route segment + module-top-
level `next/dynamic({ ssr: false })`* — Next.js's per-page manifest
serializer fails to resolve the lazy chunk against the dynamic-route
chunk-splitting plan, falls back to the path-string ID encoding, and
emits a manifest the runtime can never load.

## User story

As a user, I want to click on a market, token, or stock from the list
page and see the detail view with its chart, so I can analyse it and
decide whether to trade — instead of seeing a generic Next.js 500
error page.

## Why this is CRITICAL (not just HIGH)

- Every Predict market detail page, every Explore token page, and every
  Stocks ticker page is unreachable. That's the **majority of detail
  pages in the app**.
- The iter45 review's *mandatory* visual-check step requires screenshots
  of every main page. It cannot proceed until these pages render.
- This is a regression that survived the last build (the build itself
  succeeded). The pages were healthy before the `next/dynamic` wrapping
  was introduced (tasks `gooddollar-l2-swap-token-pair-price-chart`,
  `gooddollar-l2-explore-market-cap-sparkline-chart` were the most
  recent chart additions; ProbabilityChart predates them).
- The Slither HIGH work and the rest of the security-hardening
  initiative cannot be visually verified end-to-end while the detail
  pages 500. This is the visible product surface for several of the
  protocols the initiative is meant to harden.

## Acceptance criteria

1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/predict/1` returns **200** (not 500). Same for `/explore/BTC` and `/stocks/AAPL`.
2. After `npm run build` from `frontend/`, the manifest files
   `.next/server/app/(app)/predict/[marketId]/page_client-reference-manifest.js`,
   `.../explore/[symbol]/page_client-reference-manifest.js`, and
   `.../stocks/[ticker]/page_client-reference-manifest.js` contain
   **zero occurrences of `"(ssr)/`** (grep returns 0).
3. PM2 `goodswap` no longer logs `TypeError: Cannot read properties of undefined (reading 'call')` from these three routes within a 60-second window after rebuild.
4. Each detail page renders its chart visually: opening the URL in
   `agent-browser` and taking a snapshot must show the chart container
   filled (line plot or probability curve), not a permanent grey
   shimmer placeholder and not a Next.js error page.
5. **No behaviour change for working pages**: `/agents/[address]`,
   `/perps`, `/swap`, `/predict`, `/explore` continue to return 200.
6. No new `next/dynamic` introduced anywhere — the fix removes the
   wrappers from the three affected pages rather than adding more.
7. README updated with the fix entry under "Security Hardening" /
   "Production Outages Fixed" section and `Updated:` date bumped.

## Out of scope (explicitly deferred)

- Investigating *why* Next.js 14's webpack RSC manifest serializer
  emits path-style IDs for `[param]` + `next/dynamic({ ssr: false })` —
  that is a Next.js bug we cannot fix from inside the app. We are
  working around it.
- Removing `next/dynamic` from `perps/page.tsx`. That page works; the
  bug is specifically the dynamic-route × dynamic-import interaction.
  Touching `perps/` risks regressing a healthy route. (Out of scope.)
- A general "audit every `next/dynamic` in the app" sweep. There are
  exactly 4 call sites and 3 of them are the broken ones — we are
  fixing those 3, leaving the 4th alone.
- Upgrading Next.js. That's a much larger change and would not be
  guaranteed to fix the manifest issue.

## Proposed UX

Users should see **no change** in observable behaviour — same loading
placeholder, same chart, same data flow. The only difference is that
the chart actually renders instead of the page 500-ing.

The technical path: replace the `next/dynamic({ ssr: false })` wrapper
with a tiny `'mounted-then-render'` client gate using `useEffect`.
This achieves the same goal (do not render the chart until we are on
the client) without touching the manifest serializer's broken code
path.

```tsx
// New small helper at top of file or in src/components/ClientOnly.tsx
function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => { setM(true) }, [])
  return m
}

// In render:
const mounted = useMounted()
// ...
{mounted
  ? <PriceChart prices={prices} timeframe={tf} loading={loading} />
  : <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} />}
```

`PriceChart` is then a regular static `import { PriceChart } from '@/components/PriceChart'`
at the top of the page — which goes through Next's normal client-module
manifest path and produces a numeric module ID just like every other
working page does.

## Plan (TDD — runtime regression test first)

### Phase RED — capture the failing baseline

```bash
cd /home/goodclaw/gooddollar-l2/frontend
# Confirm 500s
for url in /predict/1 /explore/BTC /stocks/AAPL; do
  curl -s -o /dev/null -w "%{http_code} $url\n" "http://localhost:3100$url"
done
# Expected: three 500s

# Confirm manifest corruption
for f in 'predict/[marketId]' 'explore/[symbol]' 'stocks/[ticker]'; do
  grep -c '"(ssr)/' ".next/server/app/(app)/$f/page_client-reference-manifest.js"
done
# Expected: each prints 1 (one giant ssrModuleMapping containing many "(ssr)/..." entries)
```

Add a Playwright (or vitest+jsdom) regression test in
`frontend/tests/dynamic-detail-pages-render.test.ts` that:

1. Boots the production server on a fresh port.
2. Fetches `/predict/1`, `/explore/BTC`, `/stocks/AAPL`.
3. Asserts response status is **200** and the response body contains
   the expected page title (e.g., `predict_market_title`, `explore_token_header`,
   `stocks_ticker_header` — or whatever data-testid strings already exist
   on those pages).

Test must fail RED against the current build.

### Phase GREEN — surgical fix in three files

For each of:

- `frontend/src/app/(app)/predict/[marketId]/page.tsx`
- `frontend/src/app/(app)/explore/[symbol]/page.tsx`
- `frontend/src/app/(app)/stocks/[ticker]/page.tsx`

Apply this transformation:

1. Replace the `import dynamic from 'next/dynamic'` line and the
   `const Xchart = dynamic(...)` block with a static import:
   ```tsx
   import { PriceChart } from '@/components/PriceChart'
   // or ProbabilityChart for predict
   ```
2. Add a small mount-guard hook at the top of the file (or extract to
   `src/components/ClientOnly.tsx` if it's used in >1 place):
   ```tsx
   function useMounted() {
     const [m, setM] = useState(false)
     useEffect(() => { setM(true) }, [])
     return m
   }
   ```
3. At the chart's render site, gate it behind `mounted`:
   ```tsx
   {mounted ? <PriceChart ... /> : <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} />}
   ```
   Preserving the exact placeholder height (350 / 400 / 300) per page.

This pattern is functionally identical to `next/dynamic({ ssr: false })`
— both delay client-component rendering until after hydration — but it
goes through the normal client-component manifest path and avoids the
buggy `next/dynamic`-in-dynamic-route serializer code path entirely.

### Phase REFACTOR — verify end-to-end

```bash
cd /home/goodclaw/gooddollar-l2/frontend
rm -rf .next                                              # force a clean build
npm run build                                              # must exit 0
ls -la .next/BUILD_ID                                      # must exist

# Manifest is clean
for f in 'predict/[marketId]' 'explore/[symbol]' 'stocks/[ticker]'; do
  count=$(grep -c '"(ssr)/' ".next/server/app/(app)/$f/page_client-reference-manifest.js")
  echo "$f: (ssr)/ count = $count (must be 0)"
done

# PM2 reload + HTTP probe
pm2 reload goodswap
sleep 5
for url in /predict/1 /explore/BTC /stocks/AAPL /agents/0x0000000000000000000000000000000000000001 /perps /predict /swap; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3100$url")
  printf "%4s  %s\n" "$code" "$url"
done
# Expected: 200, 200, 200, 200, 200, 307, 200

# Visual verification via agent-browser
agent-browser open http://localhost:3100/predict/1     # must show market detail with probability curve
agent-browser open http://localhost:3100/explore/BTC   # must show price chart
agent-browser open http://localhost:3100/stocks/AAPL   # must show price chart
```

## Why no rollback to `next/dynamic` even if other reasons emerge

The whole point of `next/dynamic({ ssr: false })` is to avoid SSR for
components that depend on `window`/`document` (charts using Canvas /
ResizeObserver / animation libs). The `useMounted()` pattern achieves
**exactly the same result** with three fewer lines of indirection and
no dependency on the buggy manifest serializer. There is no real-world
downside to the substitution. The only difference is that the SSR shell
for the *parent* page will include a placeholder `<div>` for the chart
slot, which is exactly what `next/dynamic`'s `loading:` prop produces
anyway.

## Dependencies / blocks

- **Blocks the iter45 visual review**: the mandatory pre-review
  screenshot step requires all main pages to render. Until this lands,
  no competitor-comparison review can proceed.
- **Blocks** any future task that needs to add features to the
  Predict/Explore/Stocks detail pages — those pages are currently
  unreachable in production.
- **Independent of** the Slither HIGH finding work — this is a frontend
  Next.js manifest bug that does not touch Solidity.

## Architecture diagram

```mermaid
flowchart TB
    subgraph Before["BEFORE \u2014 broken (HTTP 500)"]
        B_Build[next build] -->|emits corrupt manifest| B_Manifest["(app)/predict/[marketId]/<br>page_client-reference-manifest.js<br>'ssrModuleMapping' uses<br>(ssr)/./src/components/X.tsx<br>path-string IDs"]
        B_Browser[Browser GET<br>/predict/1] --> B_RSC[RSC client-ref<br>parser B._fromJSON]
        B_RSC -->|require by path-ID| B_WP[webpack-runtime.t]
        B_WP -->|__webpack_modules__<br>'(ssr)/./...' = undefined| B_Err[TypeError:<br>Cannot read 'call'<br>of undefined] --> B_500[HTTP 500]
        B_Page[predict/[marketId]/page.tsx<br>'use client'<br>const Chart = dynamic<br>'(ssr: false)'] -.->|trigger| B_Build
    end

    subgraph After["AFTER \u2014 fixed (HTTP 200)"]
        A_Page[predict/[marketId]/page.tsx<br>'use client'<br>import {ProbabilityChart} from '@/components/ProbabilityChart'<br>const mounted = useMounted&#40;&#41;<br>mounted ? Chart : Placeholder] --> A_Build[next build]
        A_Build -->|emits standard manifest| A_Manifest["(app)/predict/[marketId]/<br>page_client-reference-manifest.js<br>numeric module IDs<br>matching webpack-runtime"]
        A_Browser[Browser GET<br>/predict/1] --> A_RSC[RSC client-ref<br>parser B._fromJSON]
        A_RSC -->|require by numeric ID| A_WP[webpack-runtime.t]
        A_WP -->|module found| A_OK[Page renders<br>placeholder \u2192 chart<br>after mount] --> A_200[HTTP 200]
    end

    Before -.->|3 files transformed| After
```

The key architectural insight: the entire fix is contained to the three
broken `[param]/page.tsx` files. Nothing else changes. The chart
components themselves (`PriceChart`, `ProbabilityChart`) are unchanged.
The webpack config is unchanged. The Next.js version is unchanged. We
simply route around the broken Next.js manifest-serializer code path by
not invoking `next/dynamic({ ssr: false })` from inside dynamic route
segments.

## One-week decision

**YES** \u2014 one human can complete this in well under one week
(estimate: ~30 minutes coding + ~15 minutes build/verify + ~10 minutes
README update = ~1 hour total).

Rationale:

1. **Surface area is tiny**: 3 files in `frontend/src/app/(app)/.../page.tsx`,
   each touched in exactly the same way (replace `dynamic(...)` block
   with static import + `useMounted` gate). One reusable helper.
2. **No new APIs, contracts, dependencies, or data flow**. No backend
   change, no smart-contract change, no database migration.
3. **No design decisions outstanding**. The exact transformation is
   spelled out above. The control pages (`/perps`, `/agents/[address]`)
   already validate that both the dynamic-route shape and the
   `useMounted` pattern work.
4. **Verification is mechanical**: a `grep '"(ssr)/'` over three
   manifest files, plus three `curl` checks, plus a `pm2 reload`. No
   judgement calls.
5. **No split needed** (`split: false`). Splitting into per-file
   sub-tasks would just add overhead with no clarity benefit \u2014 the
   transformation is literally identical across the three files.

## Implementation log

(Filled during execution.)
