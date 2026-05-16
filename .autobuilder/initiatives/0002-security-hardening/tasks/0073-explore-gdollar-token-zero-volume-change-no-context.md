---
id: gooddollar-l2-explore-gdollar-token-zero-volume-change-no-context
title: "Explore — G$ Token Row Shows $0 Volume / 0.00% Change With No Context (Looks Like the Native Token Is Dead)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, explore, ux-flows, data-integrity, critical, gdollar]
---

# Explore — G$ Token Row Shows $0 Volume / 0.00% Change With No Context (Looks Like the Native Token Is Dead)

> Note: This task is outside the formal Phase 1 security-hardening scope but
> is filed per the product-review skill's "data integrity / trust" exception.
> The user journey "new user explores the app to understand what GoodDollar
> is" ends at the Explore page seeing the project's own native token (G$)
> presented as a dead asset with $0 volume and 0% change while every other
> token on the page has live data. This actively damages the project's
> credibility on its own marketing-facing surface.

## Problem statement

Walking through the realistic user journey "new user lands on the app and
clicks Explore to see what tokens are available":

1. Navigate to `/explore`.
2. The token table renders with rows for ETH, WETH, WBTC, USDC, USDT, DAI,
   G$, LINK, UNI, AAVE, ARB, OP, MKR, COMP, etc.
3. **Every token except G$ shows realistic 24h change %, 24h volume, and
   market cap** (powered by CoinGecko via `usePriceFeeds`).
4. **The G$ row shows:**
   - 24h Change: `0.00%` (rendered as neutral grey "—" in some configs).
   - 24h Volume: `$0` or `$0.00`.
   - Market cap: a small derived number (or `$0` if the on-chain
     `SwapPoolGdUsdc.spotPrice()` returns 0).
   - Sparkline: a flat line (`[price, price, price, price, price, price, price]`,
     literally seven copies of the same number).
5. There is no badge, tooltip, or footnote explaining *why* the GoodDollar
   project's own native token has no live market data. To a new user this
   reads as "G$ is a dead asset — nobody is trading it" or "the team is
   showing fake demo data for everything except their own coin." Both are
   trust-destroying conclusions.
