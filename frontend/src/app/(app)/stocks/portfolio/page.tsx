'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useMemo, useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatStockPrice, formatLargeNumber, type PortfolioHolding, type TradeRecord } from '@/lib/stockData'
import { useStockHoldings } from '@/lib/useStockHoldings'
import { useStockTrades } from '@/lib/useStockTrades'
import { computePerformanceStats } from '@/lib/computePerformanceStats'
import { ConnectWalletEmptyState } from '@/components/ConnectWalletEmptyState'
import { WalletConnectConfigWarning } from '@/components/stocks/WalletConnectConfigWarning'
import { PortfolioPnLChart } from '@/components/stocks/PortfolioPnLChart'
import { AllocationDonut } from '@/components/stocks/AllocationDonut'
import { PerformanceStatsPanel } from '@/components/stocks/PerformanceStatsPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  buildBenchmarkSeries,
  buildContributionRows,
  calcMaxDrawdownPct,
  calcVolatilityPct,
  parseBenchmarkId,
  type BenchmarkId,
} from './portfolioDiagnostics'

const DeferredStocksPortfolioImpactSection = dynamic(
  () => import('./StocksPortfolioImpactSection').then((module) => module.StocksPortfolioImpactSection),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" aria-live="polite">
        <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-6">
          <div className="space-y-3">
            <div className="text-center text-gray-400 text-sm">
              Connect wallet to see your UBI impact
            </div>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors"
            >
              Connect Wallet to View UBI Impact
            </button>
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-full bg-gray-700/60 rounded" />
              <div className="h-3 w-5/6 bg-gray-700/60 rounded" />
            </div>
          </div>
        </div>
        <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-44 bg-gray-700/60 rounded" />
            <div className="h-8 w-32 bg-gray-700/60 rounded" />
            <div className="h-3 w-5/6 bg-gray-700/60 rounded" />
          </div>
        </div>
        <p className="sr-only">Loading impact insights…</p>
      </div>
    ),
  },
)

type TrendRange = '1W' | '1M' | '3M' | '1Y'
type AllocationMode = 'value' | 'shares'

function buildTrendPoints(totalValue: number, unrealizedPnl: number, range: TrendRange): number[] {
  const points = range === '1W' ? 14 : range === '1M' ? 30 : range === '3M' ? 45 : 60
  const costBasis = Math.max(0, totalValue - unrealizedPnl)
  const start = totalValue <= 0 ? 0 : Math.max(0, costBasis * 0.92)
  const end = Math.max(0, totalValue)
  if (points <= 1) return [end]
  return Array.from({ length: points }, (_, idx) => {
    const progress = idx / (points - 1)
    const curve = 0.55 + Math.sin(progress * Math.PI) * 0.15
    return start + (end - start) * progress * curve + (end - start) * (1 - curve) * progress
  })
}

function sparklinePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  return values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width
    const y = height - ((value - min) / range) * height
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
}

function CollateralHealth({
  ratio,
  totalRequired = 0,
  hasPositions = false,
}: {
  ratio: number
  totalRequired?: number
  hasPositions?: boolean
}) {
  const hasRiskPosition = hasPositions && totalRequired > 0

  if (!hasRiskPosition) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1.5 gap-0.5">
          <span className="text-[10px] sm:text-xs text-gray-400">Collateral Health</span>
          <span className="text-[10px] sm:text-xs font-medium text-gray-500">Not active yet</span>
        </div>
        <div className="h-1.5 bg-dark-50 rounded-full overflow-hidden" />
      </div>
    )
  }

  const color = ratio >= 150 ? 'text-green-400' : ratio >= 120 ? 'text-yellow-400' : 'text-red-400'
  const bgColor = ratio >= 150 ? 'bg-green-400' : ratio >= 120 ? 'bg-yellow-400' : 'bg-red-400'
  const label = ratio >= 150 ? 'Healthy' : ratio >= 120 ? 'At Risk' : 'Critical'
  const barWidth = Math.min(100, (ratio / 200) * 100)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1.5 gap-0.5">
        <span className="text-[10px] sm:text-xs text-gray-400">Collateral Health</span>
        <span className={`text-[10px] sm:text-xs font-medium ${color}`}>{ratio.toFixed(0)}% — {label}</span>
      </div>
      <div className="h-1.5 bg-dark-50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bgColor}`} style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  )
}

