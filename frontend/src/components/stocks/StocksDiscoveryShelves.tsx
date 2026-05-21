import Link from 'next/link'
import type { Stock } from '@/lib/stockData'
import { formatStockPrice } from '@/lib/stockData'

type ShelfProps = {
  title: string
  subtitle: string
  items: Stock[]
  isLoading: boolean
}

function Shelf({ title, subtitle, items, isLoading }: ShelfProps) {
  return (
    <section className="rounded-2xl border border-gray-700/20 bg-dark-100 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {isLoading ? (
        <div
          className="space-y-2"
          role="status"
          aria-live="polite"
          aria-label={`${title} loading`}
        >
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`${title}-skeleton-${idx}`} className="h-11 rounded-lg bg-dark-50/50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 py-4">No signals yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((stock) => (
            <Link
              key={`${title}-${stock.ticker}`}
              href={`/stocks/${stock.ticker}`}
              prefetch={false}
              className="flex items-center justify-between rounded-lg border border-gray-700/25 bg-dark-50/25 px-3 py-2 hover:bg-dark-50/45 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{stock.ticker}</p>
                <p className="text-[11px] text-gray-500 truncate">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-300">{formatStockPrice(stock.price)}</p>
                <p className={`text-xs font-semibold ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change24h >= 0 ? '+' : ''}
                  {stock.change24h.toFixed(2)}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export function StocksDiscoveryShelves({
  dailyMovers,
  trending,
  analysisPicks,
  isLoading,
}: {
  dailyMovers: Stock[]
  trending: Stock[]
  analysisPicks: Stock[]
  isLoading: boolean
}) {
  return (
    <div className="mb-5 grid gap-3 md:grid-cols-3" aria-label="Stocks discovery shelves">
      <Shelf
        title="Daily Movers"
        subtitle="Largest 24h moves"
        items={dailyMovers}
        isLoading={isLoading}
      />
      <Shelf
        title="Trending Stocks"
        subtitle="Highest activity right now"
        items={trending}
        isLoading={isLoading}
      />
      <Shelf
        title="Market Analysis"
        subtitle="Analyst-backed opportunity picks"
        items={analysisPicks}
        isLoading={isLoading}
      />
    </div>
  )
}
