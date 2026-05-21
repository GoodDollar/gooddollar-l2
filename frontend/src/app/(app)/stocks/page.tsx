'use client'

import { useState, useMemo, memo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { formatStockPrice, formatLargeNumber, type Stock } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { Sparkline } from '@/components/Sparkline'
import { InfoBanner } from '@/components/InfoBanner'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { PercentageChange } from '@/components/ui/percentage-change'
import { isWalletConnectConfigured } from '@/lib/walletConnectReadiness'
import { WalletConnectNotice } from '@/components/stocks/WalletConnectNotice'

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

interface SortableHeaderProps {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}

function SortableHeader({ label, field, sortField, sortDir, onSort, className }: SortableHeaderProps) {
  const active = sortField === field
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center justify-end w-full font-semibold hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/60 rounded-sm"
      >
        {label} <SortArrow active={active} dir={sortDir} />
      </button>
    </th>
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

export default function StocksPage() {
  const router = useRouter()
  const { address } = useAccount()
  const walletConnectConfigured = isWalletConnectConfigured()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const stocksTableRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string>('All')
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { stocks: data, isLoading, isLive } = useOnChainStocks()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const topMovers = useMemo(
    () => data.toSorted((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5),
    [data]
  )

  const trending = useMemo(
    () => data.toSorted((a, b) => b.volume24h - a.volume24h).slice(0, 5),
    [data]
  )

  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(data.map((s) => s.sector).filter(Boolean))).slice(0, 6)],
    [data]
  )

  const filtered = useMemo(() => {
    let stocks = data
    if (sectorFilter !== 'All') {
      stocks = stocks.filter((s) => s.sector === sectorFilter)
    }
    const trimmed = query.trim()
    if (trimmed) {
      const q = trimmed.toLowerCase()
      stocks = stocks.filter(s =>
        s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    }
    return stocks.toSorted((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      const aVal = Number(a[sortField] ?? 0)
      const bVal = Number(b[sortField] ?? 0)
      if (aVal === bVal) return a.ticker.localeCompare(b.ticker)
      return (aVal - bVal) * mul
    })
  }, [data, sectorFilter, query, sortField, sortDir])

  const handleRowClick = useCallback((ticker: string) => {
    router.push(`/stocks/${ticker}`)
  }, [router])

  const handleOnboardingCta = useCallback(() => {
    if (!walletConnectConfigured) {
      stocksTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      searchInputRef.current?.focus()
      return
    }
    router.push(`/stocks/${data[0]?.ticker || 'AAPL'}`)
  }, [walletConnectConfigured, router, data])

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
        description="Synthetic stock tokens track real equity prices via Chainlink oracles. Trade 24/7 with fractional amounts starting at $1. Every trade routes 20% of fees to UBI."
        storageKey="gd-banner-dismissed-stocks"
      />

      {!address && (
        <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-goodgreen/25 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Connect Wallet to Trade Stocks</h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">Get started in under a minute: connect wallet, pick a stock, place your first buy or sell order.</p>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-2">1. Connect wallet  2. Select stock  3. Tap Trade</p>
              {!walletConnectConfigured && (
                <WalletConnectNotice className="mt-3" />
              )}
            </div>
            <button
              onClick={handleOnboardingCta}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-goodgreen text-[#031615] font-semibold text-sm hover:bg-[#22c5b6] active:bg-[#00a697] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 transition-colors"
            >
              {walletConnectConfigured ? 'Open Featured Stock to Start Trading' : 'Browse Stocks to Prepare Trade'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-gray-700/30 bg-dark-100/70 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">Discover opportunities faster</h2>
            <p className="text-xs text-gray-400">Use movers, trending, and sector filters to narrow candidates before opening a ticker.</p>
          </div>
          {sectorFilter !== 'All' && (
            <button
              type="button"
              onClick={() => setSectorFilter('All')}
              className="text-xs text-goodgreen hover:text-goodgreen/80 transition-colors self-start sm:self-auto"
            >
              Clear sector filter
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2" data-testid="stocks-sector-filters">
          {sectors.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => setSectorFilter(sector)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sectorFilter === sector
                  ? 'bg-goodgreen text-[#031615]'
                  : 'bg-dark-50 text-gray-300 border border-gray-700/30 hover:text-white hover:border-goodgreen/40'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="stocks-discovery-modules">
          <div className="rounded-xl border border-gray-700/25 bg-dark-50/40 p-3">
            <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Top Movers</h3>
            <div className="space-y-1.5">
              {topMovers.map((stock) => (
                <button
                  key={`mover-${stock.ticker}`}
                  type="button"
                  onClick={() => handleRowClick(stock.ticker)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                >
                  <span className="text-sm font-medium text-white">{stock.ticker}</span>
                  <span className={stock.change24h >= 0 ? 'text-goodgreen text-xs font-semibold' : 'text-red-400 text-xs font-semibold'}>
                    {stock.change24h >= 0 ? '+' : ''}
                    {stock.change24h.toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-700/25 bg-dark-50/40 p-3">
            <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Trending</h3>
            <div className="space-y-1.5">
              {trending.map((stock) => (
                <button
                  key={`trending-${stock.ticker}`}
                  type="button"
                  onClick={() => handleRowClick(stock.ticker)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                >
                  <span className="text-sm font-medium text-white">{stock.ticker}</span>
                  <span className="text-xs text-gray-300">{formatLargeNumber(stock.volume24h)} vol</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
        />
        <OracleStatusBadge useStocksFallback />
      </div>

      {/* Mobile card list (< sm) */}
      <div className="sm:hidden space-y-2 mb-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-dark-100 rounded-2xl border border-gray-700/20">
            No stocks match your search.{' '}
            <button onClick={() => setQuery('')} className="text-goodgreen underline">Clear</button>
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
                <span className="inline-flex mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-goodgreen/10 text-goodgreen">
                  Tap to trade
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table (sm+) */}
      <div ref={stocksTableRef} className="hidden sm:block bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/30 text-gray-400 bg-dark-50/25">
                <th scope="col" className="text-right py-3 px-3 font-semibold w-10">#</th>
                <th scope="col" className="text-left py-3 px-3 font-semibold">Stock</th>
                <SortableHeader
                  label="Price"
                  field="price"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right py-3 px-3"
                />
                <SortableHeader
                  label="24h Change"
                  field="change24h"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right py-3 px-3"
                />
                <SortableHeader
                  label="Volume"
                  field="volume24h"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right py-3 px-3 hidden sm:table-cell"
                />
                <SortableHeader
                  label="Market Cap"
                  field="marketCap"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right py-3 px-3 hidden md:table-cell"
                />
                <th scope="col" className="py-3 px-2 font-semibold hidden sm:table-cell">7d Trend</th>
                <th scope="col" className="w-20 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No stocks match your search.{' '}
                    <button onClick={() => setQuery('')} className="text-goodgreen underline">Clear</button>
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
