import Link from 'next/link'
import type { Stock } from '@/lib/stockData'
import { formatStockPrice } from '@/lib/stockData'
import { isNoData, pctOrDash } from '@/lib/formatNoData'

export function RelatedMoversPanel({
  currentTicker,
  related,
  movers,
}: {
  currentTicker: string
  related: Stock[]
  movers: Stock[]
}) {
  // Live movers exclude the current ticker AND any symbol whose 24h change is
  // a "no data" sentinel (chain-path zero, NaN, etc.). Without this filter the
  // panel would render a green "+0.00%" wall and conflate "no oracle update"
  // with "real flat day". Mirrors the MarketIntelligencePanel empty-state
  // pattern from task 0009.
  const liveMovers = movers
    .filter((stock) => stock.ticker !== currentTicker && !isNoData(stock.change24h))
    .slice(0, 3)

  return (
    <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-4">
      <h3
        className="text-sm font-semibold text-white"
        title="Some fields show '—' when the price service has no live data yet."
      >
        Discover More Stocks
      </h3>

      <div className="mt-3">
        <p className="text-[11px] text-gray-500 mb-1.5">Related symbols</p>
        {related.length === 0 ? (
          <p className="text-xs text-gray-400">No related symbols available yet.</p>
        ) : (
          <div className="space-y-1.5">
            {related.map((stock) => (
              <Link
                key={`rel-${stock.ticker}`}
                href={`/stocks/${stock.ticker}`}
                prefetch={false}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-700/25 bg-dark-50/25 px-2.5 py-2 hover:bg-dark-50/40 transition-colors"
              >
                <span className="text-xs text-gray-200">{stock.ticker}</span>
                <span className="text-xs text-gray-400">{formatStockPrice(stock.price)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-gray-500 mb-1.5">Daily movers</p>
        {liveMovers.length === 0 ? (
          <p className="text-xs text-gray-400" data-testid="related-movers-empty">
            No live movers yet — waiting for feed.
          </p>
        ) : (
          <div className="space-y-1.5">
            {liveMovers.map((stock) => (
              <Link
                key={`mov-${stock.ticker}`}
                href={`/stocks/${stock.ticker}`}
                prefetch={false}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-700/25 bg-dark-50/25 px-2.5 py-2 hover:bg-dark-50/40 transition-colors"
              >
                <span className="text-xs text-gray-200">{stock.ticker}</span>
                <span className={`text-xs font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pctOrDash(stock.change24h)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
