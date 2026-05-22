'use client'

import { useState, useMemo, memo, useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAccount } from 'wagmi'
import { formatStockPrice, formatLargeNumber, type Stock } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { useStocksRebalanceStatus } from '@/lib/useStocksRebalanceStatus'
import { Sparkline } from '@/components/Sparkline'
import { InfoBanner } from '@/components/InfoBanner'
import { StalePriceBanner } from '@/components/StalePriceBanner'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { WalletConnectConfigWarning } from '@/components/stocks/WalletConnectConfigWarning'
import { MarketSessionBadge } from '@/components/stocks/MarketSessionBadge'
import { WatchlistStarButton } from '@/components/stocks/WatchlistStarButton'
import { PercentageChange } from '@/components/ui/percentage-change'
import { useMounted } from '@/lib/useMounted'
import {
  parseStocksScreenerState,
  serializeStocksScreenerState,
} from './screenerQueryState'

type SortField = 'price' | 'change24h' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'
type CapFilter = 'all' | 'mega' | 'large' | 'mid'
type MomentumFilter = 'all' | 'gainers' | 'losers'
type LiquidityFilter = 'all' | 'active' | 'quiet'

const MarketIntelligencePanel = dynamic(
  () => import('@/components/stocks/MarketIntelligencePanel').then((mod) => mod.MarketIntelligencePanel),
  {
    loading: () => (
      <section
        aria-label="Loading market intelligence"
        className="mb-4 rounded-2xl border border-gray-700/20 bg-dark-100 p-4 text-sm text-gray-400"
      >
        Loading market intelligence...
      </section>
    ),
  },
)

const StocksRebalanceDashboard = dynamic(
  () => import('@/components/stocks/StocksRebalanceDashboard').then((mod) => mod.StocksRebalanceDashboard),
  {
    loading: () => (
      <section
        aria-label="Loading rebalance diagnostics"
        className="rounded-2xl border border-gray-700/20 bg-dark-100 p-4 text-sm text-gray-400"
      >
        Loading rebalance diagnostics...
      </section>
    ),
  },
)

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
  isLive: boolean
  canIncreaseRisk: boolean
  onRowClick: (ticker: string) => void
}

const StockRow = memo(function StockRow({ stock, idx, isLive, canIncreaseRisk, onRowClick }: StockRowProps) {
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
      <td className="py-3 px-1 text-right w-24 hidden sm:table-cell">
        {isLive && canIncreaseRisk ? (
          <button
            onClick={(e) => { e.stopPropagation(); onRowClick(stock.ticker) }}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-goodgreen/15 text-goodgreen hover:bg-goodgreen/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
          >
            Trade
          </button>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <span
              className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              aria-hidden="true"
            >
              Demo
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onRowClick(stock.ticker) }}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-dark-100 text-gray-300 border border-gray-700/40 hover:bg-dark-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50"
              aria-label={`Preview ${stock.ticker} — ${(isLive && !canIncreaseRisk) ? 'sync pending' : 'demo data'}`}
            >
              Preview
            </button>
          </div>
        )}
      </td>
    </tr>
  )
})

