'use client'

import { useEffect, useState } from 'react'
import { LivePriceStrip, type LivePriceEntry } from './LivePriceStrip'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
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
 * currently has exposure to (stocks ∪ perp underlyings). Resolves source
 * attribution by composing the chain-backed `useStockPrices` for stocks and
 * the on-chain / CoinGecko mix from `usePriceFeeds` for crypto.
 *
 * Honors session state — sAAPL after-hours shows "Market closed" instead of
 * a bare price.
 */
export function PortfolioPriceStrip({
  stockTickers,
  cryptoSymbols,
  className = '',
}: PortfolioPriceStripProps) {
  const stockTickersDedup = Array.from(new Set(stockTickers))
  const cryptoDedup = Array.from(new Set(cryptoSymbols))

  const { prices: cryptoPrices, sources: cryptoSources, quotes, lastUpdated } = usePriceFeeds(cryptoDedup)
  const { prices: stockPrices, sources: stockSources } = useStockPrices()
  const { status } = usePriceServiceStatus()

  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const updatedAgoMs = lastUpdated ? now - lastUpdated.getTime() : null

  const entries: LivePriceEntry[] = []

  for (const ticker of stockTickersDedup) {
    const baseSource = stockSources[ticker] ?? 'fallback'
    const sq = status?.quotes.find(q => q.symbol === ticker)

    // Stocks-specific override: when sessionState says closed/halted, show it
    // even if the chain oracle has a last price. Stale → respect freshness.
    let finalSource: PriceSource = baseSource
    if (sq) {
      if (sq.sessionState === 'closed' || sq.sessionState === 'halted') {
        finalSource = 'closed'
      } else if (sq.lastUpdateMs > 60_000) {
        // Only downgrade chain to stale; if it was already fallback, keep it.
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
      updatedAgoMs,
    })
  }

  for (const sym of cryptoDedup) {
    entries.push({
      symbol: sym,
      price: cryptoPrices[sym] ?? 0,
      change24h: quotes[sym]?.change24h ?? null,
      source: cryptoSources[sym] ?? 'unknown',
      updatedAgoMs,
    })
  }

  return <LivePriceStrip entries={entries} className={className} />
}
