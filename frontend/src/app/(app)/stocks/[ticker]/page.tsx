'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

import Link from 'next/link'
import { formatStockPrice, formatLargeNumber } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { getAnalystOutlook } from '@/lib/stockInsights'
import { useStockNews } from '@/lib/useStockNews'
import { getChartData, type Timeframe } from '@/lib/chartData'
import { useStockPosition } from '@/lib/useStocks'
import { useMounted } from '@/lib/useMounted'
import { getRelatedSymbols, getTopMovers } from '@/lib/stockDiscovery'
import { AnalystOutlookCard } from '@/components/stocks/AnalystOutlookCard'
import { NewsEventsPanel } from '@/components/stocks/NewsEventsPanel'
import { RelatedMoversPanel } from '@/components/stocks/RelatedMoversPanel'
import { WatchlistStarButton } from '@/components/stocks/WatchlistStarButton'
import { PriceChart } from '@/components/PriceChart'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL']
const INVALID_TICKER_RECOVERY = ['AAPL', 'MSFT', 'NVDA'] as const
const SAFE_TICKER_PATTERN = /^[A-Z0-9]{1,16}$/
const UNSAFE_TICKER_PATTERN = /[%/\\\u0000-\u001F\u007F]|\.{2}/
const StockOrderForm = dynamic(
  () => import('@/components/stocks/StockOrderForm').then((mod) => mod.StockOrderForm),
  {
    ssr: false,
    loading: () => (
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 animate-pulse">
        <div className="h-4 w-20 rounded bg-dark-50/70 mb-3" />
        <div className="h-10 rounded-xl bg-dark-50/60 mb-2" />
        <div className="h-10 rounded-xl bg-dark-50/40 mb-3" />
        <div className="h-10 rounded-xl bg-dark-50/50" />
      </div>
    ),
  },
)

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
  const params = useParams()
  const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : (params.ticker as string | undefined)
  const ticker = normalizeTickerForLookup(rawTicker)
  const { stocks } = useOnChainStocks()
  const stock = stocks.find(s => s.ticker === ticker)
  const { position } = useStockPosition(ticker ?? '')
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [analystLoading, setAnalystLoading] = useState(true)
  const analystOutlook = useMemo(() => (ticker ? getAnalystOutlook(ticker) : null), [ticker])
  const { items: newsItems, isLoading: newsLoading, error: newsError } = useStockNews(ticker ?? '')
  // Defer chart render until after hydration to avoid SSR layout glitches
  // and the Next.js 14 dynamic-segment manifest bug. See task 0090.
  const chartMounted = useMounted()

  const chartData = useMemo(() => {
    if (!stock) return []
    return getChartData(stock.ticker, timeframe, stock.price)
  }, [stock, timeframe])
  const hasPosition = !!position && position.debtFloat > 0
  const relatedSymbols = useMemo(() => (stock ? getRelatedSymbols(stocks, stock.ticker, 4) : []), [stocks, stock])
  const topMovers = useMemo(() => getTopMovers(stocks, 5), [stocks])

  useEffect(() => {
    setAnalystLoading(true)
    const timer = setTimeout(() => setAnalystLoading(false), 140)
    return () => clearTimeout(timer)
  }, [ticker])

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

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-white">{formatStockPrice(stock.price)}</span>
            <span className={`text-sm font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
            </span>
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
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setTimeframe(tf)}
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
            {chartMounted ? (
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

          <NewsEventsPanel
            ticker={stock.ticker}
            isLoading={newsLoading}
            error={newsError}
            items={newsItems}
          />
        </div>

        <div className="lg:w-80 shrink-0">
          <StockOrderForm stock={stock} position={position} />

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
