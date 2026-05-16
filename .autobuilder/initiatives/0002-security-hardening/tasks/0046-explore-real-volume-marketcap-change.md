---
id: gooddollar-l2-explore-real-volume-marketcap-change
title: "Explore — Stop Hardcoding Zero for change24h/volume24h/marketCap (Pull Real Data from CoinGecko)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [frontend, explore, ux-flows, data-integrity]
---

# Explore — Stop Hardcoding Zero for change24h/volume24h/marketCap (Pull Real Data from CoinGecko)

> Note: This task is outside the formal Phase 1 security-hardening scope but is filed per
> the product-review skill: it is a clear, reproducible data-integrity bug observed in
> iteration #20's `ux-flows` walkthrough of the Explore page. The page already shows real
> prices for ETH, WBTC, USDC, etc., so showing zero for every other stat is actively
> misleading.

## Problem statement

Walking through the realistic user journey "new user opens the app and explores tokens":
the user lands on `/explore`, sees a price column with realistic values (ETH ≈ $3,012,
WBTC ≈ $60,125, USDC ≈ $1.00) but **every other column shows 0** — change 1h, change 24h,
change 7d, volume 24h, market cap (for non-G$ tokens), and the sparkline is a flat line.

This breaks several Explore page features simultaneously:

- The `Top Gainers` widget is empty (nothing to rank — every change is exactly zero).
- Every sparkline mini-chart is a flat horizontal line at the current price.
- Sorting by 24h volume / market cap is meaningless (every row ties at 0).
- The category badge stats (avg change %, total volume) display 0/$0.

### Root cause

In `frontend/src/lib/useOnChainMarketData.ts`, lines 168–173:

```ts
return {
  ...t,
  price,
  change1h:  0,
  change24h: 0,
  change7d:  0,
  volume24h: 0,
  marketCap,                                                  // 0 for non-G$ tokens
  sparkline7d: [price, price, price, price, price, price, price],   // flat line
  ...
}
```

Every market-data field except `price` and (G$-only) `marketCap` is hardcoded to a literal
`0` (or a flat array). The hook fetches CoinGecko via `usePriceFeeds`, but
`usePriceFeeds` only requests `vs_currencies=usd` — it deliberately ignores the
`include_24hr_change`, `include_24hr_vol`, `include_market_cap` parameters that the same
endpoint supports for free in a single call.

There is no on-chain source of truth for 24h change / 24h volume / market cap for these
tokens (we are on a fresh devnet with no trade history), so we must rely on CoinGecko —
the same source the prices already come from.

### Where it shows up

- `/explore` token table — every "Change %" column reads 0.00%.
- `/explore` sparkline column — flat horizontal line for every token.
- `/explore` "Top Gainers" / "Top Losers" widgets — empty or arbitrary.
- `/explore` category-summary cards — "Total volume" reads $0.

## Acceptance criteria

- The Explore token table displays a non-zero `change24h` for at least the major liquid
  tokens (ETH/WETH, WBTC, USDC, AAVE, UNI, etc.) when CoinGecko is reachable, sourced
  directly from CoinGecko's `/simple/price` response.
- The Explore token table displays a non-zero `volume24h` for the same tokens.
- The Explore token table displays a non-zero `marketCap` for non-G$ tokens (G$ continues
  to use the on-chain `totalSupply × price` derivation).
- When CoinGecko is unreachable / rate-limited / running in test environment, the page
  gracefully shows `0` (current behaviour) — no crashes, no `NaN`, no `undefined`
  rendering.
- `change1h` and `change7d` continue to read `0` (CoinGecko `/simple/price` does not
  return them for free; out-of-scope for this task — track separately if needed).
- The G$ row continues to use on-chain `spotPrice` and `totalSupply` for price and market
  cap (the existing on-chain branch is preserved).
- The `sparkline7d` field continues to be a flat array for now (real sparklines require a
  separate paid endpoint or a per-coin call — out of scope; tracked in existing task
  `gooddollar-l2-explore-market-cap-sparkline-chart`).
- No new external dependencies. No new env vars.
- All existing explore tests pass.
- `npx -y react-doctor@latest . --verbose --diff` ≥ 75.

## Planning

### Research notes

**The CoinGecko endpoint is already free and supports everything we need.** The hook
already calls `/api/v3/simple/price?ids=...&vs_currencies=usd`. Adding
`&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true` returns
the extra fields per coin in the same response — no extra HTTP round trip, no rate-limit
impact. Sample response shape:

