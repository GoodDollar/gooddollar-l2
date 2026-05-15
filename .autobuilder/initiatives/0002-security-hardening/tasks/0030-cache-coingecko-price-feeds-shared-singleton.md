---
id: cache-coingecko-price-feeds-shared-singleton
title: "Perf — Cache CoinGecko price feed across all components (5 hooks → 1 shared singleton, kills 3-5 redundant external API calls per page load)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [performance, frontend, caching, api-waterfall, coingecko, polish]
---

# Perf — Cache CoinGecko price feed across all components

## Why this task exists

This is the iteration #11 perf review with explicit focus on **API
waterfalls** and **missing caching**.

`usePriceFeeds()` is called from **5 different places** in the app —
each with its own `useState` and its own `setInterval(fetch, 60_000)`:

```
$ rg -n "usePriceFeeds\(" frontend/src
frontend/src/components/SwapCard.tsx:42:        usePriceFeeds(TOKENS.map(t => t.symbol))
frontend/src/app/(app)/stable/page.tsx:406:    usePriceFeeds(['WETH', 'G$', 'USDC'])
frontend/src/components/PortfolioOnChain.tsx:176: usePriceFeeds(['WETH', 'G$', 'USDC'])
frontend/src/components/SwapPriceChart.tsx:26:    usePriceFeeds([inputSymbol, outputSymbol])
frontend/src/lib/useOnChainMarketData.ts:95:      usePriceFeeds(ALL_SYMBOLS)
```

The implementation in `frontend/src/lib/usePriceFeeds.ts` has **no
shared cache** — every consumer mounts its own React state and fires
its own `fetch` against
`https://api.coingecko.com/api/v3/simple/price?ids=...` on mount and
again every 60 seconds:

```ts
// frontend/src/lib/usePriceFeeds.ts
export function usePriceFeeds(symbols: string[]): PriceFeedState {
  const [state, setState] = useState<PriceFeedState>(...)

  const fetch_ = useCallback(async () => {
    const live = await fetchCoinGeckoPrices(symbols)  // ← one fetch per consumer
    setState(prev => ({ ...prev, prices: { ...prev.prices, ...live }, ... }))
  }, [symbols.join(',')])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, REFRESH_MS)        // ← one interval per consumer
    return () => clearInterval(id)
  }, [fetch_])

  return state
}
```

`fetchCoinGeckoPrices` does pass `next: { revalidate: 60 }` to
`fetch()`, but that hint is only honored by Next.js' server-side data
cache — it does **nothing in the browser**, where `usePriceFeeds()`
actually runs (the file is `'use client'`). On the client every call
goes straight to CoinGecko.

### Hard evidence — observed redundant fetches

The `/stable` page has the worst case:

| Component on `/stable`            | `usePriceFeeds(...)` symbols           |
|-----------------------------------|----------------------------------------|
| `app/(app)/stable/page.tsx`       | `['WETH', 'G$', 'USDC']`               |
| `<PortfolioOnChain>` (in layout)  | `['WETH', 'G$', 'USDC']`               |
| `<SwapCard>` (if rendered nearby) | all 18 `TOKENS` symbols                |

That's **3 simultaneous CoinGecko requests on first paint** — two of
them asking for the *exact same set of IDs* — and then 3 more every
60 seconds for as long as the user stays on the page. With 5 mount
sites total across the app a power user navigating around in a single
session can easily generate 30+ CoinGecko hits per minute.

CoinGecko's free tier limits us to **5–15 requests/min/IP**. We are
already running into 429s in dev, which is exactly why the hook silently
falls back to `FALLBACK_PRICES` and shows users a stale `0.0102` G$
price instead of the real one. The dollar values shown next to portfolio
positions become incorrect, which compounds into wrong health-factor
math in `<StableVaultRow>`.

This is a textbook **missing caching + API waterfall** issue: each
consumer is doing the same network work in parallel, no sharing, no
deduplication, no React Query.

## Acceptance Criteria

A.  All 5 sites that call `usePriceFeeds(...)` share a single in-memory
    cache of CoinGecko results keyed by symbol — no consumer ever
    triggers a duplicate fetch for symbols another consumer just
    fetched.
B.  Only **one** outbound fetch to
    `https://api.coingecko.com/api/v3/simple/price?...` is in flight at
    a time across the whole tab, regardless of how many components
    mount.