function PortfolioOnboardingCard() {
  return (
    <section className="mb-6 rounded-2xl border border-goodgreen/30 bg-gradient-to-br from-goodgreen/12 via-cyan-500/8 to-dark-100 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Get started in 3 steps</h2>
          <p className="mt-1 text-sm text-gray-300">Connect your wallet once, open your first stock position, then track performance and UBI impact here.</p>
          <ol className="mt-3 space-y-1.5 text-xs text-gray-300">
            <li><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-goodgreen/40 bg-goodgreen/10 text-[11px] font-semibold text-goodgreen">1</span>Connect wallet</li>
            <li><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-600 bg-dark-50 text-[11px] font-semibold text-gray-300">2</span>Open your first stock position</li>
            <li><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-600 bg-dark-50 text-[11px] font-semibold text-gray-300">3</span>Track risk, P&amp;L, and UBI contribution</li>
          </ol>
        </div>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              type="button"
              onClick={openConnectModal}
              className="w-full rounded-xl bg-goodgreen px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-goodgreen/90 lg:w-auto"
            >
              Connect Wallet to Start Portfolio
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    </section>
  )
}

function HoldingRow({ holding, onClick }: { holding: PortfolioHolding; onClick: () => void }) {
  const stockName: string | null = null // on-chain doesn't store display names
  const value = holding.shares * holding.currentPrice
  const cost = holding.shares * holding.avgCost
  const pnl = value - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0

  return (
    <tr onClick={onClick} className="border-b border-gray-700/10 hover:bg-white/[0.04] cursor-pointer transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-[9px] font-bold text-goodgreen">
            {holding.ticker.slice(0, 2)}
          </div>
          <div>
            <span className="font-medium text-white text-sm">{holding.ticker}</span>
            {stockName && <span className="text-gray-500 text-xs ml-1 hidden sm:inline">{stockName}</span>}
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right text-white text-sm">{holding.shares.toFixed(2)}</td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm hidden sm:table-cell">{formatStockPrice(holding.avgCost)}</td>
      <td className="py-3 px-3 text-right text-white text-sm">{formatStockPrice(holding.currentPrice)}</td>
      <td className="py-3 px-3 text-right text-white text-sm hidden sm:table-cell">{formatStockPrice(value)}</td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {pnl >= 0 ? '+' : ''}{formatStockPrice(pnl)}
        <span className="text-xs ml-1 opacity-70">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
      </td>
    </tr>
  )
}

function TradeRow({ trade }: { trade: TradeRecord }) {
  const date = new Date(trade.timestamp)
  const total = trade.shares * trade.price
  return (
    <tr className="border-b border-gray-700/10 hover:bg-dark-50/30 transition-colors">
      <td className="py-3 px-3 text-sm text-white font-medium">{trade.ticker}</td>
      <td className="py-3 px-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.side === 'buy' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {trade.side.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm">{trade.shares.toFixed(4)}</td>
      <td className="py-3 px-3 text-right text-white text-sm">{formatStockPrice(trade.price)}</td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm hidden md:table-cell">{formatStockPrice(total)}</td>
      <td className="py-3 px-3 text-right text-gray-400 text-sm hidden sm:table-cell">
        <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div className="text-[10px] text-gray-600">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
      </td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-500'}`}>
        {trade.pnl !== 0 ? `${trade.pnl > 0 ? '+' : ''}${formatStockPrice(trade.pnl)}` : '—'}
      </td>
    </tr>
  )
}

