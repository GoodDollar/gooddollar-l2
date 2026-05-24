'use client'

import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { useAttributedPrices } from '@/lib/useAttributedPrice'
import { useStockPrices } from '@/lib/useStockPrices'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import { resolvePriceSource, type PriceSource } from '@/lib/priceSource'

interface PortfolioPriceStripProps {
  /** Stock tickers the user holds (e.g. ["AAPL", "TSLA"]). */
  stockTickers: string[]
  /** Crypto symbols the user holds via perps / swap (e.g. ["ETH", "BTC"]). */
  cryptoSymbols: string[]
  className?: string
}

/**
 * Portfolio top-of-page strip. Renders one card per distinct symbol the user
 * currently has exposure to (stocks ∪ perp underlyings). Stock attribution
 * still composes `useStockPrices` + session-state from `usePriceServiceStatus`
 * (their pricing model is different). Crypto symbols go through the shared
 * `useAttributedPrice` hook so the BTC tile here matches /perps and /activity.
 */
export function PortfolioPriceStrip({
  stockTickers,
  cryptoSymbols,
  className = '',
}: PortfolioPriceStripProps) {
  const stockTickersDedup = Array.from(new Set(stockTickers))
  const cryptoDedup = Array.from(new Set(cryptoSymbols))

  const attributedCrypto = useAttributedPrices(cryptoDedup)
  const { prices: stockPrices, sources: stockSources } = useStockPrices()
  const { status } = usePriceServiceStatus()

  // O(1) lookup per ticker instead of array.find inside the loop.
  const statusBySymbol = new Map((status?.quotes ?? []).map(q => [q.symbol, q]))

  const entries: LivePriceEntry[] = []

  for (const ticker of stockTickersDedup) {
    const baseSource = stockSources[ticker] ?? 'fallback'
    const sq = statusBySymbol.get(ticker)

    let finalSource: PriceSource = baseSource
    if (sq) {
      if (sq.sessionState === 'closed' || sq.sessionState === 'halted') {
        finalSource = 'closed'
      } else if (sq.lastUpdateMs > 60_000) {
        finalSource = baseSource === 'chain-oracle' ? 'stale' : baseSource
      } else if (baseSource !== 'chain-oracle') {
        finalSource = resolvePriceSource({
          chainOk: false,
          statusQuote: { lastUpdateMs: sq.lastUpdateMs, sessionState: sq.sessionState },
          hasFallback: true,
        })
      }
    }

    entries.push({
      symbol: ticker,
      price: stockPrices[ticker] ?? 0,
      change24h: null,
      source: finalSource,
      // Chain-stock oracle does not surface a per-symbol timestamp through
      // useStockPrices, so the freshness footer falls back to "Updated just
      // now" / "Market closed" depending on `source` — see LivePriceCard.
      updatedAgoMs: null,
    })
  }

  for (const sym of cryptoDedup) {
    const a = attributedCrypto[sym]
    entries.push({
      symbol: sym,
      price: a?.priceUsd ?? 0,
      change24h: a?.change24h ?? null,
      source: a?.source ?? 'unknown',
      updatedAgoMs: a?.ageMs ?? null,
      divergent: a?.divergent ?? false,
    })
  }

  return <LivePriceStrip entries={entries} className={className} />
}
