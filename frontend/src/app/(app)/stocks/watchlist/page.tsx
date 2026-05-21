'use client'

import { useMemo, memo, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatStockPrice, formatLargeNumber, type Stock } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { useWatchlist } from '@/lib/useWatchlist'
import { Sparkline } from '@/components/Sparkline'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { PercentageChange } from '@/components/ui/percentage-change'
import { WatchlistStarButton } from '@/components/stocks/WatchlistStarButton'

function StockIcon({ ticker }: { ticker: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-[10px] font-bold text-goodgreen shrink-0">
      {ticker.slice(0, 2)}
    </div>
  )
}

interface WatchlistRowProps {
  stock: Stock
  idx: number
  onRowClick: (ticker: string) => void
}

const WatchlistRow = memo(function WatchlistRow({ stock, idx, onRowClick }: WatchlistRowProps) {
  return (
    <tr
      onClick={() => onRowClick(stock.ticker)}
      className={`group border-b border-gray-700/10 hover:bg-white/[0.04] cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-dark-50/15' : ''}`}
    >
      <td className="py-3 px-3 text-gray-500 text-right">{idx + 1}</td>
      <td className="py-3 px-2 w-10">
        <WatchlistStarButton ticker={stock.ticker} size="sm" />
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <StockIcon ticker={stock.ticker} />
          <div>
            <span className="font-semibold text-white">{stock.ticker}</span>
            <span className="text-gray-500 ml-1.5 text-xs truncate max-w-[120px] inline-block align-middle">{stock.name}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right text-white font-medium">
        {formatStockPrice(stock.price)}
      </td>
      <td className="py-3 px-3 text-right font-medium">
        <PercentageChange value={stock.change24h} decimals={2} size="sm" />
      </td>
      <td className="py-3 px-3 text-right text-gray-300 hidden sm:table-cell">
        {formatLargeNumber(stock.volume24h)}
      </td>
      <td className="py-3 px-3 text-right text-gray-300 hidden md:table-cell">
        {formatLargeNumber(stock.marketCap)}
      </td>
      <td className="py-3 px-2 hidden sm:table-cell" aria-label={`7-day trend: ${stock.change24h >= 0 ? 'up' : 'down'} ${Math.abs(stock.change24h).toFixed(1)}%`}>
        <Sparkline data={stock.sparkline7d} positive={stock.change24h >= 0} />
      </td>
      <td className="py-3 px-1 text-right w-20 hidden sm:table-cell">
        <button
          onClick={(e) => { e.stopPropagation(); onRowClick(stock.ticker) }}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-goodgreen/15 text-goodgreen hover:bg-goodgreen/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
        >
          Trade
        </button>
      </td>
    </tr>
  )
})

