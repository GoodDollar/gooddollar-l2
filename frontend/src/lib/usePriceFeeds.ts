'use client'

/**
 * usePriceFeeds — live USD price data via CoinGecko public API.
 *
 * Architecture: shared module-level singleton.
 *  - One fetch per refresh tick, regardless of how many components subscribe.
 *  - One setInterval, started on first subscriber, cleared on last unsubscribe.
 *  - Subscribers union their requested symbols into a single tracked set.
 *  - When a brand-new symbol is added, an immediate refetch fires so the new
 *    consumer does not wait up to 60s for its data.
 *
 * Falls back to static mock prices when:
 *  - the fetch fails (network error, rate limit)
 *  - running in a test environment (no window)
 *  - the symbol is not in the CoinGecko mapping
 *
 * Prices refresh every 60 seconds.
 */

import { useState, useEffect } from 'react'
import type { PriceSource } from './priceSource'

// ─── CoinGecko ID mapping ─────────────────────────────────────────────────────

const COINGECKO_IDS: Record<string, string> = {
  ETH:   'ethereum',
  WETH:  'ethereum',
  WBTC:  'wrapped-bitcoin',
  USDC:  'usd-coin',
  USDT:  'tether',
  DAI:   'dai',
  'G$':  'good-dollar',
  LINK:  'chainlink',
  UNI:   'uniswap',
  AAVE:  'aave',
  ARB:   'arbitrum',
  OP:    'optimism',
  MKR:   'maker',
  COMP:  'compound-governance-token',
  SNX:   'havven',
  CRV:   'curve-dao-token',
  LDO:   'lido-dao',
  MATIC: 'matic-network',
}

// ─── Fallback (static) prices ─────────────────────────────────────────────────

export const FALLBACK_PRICES: Record<string, number> = {
  ETH:   3012.45,
  WETH:  3012.45,
  WBTC:  60125.80,
  USDC:  1.00,
  USDT:  1.00,
  DAI:   1.00,
  'G$':  0.0102,
  LINK:  14.85,
  UNI:   7.92,
  AAVE:  89.50,
  ARB:   1.18,
  OP:    2.45,
  MKR:   2814.00,
  COMP:  49.80,
  SNX:   2.95,
  CRV:   0.58,
  LDO:   2.18,
  MATIC: 0.71,
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

const REFRESH_MS = 60_000

/**
 * Per-symbol market quote pulled from CoinGecko (via server-side proxy).
 * Missing fields (e.g. for tokens CoinGecko doesn't surface volume on) fall
 * back to 0 — callers should treat 0 as "not available" not "literally zero".
 */
export type Quote = {
  price: number
  /** 24h price change in percent, e.g. -1.42 means -1.42%. */
  change24h: number
  /** 24h trading volume in USD. */
  volume24h: number
  /** Market capitalisation in USD. */
  marketCap: number
}

interface CoinGeckoSimpleEntry {
  usd?: number
  usd_24h_change?: number
  usd_24h_vol?: number
  usd_market_cap?: number
}

async function fetchCoinGeckoQuotes(
  symbols: string[],
): Promise<{
  prices: Record<string, number>
  quotes: Record<string, Quote>
  unknownSymbols: string[]
}> {
  // Compute client-side "unknown" set up front so we surface it even when we
  // early-return without hitting the server, or when the server response is
  // the legacy shape (no unknownSymbols field).
  const clientUnknown = symbols.filter(s => !COINGECKO_IDS[s])
  const ids = Array.from(new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean)))
  if (ids.length === 0) {
    return { prices: {}, quotes: {}, unknownSymbols: clientUnknown }
  }

  const res = await fetch(`/api/prices?symbols=${symbols.join(',')}`)

  // Task 0027: the server now returns 400 + `code: "no_supported_symbols"`
  // when every requested symbol is unmapped. Defensively handle that — even
  // though `ids.length === 0` above usually short-circuits first, the
  // server's symbol table and the client's can drift.
  if (res.status === 400) {
    type ErrEnvelope = { code?: string; details?: { unknownSymbols?: unknown } }
    let body: ErrEnvelope = {}
    try { body = (await res.json()) as ErrEnvelope } catch { /* ignore */ }
    if (body.code === 'no_supported_symbols') {
      const reported = Array.isArray(body.details?.unknownSymbols)
        ? (body.details!.unknownSymbols as unknown[]).filter(
            (x): x is string => typeof x === 'string',
          )
        : symbols
      return { prices: {}, quotes: {}, unknownSymbols: reported }
    }
  }

  if (!res.ok) throw new Error(`Price proxy ${res.status}`)

  // New server shape is a strict superset of the legacy Coingecko shape:
  // top-level coingecko keys are still present (for backward compat) AND new
  // fields (`prices`, `requested`, `unknownSymbols`) sit alongside. Tests
  // and older callers that mock the bare shape continue to work — we just
  // read `unknownSymbols` when present.
  type ServerEnvelope = Record<string, CoinGeckoSimpleEntry | unknown> & {
    unknownSymbols?: unknown
  }
  const data = (await res.json()) as ServerEnvelope

  const serverUnknown = Array.isArray(data.unknownSymbols)
    ? (data.unknownSymbols as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      )
    : null

  const prices: Record<string, number> = {}
  const quotes: Record<string, Quote> = {}
  for (const sym of symbols) {
    const id = COINGECKO_IDS[sym]
    if (!id) continue
    const entry = data[id] as CoinGeckoSimpleEntry | undefined
    if (!entry || typeof entry.usd !== 'number') continue

    prices[sym] = entry.usd
    quotes[sym] = {
      price:     entry.usd,
      change24h: typeof entry.usd_24h_change   === 'number' ? entry.usd_24h_change   : 0,
      volume24h: typeof entry.usd_24h_vol      === 'number' ? entry.usd_24h_vol      : 0,
      marketCap: typeof entry.usd_market_cap   === 'number' ? entry.usd_market_cap   : 0,
    }
  }
  // Prefer the server's view (authoritative re: supported symbols today),
  // fall back to the client-computed set for legacy/mocked responses.
  return { prices, quotes, unknownSymbols: serverUnknown ?? clientUnknown }
}