```json
{
  "ethereum": {
    "usd": 3012.45,
    "usd_market_cap": 362000000000,
    "usd_24h_vol": 18500000000,
    "usd_24h_change": -1.42
  }
}
```

**Cleanest place to extend the API surface.** `usePriceFeeds` already owns the singleton
fetch loop, the symbol→CoinGecko-id mapping, and the fallback behaviour. Extending it to
return a richer `quotes` object (in addition to the simpler `prices` map it already
returns, for backwards compat with all current callers) is the lowest-risk change:

- `prices: Record<symbol, number>` — kept exactly as-is (every existing caller still
  works).
- `quotes: Record<symbol, { price; change24h; volume24h; marketCap }>` — new, opt-in.

**G$ market cap stays on-chain.** The hook already overrides G$ price with the on-chain
spot price and derives G$ market cap from `totalSupply × price`. We keep that branch — it
is more accurate than CoinGecko for our devnet G$, and the test that asserts on-chain
takes precedence remains green.

**Failure modes.** If CoinGecko returns a response without one of the fields (e.g.
`usd_market_cap` is missing for a long-tail coin), we fall through to `0` — same as
today. No `undefined` rendering. We never throw on a missing field.

### Architecture diagram

```
                              Before
┌────────────────────────────────────────────────────────────────────┐
│  CoinGecko /simple/price?ids=...&vs_currencies=usd                  │
│        ↓                                                            │
│  usePriceFeeds → prices: Record<sym, number>                        │
│        ↓                                                            │
│  useOnChainMarketData:                                              │
│        change24h = 0, volume24h = 0, marketCap = 0  ← hardcoded     │
└────────────────────────────────────────────────────────────────────┘

                               After
┌────────────────────────────────────────────────────────────────────┐
│  CoinGecko /simple/price                                            │
│    ?ids=...&vs_currencies=usd                                       │
│    &include_24hr_change=true                                        │
│    &include_24hr_vol=true                                           │
│    &include_market_cap=true                                         │
│        ↓                                                            │
│  usePriceFeeds                                                      │
│    → prices: Record<sym, number>          (unchanged signature)     │
│    → quotes: Record<sym, Quote>           (NEW — change/vol/mcap)   │
│        ↓                                                            │
│  useOnChainMarketData:                                              │
│    change24h = quotes[sym]?.change24h ?? 0                          │
│    volume24h = quotes[sym]?.volume24h ?? 0                          │
│    marketCap = symbol === 'G$'                                      │
│                  ? circulatingSupply × price          (on-chain)    │
│                  : quotes[sym]?.marketCap ?? 0       (CoinGecko)    │
└────────────────────────────────────────────────────────────────────┘
```

### One-week decision

**Yes — fits well within one week.** Two file edits, both small:
1. Extend `frontend/src/lib/usePriceFeeds.ts` to optionally fetch the richer `quotes` shape
   (additive — no signature breakage).
2. Use `quotes` in `frontend/src/lib/useOnChainMarketData.ts` to populate `change24h`,
   `volume24h`, and `marketCap` (preserving the G$ on-chain branch).

Estimated effort: ~1 hour of implementation, ~30 minutes of testing & a manual `/explore`
walkthrough.

No need to split.

### Implementation plan