export default function StocksPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { address } = useAccount()
  const mounted = useMounted()
  const initialScreenerState = useMemo(
    () => parseStocksScreenerState(searchParams),
    [searchParams],
  )
  const [query, setQuery] = useState(initialScreenerState.query)
  const [sortField, setSortField] = useState<SortField>(initialScreenerState.sortField)
  const [sortDir, setSortDir] = useState<SortDir>(initialScreenerState.sortDir)
  const [sectorFilter, setSectorFilter] = useState<string>(initialScreenerState.sectorFilter)
  const [capFilter, setCapFilter] = useState<CapFilter>(initialScreenerState.capFilter)
  const [momentumFilter, setMomentumFilter] = useState<MomentumFilter>(initialScreenerState.momentumFilter)
  const [liquidityFilter, setLiquidityFilter] = useState<LiquidityFilter>(initialScreenerState.liquidityFilter)
  const { stocks: data, isLoading, isLive } = useOnChainStocks()
  const rebalanceSymbols = useMemo(() => data.map((stock) => stock.ticker), [data])
  const { data: rebalanceStatus, isLoading: rebalanceLoading, error: rebalanceError, bySymbol: rebalanceBySymbol } =
    useStocksRebalanceStatus(rebalanceSymbols)

  const sectors = useMemo(() => (
    Array.from(new Set(data.map((stock) => stock.sector).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  ), [data])

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
    const trimmed = query.trim()
    if (trimmed) {
      const q = trimmed.toLowerCase()
      stocks = stocks.filter(s =>
        s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    }
    if (sectorFilter !== 'all') {
      stocks = stocks.filter((s) => s.sector === sectorFilter)
    }
    if (capFilter !== 'all') {
      stocks = stocks.filter((s) => {
        if (capFilter === 'mega') return s.marketCap >= 200_000_000_000
        if (capFilter === 'large') return s.marketCap >= 10_000_000_000 && s.marketCap < 200_000_000_000
        return s.marketCap >= 2_000_000_000 && s.marketCap < 10_000_000_000
      })
    }
    if (momentumFilter !== 'all') {
      stocks = stocks.filter((s) => momentumFilter === 'gainers' ? s.change24h >= 0 : s.change24h < 0)
    }
    if (liquidityFilter !== 'all') {
      stocks = stocks.filter((s) => liquidityFilter === 'active' ? s.volume24h >= 50_000_000 : s.volume24h < 50_000_000)
    }
    return [...stocks].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      return (a[sortField] - b[sortField]) * mul
    })
  }, [data, query, sortField, sortDir, sectorFilter, capFilter, momentumFilter, liquidityFilter])

  const activeFilterCount = Number(sectorFilter !== 'all') + Number(capFilter !== 'all') + Number(momentumFilter !== 'all') + Number(liquidityFilter !== 'all')
  const hasSearchQuery = query.trim().length > 0
  const hasActiveFilters = activeFilterCount > 0
  const screenerQueryString = useMemo(() => {
    return serializeStocksScreenerState({
      query,
      sortField,
      sortDir,
      sectorFilter,
      capFilter,
      momentumFilter,
      liquidityFilter,
    }).toString()
  }, [query, sortField, sortDir, sectorFilter, capFilter, momentumFilter, liquidityFilter])

  useEffect(() => {
    const current = searchParams.toString()
    if (current === screenerQueryString) return

    const nextUrl = screenerQueryString ? `${pathname}?${screenerQueryString}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, screenerQueryString, searchParams])

  const clearAllFilters = () => {
    setSectorFilter('all')
    setCapFilter('all')
    setMomentumFilter('all')
    setLiquidityFilter('all')
  }

  const clearEmptyStateConstraints = () => {
    if (hasSearchQuery) setQuery('')
    if (hasActiveFilters) clearAllFilters()
  }

  const emptyStateMessage = hasSearchQuery && hasActiveFilters
    ? 'No stocks match your search and filters.'
    : hasActiveFilters
      ? 'No stocks match your current filters.'
      : hasSearchQuery
        ? 'No stocks match your search.'
        : 'No stocks available right now.'

  const emptyStateActionLabel = hasSearchQuery && hasActiveFilters
    ? 'Clear search & filters'
    : hasActiveFilters
      ? 'Clear filters'
      : hasSearchQuery
        ? 'Clear search'
        : null

  const pushTickerRoute = useCallback((ticker: string) => {
    const next = screenerQueryString ? `/stocks/${ticker}?${screenerQueryString}` : `/stocks/${ticker}`
    router.push(next)
  }, [router, screenerQueryString])

  const handleRowClick = useCallback((ticker: string) => {
    pushTickerRoute(ticker)
  }, [pushTickerRoute])

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen bg-dark-200 pb-24 md:pr-24 space-y-5 sm:space-y-0">
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-goodgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">Tokenized Stocks</h1>
              <MarketSessionBadge />
            </div>
            <p className="text-sm text-gray-400">Trade synthetic equities 24/7 with fractional shares. Every trade funds UBI.</p>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-5">
        <InfoBanner
          title="How Tokenized Stocks Work"
          description="Synthetic stock tokens track real equity prices via StockOracleV2 multi-signer oracles. Trade 24/7 with fractional amounts starting at $1. Every trade routes 33% of fees to UBI."
          storageKey="gd-banner-dismissed-stocks"
        />
      </div>

      {!isLive && (
        <div className="mb-4">
          <StalePriceBanner variant="stocks" />
        </div>
      )}

      {!address && (
        <>
          <WalletConnectConfigWarning className="mb-4" />
          {isLive ? (
            <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-goodgreen/25 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">Connect Wallet to Trade Stocks</h2>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">Get started in under a minute: connect wallet, pick a stock, place your first buy or sell order.</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-2">1. Connect wallet  2. Select stock  3. Tap Trade</p>
                </div>
                <button
                  onClick={() => pushTickerRoute(data[0]?.ticker || 'AAPL')}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-goodgreen text-dark-900 font-semibold text-sm hover:brightness-110 transition"
                >
                  Connect Wallet to Trade Stocks
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-white">Stocks Oracle in Demo Mode</h2>
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      aria-hidden="true"
                    >
                      Demo
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">The on-chain stocks oracle isn&apos;t live yet. You can preview the trading experience, but orders cannot be placed.</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-2">Preview a stock to see the trade UI. Trading will unlock once the oracle is reachable.</p>
                </div>
                <button
                  onClick={() => pushTickerRoute(data[0]?.ticker || 'AAPL')}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-dark-100 text-gray-200 border border-gray-700/40 font-semibold text-sm hover:bg-dark-50/40 transition"
                  aria-label="Preview stocks demo"
                >
                  Preview Stocks Demo
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <MarketIntelligencePanel
        stocks={data}
        isLive={isLive}
        isLoading={isLoading}
        onSelectTicker={pushTickerRoute}
      />

      <div className="mb-4 sm:mb-5 flex flex-col lg:flex-row lg:items-center gap-3 rounded-2xl border border-gray-700/20 bg-dark-100/35 p-3 sm:p-0 sm:border-0 sm:bg-transparent sm:rounded-none">
        <input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={!mounted}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30 disabled:opacity-70 disabled:cursor-not-allowed"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
          <select
            aria-label="Filter by sector"
            className="px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
          >
            <option value="all">All sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <select
            aria-label="Filter by market cap"
            className="px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
            value={capFilter}
            onChange={(e) => setCapFilter(e.target.value as CapFilter)}
          >
            <option value="all">All caps</option>
            <option value="mega">Mega cap</option>
            <option value="large">Large cap</option>
            <option value="mid">Mid cap</option>
          </select>
          <select
            aria-label="Filter by momentum"
            className="px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
            value={momentumFilter}
            onChange={(e) => setMomentumFilter(e.target.value as MomentumFilter)}
          >
            <option value="all">All momentum</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
          <select
            aria-label="Filter by liquidity"
            className="px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
            value={liquidityFilter}
            onChange={(e) => setLiquidityFilter(e.target.value as LiquidityFilter)}
          >
            <option value="all">All liquidity</option>
            <option value="active">High volume</option>
            <option value="quiet">Lower volume</option>
          </select>
        </div>
        <OracleStatusBadge useStocksFallback />
      </div>
      <div className="mb-4">
        <StocksRebalanceDashboard
          symbols={rebalanceStatus?.symbols ?? []}
          isLoading={rebalanceLoading}
          error={rebalanceError}
        />
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {sectorFilter !== 'all' && (
            <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15" onClick={() => setSectorFilter('all')}>
              Sector: {sectorFilter} <span aria-hidden="true">x</span>
            </button>
          )}
          {capFilter !== 'all' && (
            <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15" onClick={() => setCapFilter('all')}>
              Cap: {capFilter} <span aria-hidden="true">x</span>
            </button>
          )}
          {momentumFilter !== 'all' && (
            <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15" onClick={() => setMomentumFilter('all')}>
              Momentum: {momentumFilter} <span aria-hidden="true">x</span>
            </button>
          )}
          {liquidityFilter !== 'all' && (
            <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15" onClick={() => setLiquidityFilter('all')}>
              Liquidity: {liquidityFilter} <span aria-hidden="true">x</span>
            </button>
          )}
          <button type="button" className="text-xs text-gray-300 hover:text-white underline underline-offset-2" onClick={clearAllFilters}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Mobile card list (< sm) */}
      <div className="sm:hidden space-y-2 mb-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-dark-100 rounded-2xl border border-gray-700/20">
            {emptyStateMessage}{' '}
            {emptyStateActionLabel && (
              <button onClick={clearEmptyStateConstraints} className="text-goodgreen underline">
                {emptyStateActionLabel}
              </button>
            )}
          </div>
        ) : (
          filtered.map((stock) => (
            <div
              key={stock.ticker}
              onClick={() => handleRowClick(stock.ticker)}
              className="bg-dark-100 rounded-xl border border-gray-700/20 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-dark-50/30 transition-colors active:scale-[0.99]"
            >
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
                {isLive && (rebalanceBySymbol[stock.ticker]?.riskIncreaseAllowed ?? true) ? (
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-goodgreen/10 text-goodgreen">
                    Tap to trade
                  </span>
                ) : (
                  <span
                    className="inline-flex mt-1 items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-dark-50/40 text-gray-300 border border-gray-700/40"
                    aria-label={(isLive && rebalanceBySymbol[stock.ticker] && !rebalanceBySymbol[stock.ticker].riskIncreaseAllowed)
                      ? 'Sync pending — preview only'
                      : 'Demo data — preview only'}
                  >
                    <span className="px-1 py-0 rounded bg-yellow-500/10 text-yellow-400 text-[9px] border border-yellow-500/20">
                      {isLive ? 'Sync' : 'Demo'}
                    </span>
                    Tap to preview
                  </span>
                )}
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
                <th scope="col" className="py-3 px-2 w-10" aria-label="Watchlist" />
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
                <th scope="col" className="w-24 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    {emptyStateMessage}{' '}
                    {emptyStateActionLabel && (
                      <button onClick={clearEmptyStateConstraints} className="text-goodgreen underline">
                        {emptyStateActionLabel}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((stock, idx) => (
                  <StockRow
                    key={stock.ticker}
                    stock={stock}
                    idx={idx}
                    isLive={isLive}
                    canIncreaseRisk={rebalanceBySymbol[stock.ticker]?.riskIncreaseAllowed ?? true}
                    onRowClick={handleRowClick}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center mt-4">
        {isLive
          ? 'Prices sourced from on-chain oracle. Updated on every block.'
          : 'Showing demo data — on-chain stocks oracle is not reachable. Prices below are illustrative only and cannot be traded.'}
      </p>
    </div>
  )
}
