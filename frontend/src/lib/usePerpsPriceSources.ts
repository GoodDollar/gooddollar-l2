'use client'

/**
 * usePerpsPriceSources — per-pair price provenance for the /perps surface.
 *
 * Lane 4 (`0007d-app-integration`, task 0003) wants every perp price the
 * user sees — pair selector, pair info bar, chart header, open positions
 * — to carry an honest source attribution.
 *
 * Composition:
 *   - `useOnChainPairs` — provides `pair.markPrice`; > 0 means the chain
 *     oracle answered for that market. We treat that as `chain-oracle`.
 *   - `usePriceServiceStatus` — per-symbol session/freshness/source info.
 *     Used to override the chain win with `closed` / `stale` / `etoro-demo`
 *     where the upstream tells us trading is not really live.
 *
 * The result is a plain `Record<pairSymbol, PriceSource>` and a tiny
 * `LivePriceEntry[]` builder helper. No new wagmi reads — just composing
 * what /perps already subscribes to.
 */

import { useMemo } from 'react'
import { useOnChainPairs } from './useOnChainPerps'
import { usePriceServiceStatus } from './usePriceServiceStatus'
import { usePriceFeeds } from './usePriceFeeds'
import { resolvePriceSource, type PriceSource } from './priceSource'
import type { LivePriceEntry } from '@/components/LivePriceStrip'

interface QuoteWithMaybeSource {
  lastUpdateMs: number
  sessionState: string
  source?: string
}

function findStatusQuote(
  quotes: Array<{ symbol: string; lastUpdateMs: number; sessionState: string; source?: string }> | undefined,
  baseAsset: string,
): QuoteWithMaybeSource | undefined {
  if (!quotes) return undefined
  // price-service status entries can be keyed by base asset (e.g. "BTC")
  // OR by the perp pair (e.g. "BTC-USD") depending on upstream config.
  // Try both for robustness.
  const direct = quotes.find(q => q.symbol === baseAsset)
  if (direct) return direct
  return quotes.find(q => q.symbol === `${baseAsset}-USD`)
}

export interface PerpsPriceSources {
  /** Map keyed by perp pair symbol (e.g. "BTC-USD"). */
  sources: Record<string, PriceSource>
  /** Convenience: build a `LivePriceEntry[]` for `LivePriceStrip`. */
  buildEntries: (symbols: string[]) => LivePriceEntry[]
}

export function usePerpsPriceSources(): PerpsPriceSources {
  const { pairs } = useOnChainPairs()
  const { status } = usePriceServiceStatus()

  // Subscribe to CoinGecko for every base asset we have a pair for so the
  // resolver can fall through to `coingecko` (instead of `fallback`) for
  // BTC/ETH whenever the chain RPC is down and `useOnChainPairs` has
  // substituted `FALLBACK_PAIRS` rows (`isFallback: true`). Task 0033.
  const baseAssets = useMemo(
    () => Array.from(new Set(pairs.map(p => p.baseAsset))),
    [pairs],
  )
  const feeds = usePriceFeeds(baseAssets)

  return useMemo(() => {
    const sources: Record<string, PriceSource> = {}
    for (const pair of pairs) {
      // A `FALLBACK_PAIRS` substitution (RPC unreachable) is NOT an on-chain
      // read — labelling it `chain-oracle` would silently re-create the
      // cross-page price lies task 0021/0026 fixed elsewhere. Treat it as
      // absent and let the resolver fall through to coingecko/fallback.
      const chainOk = !pair.isFallback && pair.markPrice > 0
      const sq = findStatusQuote(status?.quotes, pair.baseAsset)

      // /perps-specific policy: explicit session-closure on the underlying
      // market dominates the chain reading. Even if the oracle still has a
      // last price, the user cannot actually trade at it while the market
      // is closed or halted, so surfacing "Market closed" is the honest UI.
      // This is layered on top of the generic resolver in `priceSource.ts`,
      // which preserves the "chain wins always" contract for surfaces that
      // intentionally don't care about session state (e.g. /analytics).
      if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) {
        sources[pair.symbol] = 'closed'
        continue
      }

      sources[pair.symbol] = resolvePriceSource({
        chainOk,
        coinGeckoLive: feeds.sources[pair.baseAsset] === 'coingecko',
        statusQuote: sq && {
          lastUpdateMs: sq.lastUpdateMs,
          sessionState: sq.sessionState,
          source: sq.source,
        },
        hasFallback: true, // /perps always has FALLBACK_PAIRS as last resort
      })
    }

    const buildEntries = (symbols: string[]): LivePriceEntry[] => {
      return symbols.map(symbol => {
        const pair = pairs.find(p => p.symbol === symbol)
        if (!pair || pair.markPrice <= 0) {
          // Task 0036: never render `$0.000000` for a missing pair; the
          // LivePriceCard surfaces `null` as an em-dash + "Feed pending".
          return {
            symbol,
            price: null,
            change24h: null,
            source: 'unknown' as const,
            updatedAgoMs: null,
          }
        }
        return {
          symbol,
          price: pair.markPrice,
          change24h: pair.change24h ?? null,
          source: sources[pair.symbol] ?? 'unknown',
          updatedAgoMs: null,
        }
      })
    }

    return { sources, buildEntries }
  }, [pairs, status, feeds.sources])
}