// ─── Public state shape ───────────────────────────────────────────────────────

export interface PriceFeedState {
  prices: Record<string, number>
  /**
   * Per-symbol market quotes including price, 24h change %, 24h volume,
   * and market cap. Empty until the first successful fetch.
   */
  quotes: Record<string, Quote>
  isLive: boolean
  lastUpdated: Date | null
  error: string | null
  /**
   * Subset of the requested symbols that the price proxy could not resolve
   * (no Coingecko mapping). Empty when every requested symbol is supported.
   * Consumers should use this to render a warning chip instead of silently
   * showing a 0 / fallback price. See task 0027.
   */
  unknownSymbols: string[]
  /**
   * Per-symbol price provenance — `coingecko` once /api/prices returned a
   * value for the symbol, `fallback` for any tracked symbol we have only a
   * cached/static value for. Added in lane 4 (task 0007d/0002) so every
   * consumer can render an honest source attribution without inspecting the
   * fetch internals. Empty until the first refresh tick.
   */
  sources: Record<string, PriceSource>
}

// ─── Shared singleton store ───────────────────────────────────────────────────

type Subscriber = (state: PriceFeedState) => void

interface PriceFeedStore {
  state: PriceFeedState
  /** Refcounts per symbol so we know when to drop one from the tracked set. */
  refs: Map<string, number>
  subscribers: Set<Subscriber>
  intervalId: ReturnType<typeof setInterval> | null
  /** Guards against overlapping in-flight fetches. */
  inFlight: boolean
}

const store: PriceFeedStore = {
  state: {
    prices: FALLBACK_PRICES,
    quotes: {},
    isLive: false,
    lastUpdated: null,
    error: null,
    unknownSymbols: [],
    sources: {},
  },
  refs: new Map(),
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
}

/**
 * Pending mount-time refresh, scheduled on the next microtask so
 * co-mounted subscribers in the same React commit (e.g. SwapPriceChart
 * with ['ETH','G$'] alongside SwapCard with the full 18-symbol set)
 * union their `acquire()` calls into a single `/api/prices` fetch
 * against the now-complete tracked set instead of firing one wasted
 * subset fetch immediately followed by the full superset fetch. The
 * visibility-return path and the 60 s interval refresh deliberately
 * stay synchronous — they always read the full unioned set already
 * and a tab-return user shouldn't pay one microtask of latency. See
 * task 0053.
 */
let pendingRefresh: Promise<void> | null = null

