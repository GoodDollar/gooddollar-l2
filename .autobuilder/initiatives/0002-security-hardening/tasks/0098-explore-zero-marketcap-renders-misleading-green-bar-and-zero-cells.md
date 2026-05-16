---
id: gooddollar-l2-explore-zero-marketcap-renders-misleading-green-bar-and-zero-cells
slug: explore-zero-marketcap-renders-misleading-green-bar-and-zero-cells
title: "Explore — Total Market Cap Card Renders Misleading Filled Green Bar at $0; Per-Token Market Cap Column Shows '$0' Instead of Em-Dash Fallback"
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
labels: [frontend, explore, polish, sparkline, fallback, data-integrity]
---

# Explore — Total Market Cap Card Renders Misleading Filled Green Bar at $0; Per-Token Market Cap Column Shows '$0' Instead of Em-Dash Fallback

## Observed problem (visual-polish review, iteration #50)

Screenshots `/tmp/iter50-screenshots/explore.png` (desktop) and
`/tmp/iter50-screenshots/explore-mobile.png` (375px) show the Explore page in a
state that signals a broken/incomplete product:

1. The **"Total Market Cap"** summary card displays the value **"$0"** with a
   crisp solid green horizontal bar where a sparkline should be. To a user, a
   bright filled bar reads as "trending up", which contradicts the "$0" value
   right next to it. It looks like a stuck or fake widget.
2. The per-token table's **Market Cap** column shows literal `$0` for every
   row instead of the em-dash placeholder we already use for unavailable 1h /
   7d / volume data on the same page.

Both are surface-level visual integrity issues — the data layer has already
been wired up by task `0046` (CoinGecko fallback), but the rendering layer
treats `0` as a real value rather than a "no data" sentinel.

## Root cause

### Issue 1 — `MarketCapSparkline` collapses to a filled rectangle at value=0

`frontend/src/app/(app)/explore/page.tsx:91`:

```tsx
function MarketCapSparkline({ value, positive }: { value: number; positive: boolean }) {
  const data = useMemo(() => {
    const points: number[] = []
    let v = value * (1 - 0.03 * (positive ? 1 : -1))
    const step = (value - v) / 13
    for (let i = 0; i < 14; i++) {
      const noise = (((i * 7 + 3) % 11) / 11 - 0.5) * value * 0.008
      points.push(v + noise)
      v += step
    }
    points[points.length - 1] = value
    return points
  }, [value, positive])
  // ...
  const min = Math.min(...data)   // 0
  const max = Math.max(...data)   // 0
  const range = max - min || 1    // 1
  const coords = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),  // y = 38 for every point
  }))
  // areaPoints = "2,40 ... 118,40" closed back to "118,40" — a flat bar
  return <svg ...><polygon points={areaPoints} fill={color} opacity={0.12} /> ...</svg>
}
```

When `value === 0`, every generated point is exactly 0, so `min === max`. The
guard `range = max - min || 1` keeps the math safe but maps every point to
`y = h - pad`, producing a flat polyline pinned to the bottom edge. The
filled `<polygon>` then becomes a thin rectangle along the bottom — visually
indistinguishable from a deliberately rendered "trending up" bar at small
SVG sizes.

### Issue 2 — `formatMarketCap(0)` returns `"$0"`, not `"—"`

The per-row Market Cap cell is rendered as `formatMarketCap(token.marketCap)`
where `token.marketCap` defaults to `0` for any token whose CoinGecko fetch
returned no market-cap field. The same row already shows `—` for missing
1h / 7d / volume because those use `PercentageChange` which has a null
fallback. Market Cap is the odd one out.

The card-level "Total Market Cap" computation
(`tokens.reduce((s, t) => s + t.marketCap, 0)`) just sums these zeros and
ends up at $0 too, which is what triggers Issue 1.

## Files affected

- `frontend/src/app/(app)/explore/page.tsx` — `MarketCapSparkline`, the
  card render at line ~160, and the `<td>` for `formatMarketCap(token.marketCap)`
  at line ~63.
- (Read-only reference) `frontend/src/lib/marketData.ts` — definition of
  `formatMarketCap`. Don't change globally; gate the fallback at the call site.

## Target behavior

1. **`MarketCapSparkline` must render nothing (or a minimal "no data"
   placeholder) when `value <= 0`.**
   - Easiest: early-return `null` from the component when `value <= 0` and
     have the parent card render the same em-dash treatment used elsewhere
     ("`— (24h)`" already shipped for `weightedChange === null`).
2. **The "Total Market Cap" card label must not read `"$0"` when no token
   reports a market cap.**
   - Compute `tokensWithCap = tokens.filter(t => t.marketCap > 0)`.
   - If `tokensWithCap.length === 0`, render the value as `"—"` (with title
     attribute "Market cap data unavailable") instead of `formatMarketCap(0)`.
   - Otherwise sum normally.
