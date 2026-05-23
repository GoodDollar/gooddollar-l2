'use client'

/**
 * useAttributedPrice — single shared "what does this symbol cost" hook.
 *
 * Lane 4 (`0007d-app-integration`, task 0021) fixes a class of bug where the
 * same asset surfaces at two different dollar values across `/perps`,
 * `/activity`, `/analytics`, `/portfolio`, and the landing hero, because each
 * surface composes its own mix of chain-oracle + CoinGecko + fallback.
 *
 * This hook collapses those choices into one canonical resolver:
 *
 *   useAttributedPrice('BTC')  → { priceUsd, source, change24h, ageMs,
 *                                  divergent, divergenceOtherUsd }
 *
 * Precedence is the same as `resolvePriceSource()` in `priceSource.ts`:
 *
 *   1. chain-oracle  (perp pair `baseAsset === baseSymbol` & `markPrice > 0`)
 *   2. coingecko     (`usePriceFeeds.sources[sym] === 'coingecko'`)
 *   3. fallback      (`FALLBACK_PRICES[sym] !== undefined`)
 *   4. unknown
 *
 * Plus the standard session-state overrides (`stale`, `closed`) for symbols
 * the price-service marks accordingly.
 *
 * Aliasing: `WBTC` is normalised to `BTC` for **price only**. Token identity
 * (ticker text shown to the user, logos, contract) is unaffected — the hook
 * never rewrites the input symbol on output. Same treatment for `WETH → ETH`.
 *
 * Divergence: when both chain-oracle and CoinGecko have positive prices for
 * the same canonical symbol and they disagree by more than 0.5%, the hook
 * sets `divergent: true` and exposes the other feed's value in
 * `divergenceOtherUsd`. Consumers can render a "Source disagrees" chip
 * without re-deriving anything.
 */

import { useMemo } from 'react'
import { useOnChainPairs } from './useOnChainPerps'
import { usePriceFeeds, FALLBACK_PRICES } from './usePriceFeeds'
import { usePriceServiceStatus } from './usePriceServiceStatus'
import { resolvePriceSource, type PriceSource } from './priceSource'

const SYMBOL_ALIASES: Readonly<Record<string, string>> = {
  WBTC: 'BTC',
  WETH: 'ETH',
}

/**
 * Equivalence classes for price lookup. Two symbols in the same class share
 * a single canonical USD price (BTC ≡ WBTC, ETH ≡ WETH for price discovery
 * — the user-visible ticker is unchanged).
 */
const EQUIVALENT_SYMBOLS: Readonly<Record<string, readonly string[]>> = {
  BTC:  ['BTC', 'WBTC'],
  WBTC: ['BTC', 'WBTC'],
  ETH:  ['ETH', 'WETH'],
  WETH: ['ETH', 'WETH'],
}

function equivalents(symbol: string): readonly string[] {
  return EQUIVALENT_SYMBOLS[symbol] ?? [symbol]
}

/** Disagreement above this fraction triggers the divergence flag. */
export const DIVERGENCE_THRESHOLD = 0.005 // 0.5 %

export interface AttributedPrice {
  /** Echoes back the symbol the caller asked for (never the alias). */
  symbol: string
  /** Canonical USD price chosen from the winning source. */
  priceUsd: number
  source: PriceSource
  /** 24h price change in percent, when CoinGecko has a quote; else null. */
  change24h: number | null
  /** Age in ms of the underlying feed snapshot; null when unknown. */
  ageMs: number | null
  /**
   * True when both chain-oracle and CoinGecko fired with positive prices for
   * the same canonical symbol AND they disagree by more than
   * `DIVERGENCE_THRESHOLD`. Consumers should surface a chip when set.
   */
  divergent: boolean
  /** Other feed's price when `divergent` is true; else null. */
  divergenceOtherUsd: number | null
}

function normaliseSymbol(symbol: string): string {
  return SYMBOL_ALIASES[symbol] ?? symbol
}

function relativeDiff(a: number, b: number): number {
  if (a <= 0 || b <= 0) return 0
  const avg = (a + b) / 2
  return Math.abs(a - b) / avg
}

interface ResolverContext {
  symbol: string
  chainPrice: number
  cgPrice: number
  cgLive: boolean
  change24h: number | null
  ageMs: number | null
  statusQuote?: { lastUpdateMs: number; sessionState: string; source?: string }
}