function scheduleRefresh(): void {
  if (pendingRefresh !== null) return
  pendingRefresh = Promise.resolve().then(() => {
    pendingRefresh = null
    if (store.subscribers.size === 0) return
    void refresh()
  })
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

function trackedSymbols(): string[] {
  return Array.from(store.refs.keys())
}

async function refresh(): Promise<void> {
  if (store.inFlight) return
  // Skip work while the tab is hidden so a backgrounded landing page does not
  // ping CoinGecko forever. handleVisibilityChange below fires an immediate
  // refresh the moment the tab becomes visible again so prices stay fresh.
  if (typeof document !== 'undefined' && document.hidden) return
  const symbols = trackedSymbols()
  if (symbols.length === 0) return

  store.inFlight = true
  try {
    const { prices: live, quotes, unknownSymbols } = await fetchCoinGeckoQuotes(symbols)

    const nextSources: Record<string, PriceSource> = {}
    for (const sym of symbols) {
      nextSources[sym] = live[sym] !== undefined ? 'coingecko' : 'fallback'
    }

    store.state = {
      prices: { ...store.state.prices, ...live },
      quotes: { ...store.state.quotes, ...quotes },
      isLive: Object.keys(live).length > 0,
      lastUpdated: new Date(),
      error: null,
      // Replace (don't accumulate) so dropping a subscriber that was the only
      // one asking for an unknown symbol also drops it from the surfaced list.
      // We always send the full trackedSymbols() set, so the response covers it.
      unknownSymbols,
      sources: { ...store.state.sources, ...nextSources },
    }
  } catch (err) {
    const fallbackSources: Record<string, PriceSource> = { ...store.state.sources }
    for (const sym of symbols) fallbackSources[sym] = 'fallback'
    store.state = {
      ...store.state,
      isLive: false,
      error: err instanceof Error ? err.message : 'Price feed unavailable',
      sources: fallbackSources,
      // Leave unknownSymbols alone on transient network errors so any prior
      // warning surfaces stay rendered until the next successful refresh.
    }
  } finally {
    store.inFlight = false
    notify()
  }
}

/**
 * Module-level handler so add/remove pair on the exact same reference.
 * Fires one immediate refresh when the tab returns to the foreground.
 */
function handleVisibilityChange(): void {
  if (typeof document === 'undefined') return
  if (!document.hidden) void refresh()
}

function startIntervalIfNeeded(): void {
  if (store.intervalId !== null) return
  if (typeof window === 'undefined') return // SSR: no interval
  store.intervalId = setInterval(refresh, REFRESH_MS)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
}

function stopIntervalIfIdle(): void {
  if (store.subscribers.size > 0) return
  if (store.intervalId !== null) {
    clearInterval(store.intervalId)
    store.intervalId = null
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
}

/**
 * Increment refcount for each symbol; return the list of symbols that became
 * tracked for the first time (we'll trigger an immediate refetch for those).
 */
function acquire(symbols: string[]): string[] {
  const newlyTracked: string[] = []
  for (const sym of symbols) {
    const cur = store.refs.get(sym) ?? 0
    if (cur === 0) newlyTracked.push(sym)
    store.refs.set(sym, cur + 1)
  }
  return newlyTracked
}

function release(symbols: string[]): void {
  for (const sym of symbols) {
    const cur = store.refs.get(sym) ?? 0
    if (cur <= 1) {
      store.refs.delete(sym)
    } else {
      store.refs.set(sym, cur - 1)
    }
  }
}

// ─── Test-only reset (used by unit tests) ─────────────────────────────────────

/** @internal — exported for tests only. Resets the singleton to initial state. */
export function __resetPriceFeedStoreForTests(): void {
  if (store.intervalId !== null) {
    clearInterval(store.intervalId)
    store.intervalId = null
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
  store.refs.clear()
  store.subscribers.clear()
  store.inFlight = false
  pendingRefresh = null
  store.state = {
    prices: FALLBACK_PRICES,
    quotes: {},
    isLive: false,
    lastUpdated: null,
    error: null,
    unknownSymbols: [],
    sources: {},
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns live USD prices for the given token symbols.
 * On error, falls back to FALLBACK_PRICES.
 *
 * Multiple components calling this hook share a single store and a single
 * fetch/interval — there is no per-consumer network cost.
 *
 * @param symbols - list of token symbols to watch (e.g. ['ETH', 'USDC'])
 */
export function usePriceFeeds(symbols: string[]): PriceFeedState {
  const [snapshot, setSnapshot] = useState<PriceFeedState>(store.state)
  // Stable key so we only re-subscribe when the symbol set actually changes.
  const key = symbols.join(',')

  useEffect(() => {
    const subscriber: Subscriber = next => setSnapshot(next)
    store.subscribers.add(subscriber)

    const newlyTracked = acquire(symbols)
    startIntervalIfNeeded()

    // If we added symbols not previously tracked, kick a fetch so this
    // consumer doesn't wait up to 60s for first data — deferred one
    // microtask so a co-mounted subscriber's incremental symbols join
    // the same fetch instead of triggering a wasted subset round-trip.
    if (newlyTracked.length > 0) {
      scheduleRefresh()
    } else {
      // Sync the new subscriber to the latest state once.
      setSnapshot(store.state)
    }

    return () => {
      store.subscribers.delete(subscriber)
      release(symbols)
      stopIntervalIfIdle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return snapshot
}

/**
 * Get a single price (synchronous, from preloaded state or fallback).
 */
export function getPrice(prices: Record<string, number>, symbol: string): number {
  return prices[symbol] ?? FALLBACK_PRICES[symbol] ?? 0
}