export default function StocksPortfolioPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  const {
    holdings,
    totalValue,
    unrealizedPnl,
    pnlPercent,
    totalCollateral,
    totalRequired,
    healthRatio,
    isLoading: holdingsLoading,
  } = useStockHoldings(address)
  const { trades, isLoading: tradesLoading } = useStockTrades(address)
  const [trendRange, setTrendRange] = useState<TrendRange>('1M')
  const [benchmark, setBenchmark] = useState<BenchmarkId>(() => parseBenchmarkId(searchParams.get('benchmark')))
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('value')

  const summary = { totalValue, unrealizedPnl, pnlPercent, totalCollateral, totalRequired, healthRatio }
  const isDisconnected = !isConnected || !address
  const hasLivePositions = holdings.some((holding) => holding.shares > 0)
  const hasRiskPosition = hasLivePositions && summary.totalRequired > 0
  const isLoading = holdingsLoading || tradesLoading
  const allocationRows = useMemo(() => {
    const total = holdings.reduce((sum, holding) => {
      return sum + (allocationMode === 'value' ? holding.shares * holding.currentPrice : holding.shares)
    }, 0)
    if (total <= 0) return []
    return holdings
      .map((holding) => {
        const amount = allocationMode === 'value' ? holding.shares * holding.currentPrice : holding.shares
        const pct = (amount / total) * 100
        const pnl = (holding.currentPrice - holding.avgCost) * holding.shares
        return { ticker: holding.ticker, amount, pct, pnl }
      })
      .toSorted((a, b) => b.pct - a.pct)
      .slice(0, 5)
  }, [allocationMode, holdings])

  const trendValues = useMemo(() => {
    return buildTrendPoints(summary.totalValue, summary.unrealizedPnl, trendRange)
  }, [summary.totalValue, summary.unrealizedPnl, trendRange])
  const trendPath = useMemo(() => sparklinePath(trendValues, 100, 32), [trendValues])
  const benchmarkValues = useMemo(() => buildBenchmarkSeries(trendValues[0] ?? 100, trendValues.length || 30, benchmark), [benchmark, trendValues])
  const benchmarkPath = useMemo(() => sparklinePath(benchmarkValues, 100, 32), [benchmarkValues])
  const benchmarkDeltaPct = useMemo(() => {
    if (benchmarkValues.length < 2) return 0
    const first = benchmarkValues[0] ?? 0
    const last = benchmarkValues[benchmarkValues.length - 1] ?? 0
    if (first <= 0) return 0
    return ((last - first) / first) * 100
  }, [benchmarkValues])
  const portfolioDeltaPct = useMemo(() => {
    if (trendValues.length < 2) return 0
    const first = trendValues[0] ?? 0
    const last = trendValues[trendValues.length - 1] ?? 0
    if (first <= 0) return 0
    return ((last - first) / first) * 100
  }, [trendValues])
  const maxDrawdownPct = useMemo(() => calcMaxDrawdownPct(trendValues), [trendValues])
  const volatilityPct = useMemo(() => calcVolatilityPct(trendValues), [trendValues])
  const concentrationPct = useMemo(() => (allocationRows[0]?.pct ?? 0), [allocationRows])
  const contributionRows = useMemo(() => buildContributionRows(holdings).slice(0, 5), [holdings])

  const topContributors = useMemo(() => {
    return holdings
      .map((holding) => {
        const pnl = (holding.currentPrice - holding.avgCost) * holding.shares
        return {
          ticker: holding.ticker,
          pnl,
          value: holding.shares * holding.currentPrice,
        }
      })
      .toSorted((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 4)
  }, [holdings])

  const performanceStats = useMemo(() => computePerformanceStats(trades), [trades])

  const donutSegments = useMemo(() => {
    const total = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
    if (total <= 0) return []
    return holdings
      .map(h => ({ ticker: h.ticker, pct: ((h.shares * h.currentPrice) / total) * 100 }))
      .filter(s => s.pct > 0)
      .toSorted((a, b) => b.pct - a.pct)
  }, [holdings])

  useEffect(() => {
    const fromQuery = parseBenchmarkId(searchParams.get('benchmark'))
    if (fromQuery !== benchmark) {
      setBenchmark(fromQuery)
      return
    }

    if (typeof window !== 'undefined') {
      const persisted = parseBenchmarkId(window.localStorage.getItem('stocks-portfolio-benchmark'))
      if (!searchParams.get('benchmark') && persisted !== benchmark) {
        setBenchmark(persisted)
      }
    }
  }, [benchmark, searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let changed = false

    for (const key of Array.from(params.keys())) {
      if (key !== 'benchmark') {
        params.delete(key)
        changed = true
      }
    }

    const rawBenchmark = params.get('benchmark')
    if (rawBenchmark !== null) {
      const normalizedBenchmark = parseBenchmarkId(rawBenchmark)
      if (normalizedBenchmark !== rawBenchmark) {
        params.set('benchmark', normalizedBenchmark)
        changed = true
      }
    }

    if (!changed) return

    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const handleBenchmarkChange = (nextBenchmark: BenchmarkId) => {
    setBenchmark(nextBenchmark)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('stocks-portfolio-benchmark', nextBenchmark)
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('benchmark', nextBenchmark)
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  return (
    <ConnectWalletEmptyState
      title="Connect to View Stocks"
      description="Connect your wallet to view your tokenized stock holdings and trade history."
    >
    <div className="w-full max-w-5xl mx-auto min-h-screen bg-dark-200 pb-24 md:pr-24">
      <h1 className="text-2xl font-bold text-white mb-6">Stock Portfolio</h1>
      {isDisconnected && <PortfolioOnboardingCard />}
      {isDisconnected && <WalletConnectConfigWarning className="mb-4" />}

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Total Value</div>
          <div className={`text-lg sm:text-xl font-bold ${isDisconnected ? 'text-gray-500' : 'text-white'}`}>
            {isDisconnected ? '—' : formatLargeNumber(summary.totalValue)}
          </div>
        </div>
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Unrealized P&L</div>
          {isDisconnected ? (
            <div className="text-lg sm:text-xl font-bold text-gray-500">—</div>
          ) : (
            <div className={`text-lg sm:text-xl font-bold ${summary.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.unrealizedPnl >= 0 ? '+' : ''}{formatStockPrice(summary.unrealizedPnl)}
              <span className="hidden sm:inline text-sm ml-1 opacity-70">({summary.pnlPercent >= 0 ? '+' : ''}{summary.pnlPercent.toFixed(1)}%)</span>
            </div>
          )}
        </div>
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">UBI Contributed</div>
          {isDisconnected ? (
            <div className="text-lg sm:text-xl font-bold text-gray-500">—</div>
          ) : (
            <div className="text-lg sm:text-xl font-bold text-goodgreen">
              {formatStockPrice((summary.totalValue || 0) * 0.003 * 0.2)}
              <span className="hidden sm:inline text-sm ml-1 opacity-70 text-gray-400">via fees</span>
            </div>
          )}
        </div>
        <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
          {isDisconnected ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1.5 gap-0.5">
                <span className="text-[10px] sm:text-xs text-gray-400">Collateral Health</span>
                <span className="text-[10px] sm:text-xs font-medium text-gray-500">Connect wallet to view collateral health</span>
              </div>
              <div className="h-1.5 bg-dark-50 rounded-full overflow-hidden" />
              <div className="hidden sm:block mt-2 text-xs text-gray-500">
                Connect wallet to unlock collateral monitoring.
              </div>
            </div>
          ) : (
            <>
              <CollateralHealth
                ratio={summary.healthRatio}
                totalRequired={summary.totalRequired}
                hasPositions={hasLivePositions}
              />
              <div className="hidden sm:block mt-2 text-xs text-gray-500">
                {hasRiskPosition
                  ? `${formatStockPrice(summary.totalCollateral)} / ${formatStockPrice(summary.totalRequired)} required`
                  : 'Collateral health appears after you open a leveraged position'}
              </div>
            </>
          )}
        </div>
      </div>

      {!isDisconnected ? (
      <>
      <section className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-4 mb-6">
        <PortfolioPnLChart
          values={trendValues}
          range={trendRange}
          onRangeChange={setTrendRange}
          currentValue={summary.totalValue}
          unrealizedPnl={summary.unrealizedPnl}
          height={200}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <section className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-4 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-white mb-3 self-start">Allocation</h2>
          <AllocationDonut segments={donutSegments} size={140} />
        </section>

        <section className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Performance Stats</h2>
          <PerformanceStatsPanel stats={performanceStats} />
        </section>

        <section className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-4">
          <h2 className="text-sm font-semibold text-white mb-2">Top Contributors</h2>
          {topContributors.length === 0 ? (
            <p className="text-xs text-gray-500">No contributors yet. Start trading to unlock attribution insights.</p>
          ) : (
            <div className="space-y-2">
              {topContributors.map((contributor) => (
                <div key={contributor.ticker} className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-50/20 p-2 text-xs">
                  <span className="text-gray-200">{contributor.ticker}</span>
                  <span className={contributor.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {contributor.pnl >= 0 ? '+' : ''}{formatStockPrice(contributor.pnl)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-700/20 bg-dark-100 p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-white">Portfolio Diagnostics</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {(['1W', '1M', '3M', '1Y'] as TrendRange[]).map((range) => (
                <button key={`diag-${range}`} type="button" onClick={() => setTrendRange(range)} className={`rounded px-2 py-1 text-[11px] ${trendRange === range ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
                  {range}
                </button>
              ))}
            </div>
            <select
              aria-label="Benchmark selector"
              value={benchmark}
              onChange={(event) => handleBenchmarkChange(parseBenchmarkId(event.target.value))}
              className="rounded-lg border border-gray-700/30 bg-dark-50/40 px-2 py-1 text-xs text-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50"
            >
              <option value="SPY">S&P proxy (SPY)</option>
              <option value="QQQ">Nasdaq proxy (QQQ)</option>
              <option value="DIA">Dow proxy (DIA)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <article className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Benchmark</h3>
            {isDisconnected ? (
              <p className="text-xs text-gray-500">Connect wallet to compare portfolio vs benchmark.</p>
            ) : (
              <>
                <svg viewBox="0 0 100 32" role="img" aria-label={`${trendRange} portfolio vs benchmark`} className="mb-2 h-20 w-full rounded-lg border border-gray-700/20 bg-dark-100/60">
                  <path d={trendPath} fill="none" stroke="#19f39f" strokeWidth="1.8" />
                  <path d={benchmarkPath} fill="none" stroke="#6b7280" strokeWidth="1.4" strokeDasharray="3 2" />
                </svg>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Portfolio</span>
                    <span className={portfolioDeltaPct >= 0 ? 'text-green-400' : 'text-red-400'}>{portfolioDeltaPct >= 0 ? '+' : ''}{portfolioDeltaPct.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{benchmark}</span>
                    <span className={benchmarkDeltaPct >= 0 ? 'text-green-400' : 'text-red-400'}>{benchmarkDeltaPct >= 0 ? '+' : ''}{benchmarkDeltaPct.toFixed(2)}%</span>
                  </div>
                </div>
              </>
            )}
          </article>

          <article className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Risk</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-2">
                <span className="text-gray-400">Max drawdown</span>
                <span className="text-white">{isDisconnected ? '—' : `${maxDrawdownPct.toFixed(2)}%`}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-2">
                <span className="text-gray-400">Volatility</span>
                <span className="text-white">{isDisconnected ? '—' : `${volatilityPct.toFixed(2)}%`}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-2">
                <span className="text-gray-400">Concentration</span>
                <span className="text-white">{isDisconnected ? '—' : `${concentrationPct.toFixed(1)}% top position`}</span>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Contribution</h3>
            {contributionRows.length === 0 ? (
              <p className="text-xs text-gray-500">Open positions to unlock contribution analytics.</p>
            ) : (
              <div className="space-y-1.5">
                {contributionRows.map((row) => (
                  <div key={`diag-${row.ticker}`} className="grid grid-cols-3 items-center rounded-lg border border-gray-700/20 bg-dark-100/60 px-2 py-1.5 text-xs">
                    <span className="text-gray-200">{row.ticker}</span>
                    <span className="text-gray-400 text-right">{row.weightPct.toFixed(1)}%</span>
                    <span className={`text-right ${row.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{row.pnl >= 0 ? '+' : ''}{formatStockPrice(row.pnl)}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
      </>
      ) : (
        <section className="mb-6 rounded-2xl border border-gray-700/20 bg-dark-100 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">What unlocks after connect</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <article className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3 text-xs text-gray-300">
              <div className="mb-1 text-goodgreen">Live holdings</div>
              Real position values, allocation mix, and unrealized P&amp;L.
            </article>
            <article className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3 text-xs text-gray-300">
              <div className="mb-1 text-goodgreen">Risk diagnostics</div>
              Collateral health, drawdown, volatility, and benchmark comparison.
            </article>
            <article className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3 text-xs text-gray-300">
              <div className="mb-1 text-goodgreen">UBI impact</div>
              Contribution insights tied to your stock activity.
            </article>
          </div>
        </section>
      )}

      <DeferredStocksPortfolioImpactSection userUBIContribution={(summary.totalValue || 0) * 0.003 * 0.2} />

      <Tabs defaultValue="holdings" className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-gray-700/20 bg-transparent p-0 h-auto">
          <TabsTrigger
            value="holdings"
            className="px-5 py-3 text-sm font-medium transition-colors rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-goodgreen data-[state=active]:shadow-none text-gray-400 hover:text-white"
          >
            Holdings ({holdings.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="px-5 py-3 text-sm font-medium transition-colors rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-goodgreen data-[state=active]:shadow-none text-gray-400 hover:text-white"
          >
            History ({trades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          {isLoading ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">Loading positions…</p>
            </div>
          ) : holdings.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-gray-400 text-sm mb-1">No positions yet</p>
              <p className="text-gray-600 text-xs mb-4">Start trading to build your portfolio</p>
              <Link href="/stocks" className="text-goodgreen text-sm hover:underline">Browse Stocks</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/30 text-gray-400">
                    <th className="text-left py-2.5 px-3 font-semibold">Stock</th>
                    <th className="text-right py-2.5 px-3 font-semibold">Shares</th>
                    <th className="text-right py-2.5 px-3 font-semibold hidden sm:table-cell">Avg Cost</th>
                    <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                    <th className="text-right py-2.5 px-3 font-semibold hidden sm:table-cell">Value</th>
                    <th className="text-right py-2.5 px-3 font-semibold">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => (
                    <HoldingRow key={h.ticker} holding={h} onClick={() => router.push(`/stocks/${h.ticker}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {trades.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No trade history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/30 text-gray-400">
                    <th className="text-left py-2.5 px-3 font-semibold">Stock</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Side</th>
                    <th className="text-right py-2.5 px-3 font-semibold">Shares</th>
                    <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                    <th className="text-right py-2.5 px-3 font-semibold hidden md:table-cell">Total</th>
                    <th className="text-right py-2.5 px-3 font-semibold hidden sm:table-cell">Date</th>
                    <th className="text-right py-2.5 px-3 font-semibold">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => <TradeRow key={t.id} trade={t} />)}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </ConnectWalletEmptyState>
  )
}
