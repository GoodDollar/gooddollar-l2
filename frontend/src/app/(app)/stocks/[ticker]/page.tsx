'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBlockNumber } from 'wagmi'

import Link from 'next/link'
import { formatStockPrice, formatLargeNumber } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { getAnalystOutlook } from '@/lib/stockInsights'
import { useStockNews } from '@/lib/useStockNews'
import { getChartData, type Timeframe } from '@/lib/chartData'
import { useStockPosition } from '@/lib/useStocks'
import { useMounted } from '@/lib/useMounted'
import { getRelatedSymbols, getTopMovers } from '@/lib/stockDiscovery'
import dynamic from 'next/dynamic'
import { WatchlistStarButton } from '@/components/stocks/WatchlistStarButton'
import { StockOrderForm } from '@/components/stocks/StockOrderForm'
import { StockOrderFormFallback } from '@/components/stocks/StockOrderFormFallback'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { usePriceServiceStatus, getConsecutiveFailures } from '@/lib/usePriceServiceStatus'
import { OracleUnavailableBanner } from '@/components/stocks/OracleUnavailableBanner'
import { RebalanceErrorBoundary } from '@/components/stocks/RebalanceErrorBoundary'

const PriceChart = dynamic(
  () => import('@/components/PriceChart').then(mod => ({ default: mod.PriceChart })),
  { ssr: false, loading: () => <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} /> },
)
const AnalystOutlookCard = dynamic(
  () => import('@/components/stocks/AnalystOutlookCard').then(mod => ({ default: mod.AnalystOutlookCard })),
  { ssr: false, loading: () => <div className="h-28 bg-dark-50/30 rounded-2xl animate-pulse mb-4" /> },
)
const NewsEventsPanel = dynamic(
  () => import('@/components/stocks/NewsEventsPanel').then(mod => ({ default: mod.NewsEventsPanel })),
  { ssr: false, loading: () => <div className="h-48 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)
const RelatedMoversPanel = dynamic(
  () => import('@/components/stocks/RelatedMoversPanel').then(mod => ({ default: mod.RelatedMoversPanel })),
  { ssr: false, loading: () => <div className="h-40 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)
const StockResearchHub = dynamic(
  () => import('@/components/stocks/StockResearchHub').then(mod => ({ default: mod.StockResearchHub })),
  { ssr: false, loading: () => <div className="h-32 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)
const ExposureNettingPanel = dynamic(
  () => import('@/components/stocks/ExposureNettingPanel').then(mod => ({ default: mod.ExposureNettingPanel })),
  { ssr: false, loading: () => <div className="h-24 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)
const AmmTradingPanel = dynamic(
  () => import('@/components/stocks/AmmTradingPanel').then(mod => ({ default: mod.AmmTradingPanel })),
  { ssr: false, loading: () => <div className="h-48 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)
const RebalanceSyncPanel = dynamic(
  () => import('@/components/stocks/RebalanceSyncPanel').then(mod => ({ default: mod.RebalanceSyncPanel })),
  { ssr: false, loading: () => <div className="h-20 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)
import { getMarketHoursState } from '@/lib/ammPricing'
import {
  type SymbolExposureSummary,
  aggregateExposure,
  classifyResidual,
  computePortfolioDelta,
} from '@/lib/exposureNetting'
import { buildSymbolRebalanceStatus, evaluateRebalanceGuard } from '@/lib/stocksRebalanceInvariant'

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL']
const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  '1D': 'Past Day',
  '1W': 'Past Week',
  '1M': 'Past Month',
  '3M': 'Past 3 Months',
  '6M': 'Past 6 Months',
  '1Y': 'Past Year',
  '5Y': 'Past 5 Years',
  'ALL': 'All Time',
}
const INVALID_TICKER_RECOVERY = ['AAPL', 'MSFT', 'NVDA'] as const
const SAFE_TICKER_PATTERN = /^[A-Z0-9]{1,16}$/
const UNSAFE_TICKER_PATTERN = /[%/\\\u0000-\u001F\u007F]|\.{2}/
const RESERVED_SUBPATHS: Record<string, string> = {
  MARKETS: '/stocks',
  EXPOSURE: '/stocks',
  TRADE: '/stocks',
  SETTINGS: '/stocks',
}

function decodeTickerBounded(rawTicker?: string): string {
  if (!rawTicker) return ''
  let decoded = rawTicker
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      break
    }
  }
  return decoded
}

function normalizeTickerForLookup(rawTicker?: string): string {
  const decoded = decodeTickerBounded(rawTicker)
  if (decoded.length > 64) return ''
  if (UNSAFE_TICKER_PATTERN.test(decoded)) return ''
  const normalized = decoded.trim().toUpperCase()
  if (!normalized) return ''
  if (UNSAFE_TICKER_PATTERN.test(normalized)) return ''
  if (!SAFE_TICKER_PATTERN.test(normalized)) return ''
  return normalized
}

export default function StockDetailPage() {
  const router = useRouter()
  const params = useParams()
  const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : (params.ticker as string | undefined)
  const ticker = normalizeTickerForLookup(rawTicker)
  const { stocks } = useOnChainStocks()
  const { status: oracleStatus, error: oracleError, refresh: oracleRefresh } = usePriceServiceStatus()
  const { data: chainBlock } = useBlockNumber({ query: { refetchInterval: 12_000 } })
  const currentBlock = chainBlock ? Number(chainBlock) : null
  const stock = stocks.find(s => s.ticker === ticker)
  const { position } = useStockPosition(ticker ?? '')
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [symbolQuery, setSymbolQuery] = useState('')
  const [symbolError, setSymbolError] = useState('')
  const [showMobileSwitcher, setShowMobileSwitcher] = useState(false)
  const [analystLoading, setAnalystLoading] = useState(true)
  const analystOutlook = useMemo(() => (ticker ? getAnalystOutlook(ticker) : null), [ticker])
  const { items: newsItems, isLoading: newsLoading, error: newsError } = useStockNews(ticker ?? '')
  // Defer chart render until after hydration to avoid SSR layout glitches
  // and the Next.js 14 dynamic-segment manifest bug. See task 0090.
  const mounted = useMounted()

  const chartData = useMemo(() => {
    if (!stock || !mounted) return []
    return getChartData(stock.ticker, timeframe, stock.price)
  }, [mounted, stock, timeframe])
  const dayRange = useMemo(() => {
    if (!stock || !mounted) return null
    const intraday = getChartData(stock.ticker, '1D', stock.price)
    if (intraday.length === 0) return null
    const low = intraday.reduce((acc, candle) => Math.min(acc, candle.low), Number.POSITIVE_INFINITY)
    const high = intraday.reduce((acc, candle) => Math.max(acc, candle.high), Number.NEGATIVE_INFINITY)
    if (!Number.isFinite(low) || !Number.isFinite(high)) return null
    return { low, high }
  }, [mounted, stock])
  const performanceSummary = useMemo(() => {
    if (!mounted || chartData.length < 2) return null
    const firstClose = chartData[0]?.close ?? 0
    const lastClose = chartData[chartData.length - 1]?.close ?? 0
    if (!Number.isFinite(firstClose) || firstClose <= 0 || !Number.isFinite(lastClose)) return null
    const changeAbs = lastClose - firstClose
    const changePct = (changeAbs / firstClose) * 100
    return { changeAbs, changePct, label: TIMEFRAME_LABEL[timeframe] }
  }, [chartData, mounted, timeframe])
  const hasPosition = !!position && position.debtFloat > 0
  const relatedSymbols = useMemo(() => (stock ? getRelatedSymbols(stocks, stock.ticker, 4) : []), [stocks, stock])
  const topMovers = useMemo(() => getTopMovers(stocks, 5), [stocks])
  const switchableSymbols = useMemo(
    () => stocks.map((s) => ({ ticker: s.ticker, name: s.name })),
    [stocks],
  )
  const filteredSymbols = useMemo(() => {
    const q = symbolQuery.trim().toUpperCase()
    if (!q) return switchableSymbols.slice(0, 8)
    return switchableSymbols
      .filter((s) => s.ticker.includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, 8)
  }, [symbolQuery, switchableSymbols])
  const symbolRebalanceStatus = useMemo(
    () => buildSymbolRebalanceStatus(ticker, oracleStatus),
    [oracleStatus, ticker],
  )
  const rebalanceGuard = useMemo(
    () => evaluateRebalanceGuard(symbolRebalanceStatus, currentBlock),
    [symbolRebalanceStatus, currentBlock],
  )
  const riskBlockReason = rebalanceGuard.blocked ? rebalanceGuard.reasons[0] ?? 'Sync required' : null

  const exposureSummaries: SymbolExposureSummary[] = useMemo(() => {
    if (!position || position.debtFloat <= 0 || !stock) return []
    const positionUsd = position.debtFloat * stock.price
    const exposures = [{ product: 'amm' as const, sizeUsd: positionUsd, direction: 'long' as const }]
    const agg = aggregateExposure(exposures)
    const gross = agg.grossLongUsd + agg.grossShortUsd
    return [{
      symbol: stock.ticker,
      ...agg,
      classification: classifyResidual(agg.netExposureUsd, gross),
      byProduct: exposures,
    }]
  }, [position, stock])

  const portfolioDelta = useMemo(
    () => computePortfolioDelta(exposureSummaries),
    [exposureSummaries],
  )
  const marketState = useMemo(() => getMarketHoursState(new Date()), [])
  const timeframeTabRefs = useRef<Record<Timeframe, HTMLButtonElement | null>>({
    '1D': null,
    '1W': null,
    '1M': null,
    '3M': null,
    '6M': null,
    '1Y': null,
    '5Y': null,
    ALL: null,
  })

  useEffect(() => {
    setAnalystLoading(true)
    const timer = setTimeout(() => setAnalystLoading(false), 140)
    return () => clearTimeout(timer)
  }, [ticker])

  useEffect(() => {
    if (!symbolError) return
    const timer = setTimeout(() => setSymbolError(''), 3000)
    return () => clearTimeout(timer)
  }, [symbolError])

  const reservedRedirect = RESERVED_SUBPATHS[ticker]
  useEffect(() => {
    if (reservedRedirect) router.replace(reservedRedirect)
  }, [reservedRedirect, router])

  function navigateToSymbol(raw: string) {
    const q = raw.trim().toUpperCase()
    if (!q) return
    const selected = switchableSymbols.find((s) => s.ticker === q || s.name.toUpperCase() === q)
      ?? switchableSymbols.find((s) => s.ticker.startsWith(q) || s.name.toUpperCase().startsWith(q))
    if (!selected) {
      setSymbolError(`"${q}" not found — try a valid ticker`)
      return
    }
    if (selected.ticker === ticker) return
    setSymbolError('')
    router.push(`/stocks/${selected.ticker}`)
    setSymbolQuery('')
    setShowMobileSwitcher(false)
  }

  function moveTimeframeSelection(current: Timeframe, direction: 'next' | 'prev' | 'start' | 'end') {
    const currentIndex = TIMEFRAMES.findIndex((tf) => tf === current)
    if (currentIndex === -1) return

    let targetIndex = currentIndex
    if (direction === 'next') targetIndex = (currentIndex + 1) % TIMEFRAMES.length
    if (direction === 'prev') targetIndex = (currentIndex - 1 + TIMEFRAMES.length) % TIMEFRAMES.length
    if (direction === 'start') targetIndex = 0
    if (direction === 'end') targetIndex = TIMEFRAMES.length - 1

    const nextTimeframe = TIMEFRAMES[targetIndex]
    if (!nextTimeframe) return
    setTimeframe(nextTimeframe)
    timeframeTabRefs.current[nextTimeframe]?.focus()
  }

  if (reservedRedirect) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400 animate-pulse">Redirecting…</p>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-white mb-3">Stock Not Found</h1>
        <p className="text-sm text-gray-400 mb-6 max-w-md">
          This stock symbol is not available.
        </p>
        <Link href="/stocks" className="px-6 py-3 rounded-xl bg-goodgreen text-black font-semibold hover:bg-goodgreen-600 transition-colors">
          Back to Stocks
        </Link>
        <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
          <span>Try:</span>
          {INVALID_TICKER_RECOVERY.map(symbol => (
            <Link
              key={symbol}
              href={`/stocks/${symbol}`}
              className="px-2.5 py-1 rounded-lg border border-gray-700/40 bg-dark-50/40 text-gray-200 hover:text-white hover:border-goodgreen/40 transition-colors"
            >
              {symbol}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Link href="/stocks" prefetch={false} className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-4">
        <span>←</span> Back to Stocks
      </Link>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-xs font-bold text-goodgreen">
              {stock.ticker.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{stock.ticker}</h1>
                <WatchlistStarButton ticker={stock.ticker} size="md" />
              </div>
              <p className="text-sm text-gray-400">{stock.name} · {stock.sector}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="hidden sm:flex items-center gap-2">
              <label htmlFor="stock-symbol-switcher" className="text-xs text-gray-400">Switch symbol</label>
              <input
                id="stock-symbol-switcher"
                type="text"
                value={symbolQuery}
                list="stock-symbol-switch-options"
                onChange={(e) => { setSymbolQuery(e.target.value); setSymbolError('') }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    navigateToSymbol(symbolQuery)
                  }
                }}
                placeholder="Type ticker or company"
                aria-label="Switch stock symbol"
                className="flex-1 max-w-sm rounded-lg border border-gray-700/40 bg-dark-50/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-goodgreen/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => navigateToSymbol(symbolQuery)}
                className="rounded-lg bg-goodgreen/20 px-3 py-2 text-xs font-semibold text-goodgreen hover:bg-goodgreen/30 transition-colors"
              >
                Go
              </button>
            </div>
            {symbolError && !showMobileSwitcher && (
              <p className="text-red-400/80 text-xs mt-1 hidden sm:block">{symbolError}</p>
            )}
            <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setShowMobileSwitcher((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-goodgreen/30 bg-dark-50/50 px-3 py-2 text-xs font-semibold text-goodgreen"
              >
                Switch Symbol
              </button>
              {showMobileSwitcher && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={symbolQuery}
                      list="stock-symbol-switch-options"
                      onChange={(e) => { setSymbolQuery(e.target.value); setSymbolError('') }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          navigateToSymbol(symbolQuery)
                        }
                      }}
                      placeholder="Type ticker"
                      aria-label="Switch stock symbol mobile"
                      className="flex-1 rounded-lg border border-gray-700/40 bg-dark-50/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-goodgreen/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => navigateToSymbol(symbolQuery)}
                      className="rounded-lg bg-goodgreen/20 px-3 py-2 text-xs font-semibold text-goodgreen"
                    >
                      Go
                    </button>
                  </div>
                  {symbolError && (
                    <p className="text-red-400/80 text-xs mt-1">{symbolError}</p>
                  )}
                </div>
              )}
            </div>
            <datalist id="stock-symbol-switch-options">
              {filteredSymbols.map((s) => (
                <option key={s.ticker} value={s.ticker}>{s.name}</option>
              ))}
            </datalist>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-white">{formatStockPrice(stock.price)}</span>
            <span className={`text-sm font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
            </span>
          </div>
          <div className="mb-2 text-xs text-gray-500">
            USD · Oracle source: stocks-keeper · Updated live
          </div>
          <div className="mb-4">
            <OracleStatusBadge variant="detail" symbol={stock.ticker} useStocksFallback />
          </div>

          <AnalystOutlookCard
            currentPrice={stock.price}
            outlook={analystOutlook}
            isLoading={analystLoading}
          />

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4">
            {performanceSummary && (
              <div className="mb-3 flex items-baseline gap-2">
                <span
                  className={`text-xl font-semibold tabular-nums ${
                    performanceSummary.changePct >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {performanceSummary.changePct >= 0 ? '+' : ''}
                  {performanceSummary.changePct.toFixed(2)}%
                </span>
                <span className="text-sm text-gray-400">{performanceSummary.label}</span>
              </div>
            )}
            <div
              className="mb-3 flex flex-nowrap gap-1 overflow-x-auto pb-1 whitespace-nowrap sm:flex-wrap sm:overflow-visible sm:pb-0"
              role="tablist"
              aria-label="Chart timeframe"
            >
              {TIMEFRAMES.map(tf => {
                const isActive = timeframe === tf
                return (
                  <button
                    key={tf}
                    ref={(node) => {
                      timeframeTabRefs.current[tf] = node
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setTimeframe(tf)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight') {
                        event.preventDefault()
                        moveTimeframeSelection(tf, 'next')
                      } else if (event.key === 'ArrowLeft') {
                        event.preventDefault()
                        moveTimeframeSelection(tf, 'prev')
                      } else if (event.key === 'Home') {
                        event.preventDefault()
                        moveTimeframeSelection(tf, 'start')
                      } else if (event.key === 'End') {
                        event.preventDefault()
                        moveTimeframeSelection(tf, 'end')
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                      isActive
                        ? 'bg-goodgreen/15 text-goodgreen ring-1 ring-goodgreen/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tf}
                  </button>
                )
              })}
            </div>
            {mounted ? (
              <PriceChart data={chartData} height={350} />
            ) : (
              <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} />
            )}
          </div>

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Key Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Market Cap</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.marketCap)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">24h Volume</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.volume24h)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Sector</div>
                <div className="text-white font-medium">{stock.sector}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">52W High</div>
                <div className="text-white font-medium">{formatStockPrice(stock.high52w)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">52W Low</div>
                <div className="text-white font-medium">{formatStockPrice(stock.low52w)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Day Range</div>
                <div className="text-white font-medium">
                  {dayRange ? `${formatStockPrice(dayRange.low)} - ${formatStockPrice(dayRange.high)}` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">24h Change</div>
                <div className={`font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">P/E Ratio</div>
                <div className="text-white font-medium">{stock.peRatio.toFixed(1)}x</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">EPS</div>
                <div className={`font-medium ${stock.eps >= 0 ? 'text-green-400' : 'text-red-400'}`}>${stock.eps.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Dividend Yield</div>
                <div className="text-white font-medium">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Avg Volume</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.avgVolume).replace('$', '')}</div>
              </div>
            </div>
          </div>

          {stock.description && (
            <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
              <h2 className="text-sm font-semibold text-white mb-2">About {stock.name}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{stock.description}</p>
            </div>
          )}

          <StockResearchHub
            ticker={stock.ticker}
            companyName={stock.name}
            sector={stock.sector}
            summary={stock.description}
          />

          <NewsEventsPanel
            ticker={stock.ticker}
            isLoading={newsLoading}
            error={newsError}
            items={newsItems}
          />
        </div>

        <div className="lg:w-80 shrink-0">
          {mounted ? (
            <StockOrderForm stock={stock} position={position} riskBlockReason={riskBlockReason} />
          ) : (
            <StockOrderFormFallback />
          )}

          <OracleUnavailableBanner
            error={oracleError}
            consecutiveFailures={getConsecutiveFailures()}
            onRetry={oracleRefresh}
          />

          <RebalanceErrorBoundary>
            <RebalanceSyncPanel
              status={symbolRebalanceStatus}
              guard={rebalanceGuard}
              currentBlock={currentBlock}
            />
          </RebalanceErrorBoundary>

          {hasPosition && (
            <ExposureNettingPanel
              summaries={exposureSummaries}
              portfolioDelta={portfolioDelta}
            />
          )}

          <AmmTradingPanel
            oraclePrice={stock.price}
            inventoryLong={stock.volume24h * 0.6}
            inventoryShort={stock.volume24h * 0.4}
            poolLiquidity={stock.volume24h * 2}
            marketState={marketState}
            ticker={stock.ticker}
          />

          <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Your Position</h3>
            {hasPosition ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {position.debtFloat.toFixed(4)}
                  </span>
                  <span className="text-xs font-medium text-gray-400">{stock.ticker}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-gray-400">
                  <span>Notional value</span>
                  <span className="text-white tabular-nums">{formatStockPrice(position.debtFloat * stock.price)}</span>
                </div>
                {position.collateralFloat > 0 && (
                  <div className="flex items-baseline justify-between text-xs text-gray-400">
                    <span>Collateral locked</span>
                    <span className="text-white tabular-nums">{position.collateralFloat.toFixed(2)} G$</span>
                  </div>
                )}
                {position.collateralRatio > 0 && (
                  <div className="flex items-baseline justify-between text-xs text-gray-400">
                    <span>Collateral ratio</span>
                    <span className="text-white tabular-nums">{(position.collateralRatio * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                </svg>
                No position in {stock.ticker}
                <div className="mt-1 text-xs text-gray-600">Place an order to get started</div>
              </div>
            )}
          </div>

          <RelatedMoversPanel
            currentTicker={stock.ticker}
            related={relatedSymbols}
            movers={topMovers}
          />

          {hasPosition ? (
            <div className="mt-4 bg-dark-100/50 rounded-2xl border border-gray-700/10 p-4">
              <p className="text-xs text-gray-500 mb-2">Also on GoodDollar</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/explore" prefetch={false} className="text-xs text-gray-400 hover:text-goodgreen transition-colors inline-flex items-center gap-1">
                  Explore crypto tokens
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/perps" prefetch={false} className="text-xs text-gray-400 hover:text-goodgreen transition-colors inline-flex items-center gap-1">
                  Trade crypto perpetual futures
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/predict" prefetch={false} className="text-xs text-gray-400 hover:text-goodgreen transition-colors inline-flex items-center gap-1">
                  Prediction markets
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-dark-100/50 rounded-2xl border border-goodgreen/20 p-4">
              <p className="text-xs text-gray-500 mb-2">Next steps in stocks</p>
              <div className="flex flex-col gap-1.5">
                <Link href={`/stocks/${stock.ticker}#stock-order-form`} prefetch={false} className="text-xs text-goodgreen hover:text-goodgreen/80 transition-colors inline-flex items-center gap-1">
                  Buy s{stock.ticker}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/stocks/portfolio" prefetch={false} className="text-xs text-gray-300 hover:text-goodgreen transition-colors inline-flex items-center gap-1">
                  Open Stock Portfolio
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <Link href="/stocks" prefetch={false} className="text-xs text-gray-300 hover:text-goodgreen transition-colors inline-flex items-center gap-1">
                  Browse Stocks
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