export default function StocksWatchlistPage() {
  const router = useRouter()
  const { push, refresh } = router
  const { stocks: data, isLoading } = useOnChainStocks()
  const { watchlist, isWatched } = useWatchlist()
  const [loadingTooLong, setLoadingTooLong] = useState(false)

  const watched = useMemo(() => {
    return data.filter((s) => isWatched(s.ticker))
    // re-evaluate when the watchlist itself changes
  }, [data, isWatched, watchlist])

  const handleRowClick = useCallback((ticker: string) => {
    push(`/stocks/${ticker}`)
  }, [push])

  useEffect(() => {
    if (!isLoading) {
      setLoadingTooLong(false)
      return
    }
    const timeout = window.setTimeout(() => setLoadingTooLong(true), 2500)
    return () => window.clearTimeout(timeout)
  }, [isLoading])

  const isEmpty = !isLoading && watched.length === 0
  const showLoading = isLoading && !loadingTooLong
  const showDegraded = isLoading && loadingTooLong

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-300">
            <span className="text-lg" aria-hidden="true">★</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Watchlist</h1>
            <p className="text-sm text-gray-400">
              Stocks you’re tracking. Saved locally on this device — connect a wallet to trade them.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="text-xs text-gray-400 inline-flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 tabular-nums">
            {watchlist.length}
          </span>
          <span>tracked</span>
        </div>
        <OracleStatusBadge useStocksFallback />
      </div>

      {showLoading ? (
        <div className="bg-dark-100 rounded-2xl border border-gray-700/20 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-white mb-1">Loading watchlist…</h2>
          <p className="text-sm text-gray-400 mb-5">
            Fetching latest stock and oracle data for your tracked symbols.
          </p>
          <div className="mx-auto w-full max-w-xl space-y-2" aria-hidden="true">
            <div className="h-10 rounded-xl bg-dark-50/60 animate-pulse" />
            <div className="h-10 rounded-xl bg-dark-50/40 animate-pulse" />
            <div className="h-10 rounded-xl bg-dark-50/30 animate-pulse" />
          </div>
        </div>
      ) : showDegraded ? (
        <div className="bg-dark-100 rounded-2xl border border-amber-500/30 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-white mb-1">Still fetching live stock data</h2>
          <p className="text-sm text-gray-300 mb-5">
            Oracle reads are taking longer than expected. You can retry now or browse all stocks.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => refresh()}
              className="px-4 py-2.5 rounded-xl border border-gray-600/50 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
            >
              Try again
            </button>
            <Link
              href="/stocks"
              prefetch={false}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-goodgreen text-dark-900 font-semibold text-sm hover:brightness-110 transition"
            >
              Browse all stocks
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="bg-dark-100 rounded-2xl border border-gray-700/20 px-6 py-12 text-center">
          <div className="text-5xl mb-3" aria-hidden="true">☆</div>
          <h2 className="text-lg font-semibold text-white mb-1">Your watchlist is empty</h2>
          <p className="text-sm text-gray-400 mb-4">
            Tap the star next to any stock to save it here. It’s a fast way to keep an eye on the names you care about.
          </p>
          <Link
            href="/stocks"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-goodgreen text-dark-900 font-semibold text-sm hover:brightness-110 transition"
          >
            Browse all stocks
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile card list (< sm) */}
          <div className="sm:hidden space-y-2 mb-2">
            {watched.map((stock) => (
              <div
                key={stock.ticker}
                onClick={() => handleRowClick(stock.ticker)}
                className="bg-dark-100 rounded-xl border border-gray-700/20 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-dark-50/30 transition-colors active:scale-[0.99]"
              >
                <WatchlistStarButton ticker={stock.ticker} size="sm" />
                <StockIcon ticker={stock.ticker} />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white text-sm truncate max-w-[52px]">{stock.ticker}</span>
                    <span className="text-gray-500 text-xs truncate max-w-[84px]">{stock.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Sparkline data={stock.sparkline7d} positive={stock.change24h >= 0} />
                  </div>
                </div>
                <div className="text-right shrink-0 w-[96px]">
                  <p className="text-white font-medium text-sm whitespace-nowrap">{formatStockPrice(stock.price)}</p>
                  <div className="text-xs font-medium inline-flex justify-end w-full whitespace-nowrap">
                    <PercentageChange value={stock.change24h} decimals={2} size="xs" showSign />
                  </div>
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-goodgreen/10 text-goodgreen">
                    Tap to trade
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table (sm+) */}
          <div className="hidden sm:block bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/30 text-gray-400 bg-dark-50/25">
                    <th scope="col" className="text-right py-3 px-3 font-semibold w-10">#</th>
                    <th scope="col" className="py-3 px-2 font-semibold w-10">
                      <span className="sr-only">Watchlist</span>
                    </th>
                    <th scope="col" className="text-left py-3 px-3 font-semibold">Stock</th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold">Price</th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold">24h Change</th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold hidden sm:table-cell">Volume</th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold hidden md:table-cell">Market Cap</th>
                    <th scope="col" className="py-3 px-2 font-semibold hidden sm:table-cell">7d Trend</th>
                    <th scope="col" className="py-3 px-1 font-semibold hidden sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {watched.map((stock, idx) => (
                    <WatchlistRow
                      key={stock.ticker}
                      stock={stock}
                      idx={idx}
                      onRowClick={handleRowClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