6. Compounding the problem: G$ is the entire point of the project ("The Good
   Chain — every transaction funds UBI for humans"). The marketing copy
   above and the prediction-market hero below both rely on G$ feeling alive
   and tradable. The Explore page directly contradicts both.

### Root cause

In `frontend/src/lib/useOnChainMarketData.ts`:

```ts
// For G$ we know the on-chain circulating supply, so we can compute
// an exact market cap. Other tokens use CoinGecko's market cap.
const circulatingSupply = t.symbol === 'G$' ? gdCirculatingSupply : undefined
const marketCap = t.symbol === 'G$'
  ? (circulatingSupply ? circulatingSupply * price : 0)
  : (quote?.marketCap ?? 0)

// 24h change / volume come from CoinGecko. We don't have a 1h or 7d
// feed yet, so those stay at 0 (consumers already render "—" for 0).
const change24h = quote?.change24h ?? 0
const volume24h = quote?.volume24h ?? 0
```

Three distinct gaps:

1. **`change24h` and `volume24h` for G$ come from `cgQuotes['G$']`** — and on
   this devnet `usePriceFeeds` is not configured with a working CoinGecko
   id for G$ on the L2 deployment, so `cgQuotes['G$']` is always `undefined`
   and both values fall back to `0`. There is no on-chain alternative
   computed even though we have a swap pool with real activity.
2. **Sparkline is hardcoded flat** (`[price, price, price, price, price, price, price]`
   at line 184) for every token, but on G$ it's especially obvious because
   the value is so small (sub-cent).
3. **No explanatory copy.** The comment "consumers already render '—' for 0"
   is technically true but the user still sees a row that looks like a dead
   token next to lively rows for unrelated assets like LINK and AAVE. The
   *contrast* is the problem, not the missing data per se.

Note that task 0046 (`explore-real-volume-marketcap-change`) addresses
general token data for *other* tokens, but it doesn't fix the G$-specific
case because G$ has no CoinGecko quote to fall back to in the first place
on this devnet.

### Impact

- **New-user trust** on the most public marketing surface (`/explore` is
  linked from the homepage).
- **Internal contradiction**: the Predict page banner two clicks away says
  "Every trade funds UBI" — but UBI is denominated in G$, and the Explore
  page implies G$ has zero volume.
- **No graceful fallback path** when CoinGecko has no quote for a token —
  this same bug will silently appear for every future native L2 token (e.g.
  the planned gUSD stable, sAAPL stocks, etc).

## Acceptance criteria

1. The G$ row on `/explore` MUST NOT show `$0 volume`, `0.00% change`, and
   a flat sparkline with no explanation. At least one of the following must
   hold:
   - (Preferred) Derive 24h volume from on-chain swap events on the G$/USDC
     pool (`SwapPoolGdUsdc`). The pool contract emits a `Swap` event; sum
     the USDC-side amount over the last 24h of blocks.
   - (Preferred) Derive 24h change from the spread between the current
     `spotPrice()` and the same pool's spot price 24h of blocks ago (or use
     the indexer service's snapshot table if it exists).
   - (Acceptable interim fix) Show an explicit "On-chain price — 24h history
     coming soon" tooltip and a neutral em-dash (`—`) instead of `$0` /
     `0.00%`, so the row reads as "we have a live price but no rolling
     window data" rather than "this asset is dead". Apply the same to any
     other token with `volume24h === 0 && change24h === 0`.
2. The sparkline for G$ MUST NOT be a flat horizontal line of identical
   values. Either compute a real 7-day sparkline from on-chain pool snapshots
   (preferred) or replace the flat line with a discreet "no chart data yet"
   placeholder graphic — anything except seven identical points.
3. The fix must not regress live tokens (ETH, WETH, USDC, etc.) — they
   continue to render real CoinGecko-derived 24h change and volume.
4. A unit test verifies the rendering logic for the three relevant token
   states: (a) full data, (b) live price but no 24h window, (c) no live
   price at all.
5. Manual verification: open `/explore`, sort by Market Cap descending, and
   confirm the G$ row no longer reads "$0 volume / 0.00% change / flat
   sparkline" — it either has real numbers or an unambiguous "coming soon"
   marker.

## Out of scope

- Indexer / backend work to maintain a full 7-day on-chain price snapshot
  table — that's a separate backend ticket. The interim fix (tooltip + em-dash)
  is acceptable for this iteration.
- Fixing trending / top-gainer / top-loser widgets that also show muted
  data (already partially covered by task 0046).
- Frontend redesign of the Explore page layout.

## Reproduction steps

1. Start the dev server and frontend with the current Anvil devnet state.
2. Open `https://goodswap.goodclaw.org/explore`.
3. Locate the G$ row in the token table.
4. Compare against the ETH row directly above/below it. ETH shows live
   percentage change, dollar volume, and a real sparkline. G$ shows `$0`,
   `0.00%`, and a flat line.
5. (Optional) Confirm in devtools that `cgQuotes['G$']` is `undefined` while
   `cgQuotes['ETH']` is a populated object.

## Related work

- Task 0046 — `explore-real-volume-marketcap-change` covers general token
  data freshness but assumes CoinGecko has a quote for the asset.
- Task `explore-market-cap-sparkline-chart` added sparkline support to the
  summary cards — this task notes the per-row sparkline is currently a
  hardcoded flat array, not a real time series.
- Future: when the indexer service is started (Phase 1, section 1.2), it
  should populate a per-token snapshot table that the frontend can pull
  from. This task is the frontend half of that flow.

---

## Planning

### Research

`frontend/src/lib/useOnChainMarketData.ts` lines 156–190 builds
`TokenMarketData`. For every token without a CoinGecko quote (G$ on devnet
is the canonical case), `quote` is `undefined` and the code returns:

- `change24h = quote?.change24h ?? 0` → renders as `0.00%` muted grey.
- `volume24h = quote?.volume24h ?? 0` → renders as `$0`.
- `sparkline7d: [price, price, price, price, price, price, price]` →
  hardcoded flat line.

The Explore table at `frontend/src/app/(app)/explore/page.tsx` lines 49–66
renders these via `<PercentageChange value={token.change24h} />`,
`formatVolume(token.volume24h)`, and `<Sparkline data={token.sparkline7d}
…>`. None of those components knows the difference between "real zero" and
"data missing", so the G$ row looks broken next to ETH/BTC rows that have
real numbers.

`PercentageChange` (`components/ui/percentage-change.tsx`) already renders
`0` as muted (no triangle, no sign) — so flipping these from `0` to a
sentinel `null` is the natural fix and the only one in the rendering path.

The `TokenMarketData` shape lives in
`frontend/src/lib/marketData.ts`. Changing the type from `number` to
`number | null` for the three fields will surface every consumer the
TypeScript compiler can find — that's the safety net we want.

### Architecture

```mermaid
flowchart TD
  A[useOnChainMarketData] --> B{quote exists?}
  B -- yes --> C[Set change24h, volume24h from CoinGecko<br/>sparkline7d from CG history if available]
  B -- no --> D[Set change24h = null, volume24h = null, sparkline7d = null]
  C --> E[TokenMarketData<br/>change24h: number, volume24h: number, sparkline7d: number[]]
  D --> E2[TokenMarketData<br/>change24h: number | null, volume24h: number | null, sparkline7d: number[] | null]
  E --> F[Explore row cells render normally]
  E2 --> G[Explore row cells:<br/>volume → '—' with tooltip<br/>change → '—' with tooltip<br/>sparkline → dashed placeholder]
```

The user-visible flow:

| Field        | With CG quote | Without (G$) — before  | Without (G$) — after                              |
|--------------|---------------|------------------------|---------------------------------------------------|
| 24h change   | `+2.34%`      | `0.00%` muted          | `—` with tooltip "Live 24h data coming soon"      |
| 24h volume   | `$1.2M`       | `$0`                   | `—` with tooltip "Live 24h volume coming soon"    |
| Sparkline    | real chart    | flat horizontal line   | dashed grey placeholder + sr-only "No chart data" |

### One-week decision

YES. The change touches three files: the hook (type + null assignments),
`marketData.ts` (type definition), and `explore/page.tsx` (render gates),
plus tests. Estimated 2–4 hours. Well under one week.

### Implementation steps

1. In `frontend/src/lib/marketData.ts`, update `TokenMarketData` type:
   `change24h: number | null`, `volume24h: number | null`,
   `sparkline7d: number[] | null` (also `change1h` and `change7d` for
   consistency — same problem applies but the columns are already hidden
   on mobile/tablet).
2. In `frontend/src/lib/useOnChainMarketData.ts` line 162–187: when
   `quote` is undefined and on-chain data has no equivalent, assign `null`
   instead of `0` / `[price, …]`. Keep `marketCap` as a number since for
   G$ we compute it from `circulatingSupply * price` — that is a real
   value, not a placeholder.
3. In `frontend/src/app/(app)/explore/page.tsx`, introduce small helpers
   (co-located): `<MarketChangeCell value={number | null} />` and
   `<MarketVolumeCell value={number | null} />`. Each renders `—` with
   `<Tooltip>` (use the existing tooltip primitive if present, else a
   `title` attribute fallback) when value is `null`. For the sparkline:
   when `token.sparkline7d == null` render a flat dashed `<svg>` of the
   same size with `aria-label="No chart data yet"`.
4. Type-fix any other consumers the compiler complains about (likely the
   detail page `[symbol]/page.tsx` and the explore tests at
   `__tests__/page.test.tsx`). For the detail page, mirror the same
   placeholder treatment.
5. Update the two existing test fixtures
   (`explore/__tests__/page.test.tsx` and
   `explore/[symbol]/__tests__/page.test.tsx`) to retain numeric values
   for the existing test tokens (no behavior change for ETH/BTC), and add
   a new test case asserting that a token with `null` 24h fields renders
   `—` and the dashed placeholder.
6. Sort behavior: when sorted by volume or change, tokens with `null`
   values sink to the bottom of the table (treat null as `-Infinity` for
   the sort comparator) — they are not "0", they are "unknown", and
   sorting them as 0 would lie about ranking.

### Acceptance verification

- Manual: load `/explore`, confirm G$ row shows `—` for 24h change /
  volume / sparkline instead of `$0` / `0.00%` / flat line, hover shows
  tooltip.
- `pnpm --filter frontend test` passes including the new null-state test.
- `npx -y react-doctor@latest frontend --verbose --diff` returns ≥ 75.
- TypeScript: `pnpm --filter frontend typecheck` (or `tsc --noEmit`)
  reports zero errors after the type widening.
