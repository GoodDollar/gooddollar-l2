'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatStockPrice, formatLargeNumber, type Stock } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { getDailyMovers, getMarketAnalysisPicks, getTrendingStocks } from '@/lib/stockDiscovery'
import { useWatchlist } from '@/lib/useWatchlist'
import { Sparkline } from '@/components/Sparkline'
import { InfoBanner } from '@/components/InfoBanner'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { PercentageChange } from '@/components/ui/percentage-change'
import { WatchlistStarButton } from '@/components/stocks/WatchlistStarButton'
import { StocksDiscoveryShelves } from '@/components/stocks/StocksDiscoveryShelves'

type SortField = 'price' | 'change24h' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return (
    <svg className="inline-block w-3 h-3 text-gray-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
    </svg>
  )
  return (
    <svg className="inline-block w-3 h-3 text-goodgreen ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {dir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
    </svg>
  )
}

function StockIcon({ ticker }: { ticker: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-[10px] font-bold text-goodgreen shrink-0">
      {ticker.slice(0, 2)}
    </div>
  )
}

interface StockRowProps {
  stock: Stock
  idx: number
  onRowClick: (ticker: string) => void
}

const StockRow = memo(function StockRow({ stock, idx, onRowClick }: StockRowProps) {
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
            <span className="text-gray-500 ml-1.5 text-xs truncate max-w-[120px] inline-block align-middle">{stock.displayName}</span>
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

type ListFilter = 'all' | 'watchlist'

export default function StocksPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ListFilter>('all')
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { stocks: data, isLoading, isLive, refetch } = useOnChainStocks()
  const { watchlist, isWatched } = useWatchlist()
  const queryTrimmed = query.trim()
  const isQueryActive = queryTrimmed.length > 0
  const showWatchlistGuidanceEmpty = filter === 'watchlist' && watchlist.length === 0 && !isQueryActive
  const showWatchlistSearchEmpty = filter === 'watchlist' && isQueryActive

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let stocks = data
    if (filter === 'watchlist') {
      stocks = stocks.filter(s => isWatched(s.ticker))
    }
    if (queryTrimmed) {
      const q = queryTrimmed.toLowerCase()
      stocks = stocks.filter(s =>
        s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    }
    return [...stocks].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      return (a[sortField] - b[sortField]) * mul
    })
    // watchlist included so list re-filters when toggle changes
  }, [data, queryTrimmed, sortField, sortDir, filter, isWatched])
  const { movers: dailyMovers, trending: trendingStocks, analysis: marketAnalysisPicks } = useMemo(() => ({
    movers: getDailyMovers(data, 5),
    trending: getTrendingStocks(data, 5),
    analysis: getMarketAnalysisPicks(data, 5),
  }), [data])

  const handleRowClick = useCallback((ticker: string) => {
    router.push(`/stocks/${ticker}`)
  }, [router])

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tokenized Stocks</h1>
            <p className="text-sm text-gray-400">Trade synthetic equities 24/7 with fractional shares. Every trade funds UBI.</p>
          </div>
        </div>
      </div>

      <InfoBanner
        title="How Tokenized Stocks Work"
        description="Synthetic stock tokens track real equity prices via on-chain price oracles. Trade 24/7 with fractional amounts starting at $1. Every trade routes 20% of fees to UBI."
        storageKey="gd-banner-dismissed-stocks"
      />

      {!address && (
        <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-goodgreen/25 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Connect Wallet to Trade Stocks</h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">Get started in under a minute: connect wallet, pick a stock, place your first buy or sell order.</p>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-2">1. Connect wallet  2. Select stock  3. Tap Trade</p>
            </div>
            <div className="shrink-0 flex flex-col items-stretch gap-2">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="px-4 py-2.5 rounded-xl bg-goodgreen text-dark-900 font-semibold text-sm hover:brightness-110 transition"
                  >
                    Connect Wallet to Trade Stocks
                  </button>
                )}
              </ConnectButton.Custom>
              <button
                type="button"
                onClick={() => router.push(`/stocks/${data[0]?.ticker || 'AAPL'}`)}
                className="px-4 py-2 rounded-xl border border-gray-600/40 text-gray-200 text-xs font-medium hover:border-goodgreen/40 hover:text-white transition"
              >
                Browse a Starter Stock
              </button>
            </div>
          </div>
        </div>
      )}

      <StocksDiscoveryShelves
        isLoading={isLoading}
        dailyMovers={dailyMovers}
        trending={trendingStocks}
        analysisPicks={marketAnalysisPicks}
      />

      {!isLive && !isLoading && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3" role="status">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="flex-1 text-sm text-amber-200">Showing cached prices — live oracle data unavailable</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-amber-200 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
        />
        <div
          role="tablist"
          aria-label="Stocks filter"
          className="inline-flex items-center rounded-xl bg-dark-100 border border-gray-700/30 p-0.5 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-goodgreen/15 text-goodgreen'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'watchlist'}
            onClick={() => setFilter('watchlist')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
              filter === 'watchlist'
                ? 'bg-goodgreen/15 text-goodgreen'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span aria-hidden="true">★</span>
            <span>Watchlist</span>
            {watchlist.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold tabular-nums">
                {watchlist.length}
              </span>
            )}
          </button>
        </div>
        <OracleStatusBadge useStocksFallback />
      </div>

      {/* Mobile card list (< sm) */}
      <div className="sm:hidden space-y-2 mb-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-dark-100 rounded-2xl border border-gray-700/20">
            {showWatchlistGuidanceEmpty ? (
              <>
                <div className="text-3xl mb-2" aria-hidden="true">☆</div>
                <p className="text-sm">Your watchlist is empty.</p>
                <p className="text-xs mt-1">Tap the star on any stock to add it.</p>
                <button onClick={() => setFilter('all')} className="mt-3 text-goodgreen underline text-sm">Browse all stocks</button>
              </>
            ) : showWatchlistSearchEmpty ? (
              <>
                No watchlist stocks match &quot;{queryTrimmed}&quot;.{` `}
                <button onClick={() => setQuery('')} className="text-goodgreen underline">Clear search</button>
              </>
            ) : (
              <>
                No stocks match your search.{' '}
                <button onClick={() => setQuery('')} className="text-goodgreen underline">Clear</button>
              </>
            )}
          </div>
        ) : (
          filtered.map((stock) => (
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
                  <span className="text-gray-500 text-xs truncate max-w-[84px]">{stock.displayName}</span>
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
          ))
        )}
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
                <th scope="col" className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                  Price <SortArrow active={sortField === 'price'} dir={sortDir} />
                </th>
                <th scope="col" className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('change24h')}>
                  24h Change <SortArrow active={sortField === 'change24h'} dir={sortDir} />
                </th>
                <th scope="col" className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden sm:table-cell" onClick={() => handleSort('volume24h')}>
                  Volume <SortArrow active={sortField === 'volume24h'} dir={sortDir} />
                </th>
                <th scope="col" className="text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden md:table-cell" onClick={() => handleSort('marketCap')}>
                  Market Cap <SortArrow active={sortField === 'marketCap'} dir={sortDir} />
                </th>
                <th scope="col" className="py-3 px-2 font-semibold hidden sm:table-cell">7d Trend</th>
                <th scope="col" className="w-20 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    {showWatchlistGuidanceEmpty ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl" aria-hidden="true">☆</span>
                        <p className="text-sm">Your watchlist is empty.</p>
                        <p className="text-xs">Tap the star next to any stock to save it here.</p>
                        <button
                          type="button"
                          onClick={() => setFilter('all')}
                          className="mt-2 text-goodgreen underline text-sm"
                        >
                          Browse all stocks
                        </button>
                      </div>
                    ) : showWatchlistSearchEmpty ? (
                      <>
                        No watchlist stocks match &quot;{queryTrimmed}&quot;.{` `}
                        <button onClick={() => setQuery('')} className="text-goodgreen underline">Clear search</button>
                      </>
                    ) : (
                      <>
                        No stocks match your search.{' '}
                        <button onClick={() => setQuery('')} className="text-goodgreen underline">Clear</button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((stock, idx) => (
                  <StockRow key={stock.ticker} stock={stock} idx={idx} onRowClick={handleRowClick} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center mt-4">
        Prices sourced from on-chain oracle. Updated on every block.
      </p>
    </div>
  )
}