3. **Per-token Market Cap cell must show `"—"` when `token.marketCap <= 0`,**
   matching the 1h/7d/volume placeholder treatment.
   - Wrap the call site as
     `token.marketCap > 0 ? formatMarketCap(token.marketCap) : <span className="text-gray-500" title="Unavailable">—</span>`.

No backend or data-fetch changes. This is purely a render-layer fallback fix.

## Acceptance criteria

- Loading `/explore` with the live data feed in any state (including
  CoinGecko unreachable, all `marketCap === 0`):
  - The "Total Market Cap" card shows either a real number with a real
    sparkline OR `"—"` with no sparkline at all. There is no filled green
    bar without an accompanying nonzero number.
  - The per-row Market Cap column shows real values for tokens that have
    them and `"—"` for tokens that don't, never `"$0"` for both.
- The `MarketCapSparkline` component, when given `value > 0`, renders
  identically to today (no visual regression on tokens whose data is real).
- `npx -y react-doctor@latest .` score does not regress; targets ≥ 75.

## Out of scope

- Adding a real time-series for the index (the sparkline is synthesized today;
  this task only suppresses it when data is missing).
- Extending the fallback to other cards on the page; only the visual bug
  observed in iter #50 is fixed.
- Modifying `formatMarketCap` itself.

## Verification steps

1. `pm2 restart goodswap` (or the dev server) and open
   `http://localhost:3100/explore`.
2. With normal data, confirm the Total Market Cap card and per-row cells
   render unchanged.
3. Temporarily simulate a "no market cap" state by editing
   `frontend/src/lib/useOnChainMarketData.ts` to force `marketCap: 0` for
   every token, reload, and confirm:
   - The card shows `"—"` and no green bar.
   - Each row's Market Cap cell shows `"—"`.
4. Revert the simulation. Re-take screenshots at 1440×900 and 375×812 and
   compare against the iter #50 baseline.

## Planning

### Research notes

- `frontend/src/app/(app)/explore/page.tsx` is the only consumer of
  `MarketCapSparkline`; the helper is local, not exported. Safe to gate it
  on `value > 0` at the source.
- The page already has the precedent for em-dash fallbacks: the
  `weightedChange === null` branch renders `"— (24h)"` with a title
  attribute and gray text. The new fallback should match this style for
  visual consistency.
- `formatMarketCap` is defined in `frontend/src/lib/marketData.ts` and used
  by the Stats summary card on the same page. Patching the call site (not
  the helper) avoids regressions on cards that legitimately compute zero
  via aggregation.
- Existing component tests in `frontend/src/components/__tests__/` do not
  cover `MarketCapSparkline` (it lives inside the page module and is local).
  No tests need updating; visual verification is the gate.
- `useOnChainMarketData` is the data source — we will not touch it; the
  task is render-layer only.

### Assumptions

- "No market cap data" is the only zero-value state we need to handle. A
  token that *truly* has $0 market cap is not a real-world condition; we
  treat 0 as "missing" by convention, mirroring how the weighted-change
  branch treats null as "missing".
- The page's `formatMarketCap` import remains — only the call site gets a
  conditional wrapper.

### Architecture

```mermaid
flowchart TD
    A[useOnChainMarketData] --> B[tokens array]
    B --> C{stats useMemo}
    C -->|sum marketCaps| D[totalMarketCap]
    C -->|filter marketCap > 0| E[hasAnyMarketCap?]
    D --> F[Total Market Cap card]
    E --> F
    F -->|hasAny=false| G[render "—" + no sparkline]
    F -->|hasAny=true| H[render formatMarketCap + MarketCapSparkline]
    B --> I[per-row td]
    I -->|marketCap > 0| J[formatMarketCap]
    I -->|marketCap <= 0| K[render "—"]
    style G fill:#1f2937,color:#fff
    style K fill:#1f2937,color:#fff
```

### One-week decision: **YES**

Three small, surgical edits in one file. Estimated <1 hour for one
engineer. No backend, no contracts, no test framework changes.

### Implementation plan

1. **Guard `MarketCapSparkline`** — early-return `null` when `value <= 0`
   (or guard at the parent and don't render the SVG).
2. **Card fallback** — in the `cards` array entry for "Total Market Cap":
   compute `hasAnyMarketCap = tokens.some(t => t.marketCap > 0)`. When
   false, render the title-line as
   `<div className="text-xl font-bold text-gray-500" title="Market cap data unavailable">—</div>`
   and skip the `MarketCapSparkline`. When true, keep current rendering.
3. **Per-row fallback** — in the `<td>` for `token.marketCap`, replace
   `{formatMarketCap(token.marketCap)}` with
   `{token.marketCap > 0 ? formatMarketCap(token.marketCap) : <span className="text-gray-500" title="Unavailable">—</span>}`.
4. **Manual verification** per the verification steps.

No git push; commit message: `Explore — em-dash fallback for missing market cap data`.