C.  The 60-second refresh is driven by **one** `setInterval`, not
    one-per-consumer. Mounting/unmounting components does not start or
    stop the global interval (it only starts when ≥ 1 consumer is
    mounted, and stops when the last one unmounts — ref-count, not
    component-count).
D.  Public API of `usePriceFeeds(symbols: string[]): PriceFeedState`
    stays exactly the same. No call sites change.
E.  Fallback semantics stay the same: on fetch error or unknown symbol,
    consumers still see `FALLBACK_PRICES`, with `isLive = false`.
F.  The existing test
    `frontend/src/lib/__tests__/usePriceFeeds.test.ts` still passes
    unchanged. New tests cover:
    - Two simultaneous `usePriceFeeds(['WETH','G$'])` mounts only fire
      `fetch` once.
    - The global interval is cleared after the last consumer unmounts.
    - Two consumers requesting overlapping symbols share results.
G.  The `/stable` page in dev (`http://localhost:3100/stable`) shows
    only **one** request to `simple/price` in DevTools Network tab on
    initial paint, and only one new request every 60s thereafter.

## Implementation Sketch

Replace the per-component state machinery with a small module-scoped
cache + subscriber pattern in `frontend/src/lib/usePriceFeeds.ts`:

```ts
// Module-level singletons (browser-only — file is 'use client')
let cachedPrices: Record<string, number> = { ...FALLBACK_PRICES }
let cachedAt: Date | null = null
let inFlight: Promise<void> | null = null
let intervalId: ReturnType<typeof setInterval> | null = null
const subscribers = new Set<() => void>()
const requestedSymbols = new Set<string>()  // union of all consumer symbol sets

function notifyAll() {
  subscribers.forEach(cb => cb())
}

async function refresh(): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const live = await fetchCoinGeckoPrices(Array.from(requestedSymbols))
      cachedPrices = { ...cachedPrices, ...live }
      cachedAt = new Date()
      notifyAll()
    } catch {
      // keep stale cache + FALLBACK_PRICES; mark non-live
      notifyAll()
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

function ensureInterval() {
  if (intervalId !== null) return
  intervalId = setInterval(() => { refresh() }, REFRESH_MS)
}

function maybeStopInterval() {
  if (subscribers.size === 0 && intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function usePriceFeeds(symbols: string[]): PriceFeedState {
  // Register requested symbols once per render
  useEffect(() => {
    symbols.forEach(s => requestedSymbols.add(s))
  }, [symbols.join(',')])

  // Force-render subscriber on cache change
  const [, force] = useReducer(x => x + 1, 0)

  useEffect(() => {
    subscribers.add(force)
    ensureInterval()
    refresh()                      // immediate first fetch (deduped via inFlight)
    return () => {
      subscribers.delete(force)
      maybeStopInterval()
    }
  }, [])

  return {
    prices: cachedPrices,
    isLive: cachedAt !== null,
    lastUpdated: cachedAt,
    error: null,
  }
}
```

The shape (`PriceFeedState`) and `getPrice()` helper stay unchanged so
no call site needs edits.

## Files in scope

- `frontend/src/lib/usePriceFeeds.ts` — rewrite internals, keep
  exports identical.
- `frontend/src/lib/__tests__/usePriceFeeds.test.ts` — keep existing
  tests passing, add 3 new tests for dedup / shared interval /
  ref-count cleanup.

## Out of scope

- Migrating to `@tanstack/react-query` for this hook (would be a much
  bigger change; this task uses plain module state to ship the win
  fast). Can be revisited later.
- Any change to call sites of `usePriceFeeds(...)`.
- Any change to `fetchCoinGeckoPrices` itself or to
  `FALLBACK_PRICES`.

## Definition of Done

- `cd frontend && npm test -- usePriceFeeds` is green.
- DevTools Network on `/stable` shows ONE
  `api.coingecko.com/api/v3/simple/price` request on first paint, not
  three.
- A second mount of `<PortfolioOnChain>` in a test (or in dev via
  React Strict Mode) does not produce a second CoinGecko request.
- `npx -y react-doctor@latest . --verbose --diff` passes (≥ 75) on the
  modified file.
- README "Security Hardening / Performance" section gets a one-line
  entry under iteration #11.
