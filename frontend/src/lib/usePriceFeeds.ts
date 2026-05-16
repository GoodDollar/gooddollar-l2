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

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const REFRESH_MS = 60_000

/**
 * Per-symbol market quote pulled from CoinGecko.
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
): Promise<{ prices: Record<string, number>; quotes: Record<string, Quote> }> {
  const ids = Array.from(new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean)))
  if (ids.length === 0) return { prices: {}, quotes: {} }

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${ids.join(',')}` +
    `&vs_currencies=usd` +
    `&include_24hr_change=true` +
    `&include_24hr_vol=true` +
    `&include_market_cap=true`

  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)

  const data: Record<string, CoinGeckoSimpleEntry> = await res.json()

  const prices: Record<string, number> = {}
  const quotes: Record<string, Quote> = {}
  for (const sym of symbols) {
    const id = COINGECKO_IDS[sym]
    if (!id) continue
    const entry = data[id]
    if (!entry || typeof entry.usd !== 'number') continue

    prices[sym] = entry.usd
    quotes[sym] = {
      price:     entry.usd,
      change24h: typeof entry.usd_24h_change   === 'number' ? entry.usd_24h_change   : 0,
      volume24h: typeof entry.usd_24h_vol      === 'number' ? entry.usd_24h_vol      : 0,
      marketCap: typeof entry.usd_market_cap   === 'number' ? entry.usd_market_cap   : 0,
    }
  }
  return { prices, quotes }
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
  },
  refs: new Map(),
  subscribers: new Set(),
  intervalId: null,
  inFlight: false,
}

function notify(): void {
  for (const sub of store.subscribers) sub(store.state)
}

function trackedSymbols(): string[] {
  return Array.from(store.refs.keys())
}

async function refresh(): Promise<void> {
  if (store.inFlight) return
  const symbols = trackedSymbols()
  if (symbols.length === 0) return

  store.inFlight = true
  try {
    const { prices: live, quotes } = await fetchCoinGeckoQuotes(symbols)
    store.state = {
      prices: { ...store.state.prices, ...live },
      quotes: { ...store.state.quotes, ...quotes },
      isLive: Object.keys(live).length > 0,
      lastUpdated: new Date(),
      error: null,
    }
  } catch (err) {
    store.state = {
      ...store.state,
      isLive: false,
      error: err instanceof Error ? err.message : 'Price feed unavailable',
    }
  } finally {
    store.inFlight = false
    notify()
  }
}

function startIntervalIfNeeded(): void {
  if (store.intervalId !== null) return
  if (typeof window === 'undefined') return // SSR: no interval
  store.intervalId = setInterval(refresh, REFRESH_MS)
}

function stopIntervalIfIdle(): void {
  if (store.subscribers.size > 0) return
  if (store.intervalId !== null) {
    clearInterval(store.intervalId)
    store.intervalId = null
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
  }
  store.refs.clear()
  store.subscribers.clear()
  store.inFlight = false
  store.state = {
    prices: FALLBACK_PRICES,
    quotes: {},
    isLive: false,
    lastUpdated: null,
    error: null,
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

    // If we added symbols not previously tracked, kick an immediate fetch so
    // this consumer doesn't wait up to 60s for first data.
    if (newlyTracked.length > 0) {
      void refresh()
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