1. **Extend `frontend/src/lib/usePriceFeeds.ts`**:

   a. Define a `Quote` type:

   ```ts
   export type Quote = {
     price: number
     change24h: number   // percent, e.g. -1.42
     volume24h: number   // USD
     marketCap: number   // USD
   }
   ```

   b. Update `fetchCoinGeckoPrices` to fetch and return both `prices` and `quotes`:

   ```ts
   async function fetchCoinGeckoQuotes(symbols: string[]): Promise<{
     prices: Record<string, number>,
     quotes: Record<string, Quote>,
   }> {
     const ids = Array.from(new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean)))
     if (ids.length === 0) return { prices: {}, quotes: {} }

     const url = `${COINGECKO_BASE}/simple/price`
       + `?ids=${ids.join(',')}`
       + `&vs_currencies=usd`
       + `&include_24hr_change=true`
       + `&include_24hr_vol=true`
       + `&include_market_cap=true`
     const res = await fetch(url, { next: { revalidate: 60 } })
     if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
     const data: Record<string, {
       usd: number
       usd_24h_change?: number
       usd_24h_vol?: number
       usd_market_cap?: number
     }> = await res.json()

     const prices: Record<string, number> = {}
     const quotes: Record<string, Quote> = {}
     for (const [symbol, cgId] of Object.entries(COINGECKO_IDS)) {
       const entry = data[cgId]
       if (!entry || typeof entry.usd !== 'number') continue
       prices[symbol] = entry.usd
       quotes[symbol] = {
         price:     entry.usd,
         change24h: entry.usd_24h_change ?? 0,
         volume24h: entry.usd_24h_vol    ?? 0,
         marketCap: entry.usd_market_cap ?? 0,
       }
     }
     return { prices, quotes }
   }
   ```

   c. Update the singleton store to hold `quotes` alongside `prices`. Update the
      subscriber notification + the `usePriceFeeds` hook to expose `{ prices, quotes,
      isLive }`. Default `quotes` to `{}` on fallback so callers can safely
      `quotes[sym]?.change24h ?? 0`.

   d. **Backwards compat**: do **not** remove or rename `prices` — every existing caller
      keeps working unchanged.

2. **Update `frontend/src/lib/useOnChainMarketData.ts`**:

   a. Destructure `quotes` from `usePriceFeeds`:
      `const { prices: cgPrices, quotes: cgQuotes, isLive: isCgLive } = usePriceFeeds(ALL_SYMBOLS)`

   b. In the `.map()` over `TOKENS`, replace the hardcoded zeros:

   ```ts
   const q = cgQuotes[t.symbol]
   const circulatingSupply = t.symbol === 'G$' ? gdCirculatingSupply : undefined
   const marketCap = t.symbol === 'G$'
     ? (circulatingSupply ? circulatingSupply * price : 0)
     : (q?.marketCap ?? 0)
   return {
     ...t,
     price,
     change1h:  0,                         // CoinGecko /simple/price does not return 1h
     change24h: q?.change24h ?? 0,         // ← now real
     change7d:  0,                         // out of scope
     volume24h: q?.volume24h ?? 0,         // ← now real
     marketCap,                            // ← now real for non-G$
     sparkline7d: [price, price, price, price, price, price, price],
     ...
   }
   ```

3. **Update the `useMemo` dependency array** in `useOnChainMarketData` to include
   `cgQuotes`.

4. **Verify**:
   - `cd frontend && npm test` → existing tests still pass.
   - Run `npm run dev`, visit `/explore` — confirm ETH/WBTC show realistic 24h change %
     and volume; G$ retains its on-chain market cap; "Top Gainers" populates.
   - Disconnect from network (or block CoinGecko at hosts level) — confirm Explore page
     still renders with all-zero stats and no crash.
   - `npx -y react-doctor@latest . --verbose --diff` ≥ 75.

5. **Update `README.md`** per the initiative's mandatory README rule:
   - Bump commit count.
   - Update `Updated:` date.

6. **Commit** with message:
   `explore: pull real change24h/volume24h/marketCap from CoinGecko (was hardcoded 0)`.

### Risks / mitigations

- **Risk:** CoinGecko free-tier rate limits (5–15 calls/minute). **Mitigation:** the hook
  is a module-level singleton; one fetch every 60s regardless of subscriber count. We are
  not increasing call frequency, only adding query-string params to the existing call.
- **Risk:** Existing `usePriceFeeds` consumers break from a signature change.
  **Mitigation:** the `prices` field name and shape are unchanged; `quotes` is purely
  additive. All current callers (`useOnChainMarketData`, `usePortfolioReads`,
  `useOnChainPredict` if it consumes prices, etc.) keep working unchanged.
- **Risk:** A new TypeScript error in a downstream component because we widen the hook's
  return type. **Mitigation:** widen by *adding* a key (`quotes`) — existing destructures
  ignore it, so no error. Confirmed by `tsc --noEmit` after the edit.
- **Risk:** SSR cache via `next: { revalidate: 60 }` returns stale data with the *old*
  query string. **Mitigation:** Next.js cache key includes the full URL, so adding new
  query params produces a new cache key — no stale-cache hit possible.
- **Risk:** Tests run without network access and a CoinGecko fetch hangs. **Mitigation:**
  the hook already detects test environment (`!window`) and short-circuits to fallback
  prices; we keep that branch and just return `quotes: {}` from it. Confirmed by reading
  the existing fallback branch in `usePriceFeeds.ts`.
