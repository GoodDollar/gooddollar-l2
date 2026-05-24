'use client'

/**
 * PerpsMarketStructureCard — task 0043.
 *
 * Replaces the `<OrderBook>` / `<RecentTrades>` pair that used to render
 * next to the Open Positions panel on `/perps`. GoodPerps prices fills
 * off the chain oracle's mark and settles against an AMM-style margin
 * engine — there is no on-chain CLOB, so the old panels were pure
 * `Math.random()` invention. This card shows the honest picture: the
 * oracle mark, the index price, the open interest, plus a one-paragraph
 * explainer of where fills price.
 *
 * Mirrors `SyntheticStockQuotePanel` (task 0025) for /stocks/[ticker].
 */

import { formatPerpsPrice, formatLargeValue } from '@/lib/perpsData'
import type { PriceSource } from '@/lib/priceSource'
import { PriceSourceBadge } from '@/components/PriceSourceBadge'

interface PerpsMarketStructureCardProps {
  symbol: string
  markPrice: number
  indexPrice: number
  openInterestUsd: number
  source: PriceSource
}

export function PerpsMarketStructureCard({
  symbol, markPrice, indexPrice, openInterestUsd, source,
}: PerpsMarketStructureCardProps) {
  const hasMark = markPrice > 0
  const hasIndex = indexPrice > 0
  const hasOI = openInterestUsd > 0

  return (
    <section
      data-testid="perps-market-structure-card"
      className="p-5 text-xs"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">How GoodPerps prices fills</h3>
      </div>

      <ul className="space-y-2">
        <li
          data-testid="perps-market-row-mark"
          className="flex items-center justify-between gap-2"
        >
          <span className="text-gray-400">Mark price</span>
          <span className="flex items-baseline gap-2">
            <span className="text-white font-semibold">
              {hasMark ? formatPerpsPrice(markPrice) : '—'}
            </span>
            <PriceSourceBadge source={source} size="sm" />
          </span>
        </li>
        <li
          data-testid="perps-market-row-index"
          className="flex items-center justify-between gap-2"
        >
          <span className="text-gray-400">Index price</span>
          <span className="flex items-baseline gap-2">
            <span className="text-white font-medium">
              {hasIndex ? formatPerpsPrice(indexPrice) : '—'}
            </span>
            <PriceSourceBadge source={source} size="sm" />
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-gray-400">Open interest</span>
          <span className="text-white font-medium">
            {hasOI ? formatLargeValue(openInterestUsd) : '—'}
          </span>
        </li>
      </ul>

      <p className="mt-4 text-[11px] leading-snug text-gray-500">
        GoodPerps has no central order book.{' '}
        <span className="text-gray-300">{symbol}</span> trades against an
        oracle margin engine — your fills price off the chain mark above,
        with margin posted from your wallet. Use the order ticket to see a
        live fill estimate once you enter a size.
      </p>
    </section>
  )
}
