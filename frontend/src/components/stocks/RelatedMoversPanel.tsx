import Link from 'next/link'
import type { Stock } from '@/lib/stockData'
import { formatStockPrice } from '@/lib/stockData'
import { hasLiveOracleChange } from '@/lib/oracleHonesty'

export function RelatedMoversPanel({
  currentTicker,
  related,
  movers,
}: {
  currentTicker: string
  related: Stock[]
  movers: Stock[]
}) {
  // Filter to peers with a real 24h-change reading. Without this gate the
  // "Daily movers" rail ranks the entire universe by +0.00% and renders
  // a flat-green wall of zeros that the user reads as a real signal.
  const liveMovers = movers
    .filter((stock) => stock.ticker !== currentTicker)
    .filter(hasLiveOracleChange)
    .slice(0, 3)

  return (
    <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-4">
      <h3 className="text-sm font-semibold text-white">Discover More Stocks</h3>

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
          <p className="text-xs text-gray-400">No 24h-change data from the oracle yet.</p>
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
                  {stock.change24h >= 0 ? '+' : ''}
                  {stock.change24h.toFixed(2)}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