/**
 * Pure: turn the three already-resolved feed snapshots into a single
 * `AttributedPrice`. Lifted out of the hook to keep the React layer thin and
 * the resolution logic unit-testable.
 */
function resolveAttribution(ctx: ResolverContext): AttributedPrice {
  const baseSymbol = normaliseSymbol(ctx.symbol)
  const chainOk = ctx.chainPrice > 0
  const hasFallback = FALLBACK_PRICES[ctx.symbol] !== undefined
    || FALLBACK_PRICES[baseSymbol] !== undefined

  const source = resolvePriceSource({
    chainOk,
    coinGeckoLive: ctx.cgLive,
    hasFallback,
    statusQuote: ctx.statusQuote,
  })

  const fallbackPrice = FALLBACK_PRICES[ctx.symbol] ?? FALLBACK_PRICES[baseSymbol] ?? 0

  let priceUsd: number
  switch (source) {
    case 'chain-oracle':
      priceUsd = ctx.chainPrice
      break
    case 'coingecko':
      priceUsd = ctx.cgPrice
      break
    case 'fallback':
      priceUsd = fallbackPrice
      break
    case 'stale':
    case 'closed':
    case 'etoro-demo':
      // Session-state overlays don't carry their own number; surface the
      // best last-known value so the UI still shows _something_ honest.
      priceUsd = chainOk ? ctx.chainPrice : ctx.cgPrice || fallbackPrice
      break
    case 'unknown':
      priceUsd = 0
      break
  }

  const bothPresent = chainOk && ctx.cgLive && ctx.chainPrice > 0 && ctx.cgPrice > 0
  const divergent = bothPresent && relativeDiff(ctx.chainPrice, ctx.cgPrice) > DIVERGENCE_THRESHOLD
  const divergenceOtherUsd = divergent
    ? (source === 'chain-oracle' ? ctx.cgPrice : ctx.chainPrice)
    : null

  return {
    symbol: ctx.symbol,
    priceUsd,
    source,
    change24h: ctx.change24h,
    ageMs: ctx.ageMs,
    divergent,
    divergenceOtherUsd,
  }
}

/**
 * Vector form. Call this once per surface with the full symbol set — every
 * dependency is shared, so multiple symbols cost no extra fetches.
 */
export function useAttributedPrices(symbols: string[]): Record<string, AttributedPrice> {
  const { pairs } = useOnChainPairs()

  // Expand the symbol set to cover every equivalent (e.g. asking for BTC
  // also subscribes to WBTC) so CoinGecko has whichever side actually has
  // a quote, and we can detect cross-symbol divergence.
  const expanded = Array.from(new Set(symbols.flatMap(s => equivalents(s))))
  const feeds = usePriceFeeds(expanded)
  const { status } = usePriceServiceStatus()

  // Stable key so we recompute only when the input set actually changes.
  const key = symbols.join(',')

  return useMemo(() => {
    const ageMs = feeds.lastUpdated ? Date.now() - feeds.lastUpdated.getTime() : null
    const out: Record<string, AttributedPrice> = {}

    for (const sym of symbols) {
      const baseSym = normaliseSymbol(sym)
      const chainPair = pairs.find(p => p.baseAsset === baseSym)
      const chainPrice = chainPair && chainPair.markPrice > 0 ? chainPair.markPrice : 0

      const equivs = equivalents(sym)
      const cgPrice = equivs.reduce<number>((acc, s) => acc || (feeds.prices[s] ?? 0), 0)
      const cgLive = equivs.some(s => feeds.sources[s] === 'coingecko')
      const change24h = equivs.reduce<number | null>(
        (acc, s) => acc ?? feeds.quotes[s]?.change24h ?? null, null,
      )

      const sq = status?.quotes.find(q =>
        q.symbol === sym || q.symbol === baseSym || q.symbol === `${baseSym}-USD`,
      )

      out[sym] = resolveAttribution({
        symbol: sym,
        chainPrice,
        cgPrice,
        cgLive,
        change24h,
        ageMs,
        statusQuote: sq && {
          lastUpdateMs: sq.lastUpdateMs,
          sessionState: sq.sessionState,
        },
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pairs, feeds.prices, feeds.sources, feeds.quotes, feeds.lastUpdated, status])
}

/** Single-symbol convenience wrapper around `useAttributedPrices`. */
export function useAttributedPrice(symbol: string): AttributedPrice {
  const map = useAttributedPrices([symbol])
  return map[symbol]
}
