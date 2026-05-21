'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import Link from 'next/link'
import { formatStockPrice, formatLargeNumber, formatStockShares, MAX_STOCK_ORDER_USD } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { getAnalystOutlook } from '@/lib/stockInsights'
import { useStockNews } from '@/lib/useStockNews'
import { sanitizeNumericInput, formatTradeAmount } from '@/lib/format'
import { getChartData, type Timeframe } from '@/lib/chartData'
import { useWalletReady } from '@/lib/WalletReadyContext'
import { isWalletConnectConfigured } from '@/lib/walletConnectReadiness'
import { useMintSynthetic, useRedeemSynthetic, useStockPosition, type OnChainStockPosition } from '@/lib/useStocks'
import { computeSellGuards } from '@/lib/stocksOrderValidation'
import { toG$Wei } from '@/lib/gDollarAmount'
import { useMounted } from '@/lib/useMounted'
import { getRelatedSymbols, getTopMovers } from '@/lib/stockDiscovery'
import { WalletConnectNotice } from '@/components/stocks/WalletConnectNotice'

const PriceChart = dynamic(
  () => import('@/components/PriceChart').then((m) => ({ default: m.PriceChart })),
  { ssr: false }
)

const OracleStatusBadge = dynamic(
  () => import('@/components/OracleStatusBadge').then((m) => ({ default: m.OracleStatusBadge })),
  { ssr: false }
)

const DeferredAnalystOutlookCard = dynamic(
  () => import('@/components/stocks/AnalystOutlookCard').then((m) => ({ default: m.AnalystOutlookCard })),
  {
    ssr: false,
    loading: () => (
      <div className="mb-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-4 sm:p-5 animate-pulse">
        <div className="h-3 w-32 bg-dark-50 rounded mb-3" />
        <div className="h-8 w-28 bg-dark-50 rounded mb-2" />
        <div className="h-2.5 w-full bg-dark-50 rounded" />
      </div>
    ),
  },
)

const DeferredNewsEventsPanel = dynamic(
  () => import('@/components/stocks/NewsEventsPanel').then((m) => ({ default: m.NewsEventsPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4 animate-pulse">
        <div className="h-4 w-28 bg-dark-50 rounded mb-3" />
        <div className="space-y-2.5">
          <div className="h-3 w-full bg-dark-50 rounded" />
          <div className="h-3 w-5/6 bg-dark-50 rounded" />
          <div className="h-3 w-3/4 bg-dark-50 rounded" />
        </div>
      </div>
    ),
  },
)

const DeferredRelatedMoversPanel = dynamic(
  () => import('@/components/stocks/RelatedMoversPanel').then((m) => ({ default: m.RelatedMoversPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-5 animate-pulse">
        <div className="h-4 w-36 bg-dark-50 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-9 w-full bg-dark-50 rounded-lg" />
          <div className="h-9 w-full bg-dark-50 rounded-lg" />
          <div className="h-9 w-full bg-dark-50 rounded-lg" />
        </div>
      </div>
    ),
  },
)

function WalletGatedTradeButton({ hasAmount, children }: { hasAmount: boolean; children: React.ReactNode }) {
  const { isConnected } = useAccount()
  const walletConnectConfigured = isWalletConnectConfigured()
  if (!isConnected) {
    return (
      <div className="space-y-2">
        {!walletConnectConfigured && <WalletConnectNotice />}
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button type="button" onClick={openConnectModal}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-goodgreen text-[#031615] hover:bg-[#22c5b6] active:bg-[#00a697] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 transition-colors">
              Connect Wallet to Trade
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    )
  }
  if (!hasAmount) {
    return (
      <button type="button" disabled
        className="w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed">
        Enter Amount
      </button>
    )
  }
  return <>{children}</>
}

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y']
const INVALID_TICKER_RECOVERY = ['AAPL', 'MSFT', 'NVDA'] as const
const SAFE_TICKER_PATTERN = /^[A-Z0-9]{1,16}$/
const UNSAFE_TICKER_PATTERN = /[%/\\\u0000-\u001F\u007F]|\.{2}/

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

function OrderForm({ stock, position }: { stock: { ticker: string; price: number }; position: OnChainStockPosition | null }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const walletReady = useWalletReady()
  const { isConnected } = useAccount()
  const { mint, phase: mintPhase, error: mintError, isDeployed } = useMintSynthetic()
  const { redeem, phase: redeemPhase, error: redeemError } = useRedeemSynthetic()

  const parsedLimitPrice = parseFloat(limitPrice)
  const limitPriceInvalid = orderType === 'limit' && limitPrice !== '' && (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0)
  const hasValidPrice = orderType === 'market' || parsedLimitPrice > 0
  const effectivePrice = orderType === 'limit' && parsedLimitPrice > 0 ? parsedLimitPrice : (orderType === 'limit' ? 0 : stock.price)
  const shares = amount && effectivePrice > 0 ? parseFloat(amount) / effectivePrice : 0
  const fee = amount ? parseFloat(amount) * 0.001 : 0
  const ubiFee = fee * 0.2
  // Sanity-cap the Amount (USD) input so the summary cannot advertise
  // implausibly large notional values (e.g. $1T phantom orders) and so
  // we never submit an order the chain would just revert. See task 0058.
  const parsedAmount = parseFloat(amount)
  const amountTooLarge = !!amount && Number.isFinite(parsedAmount) && parsedAmount > MAX_STOCK_ORDER_USD
  const hasAmount = !!amount && parsedAmount > 0 && !amountTooLarge

  // Sell-side balance gating: when a user is on the Sell tab we must not
  // let them attempt to burn more sToken debt than they actually minted —
  // the on-chain `burn` call would revert with poor UX. See task 0057.
  const { sellGated, sellSharesExceedsBalance, balanceShares } = computeSellGuards({
    side,
    isConnected,
    debtFloat: position?.debtFloat ?? null,
    sharesRequested: shares,
  })
  const sellDisabled = sellGated || sellSharesExceedsBalance

  const actionPhase = side === 'buy' ? mintPhase : redeemPhase
  const actionError = side === 'buy' ? mintError : redeemError
  const isPending = actionPhase === 'approving' || actionPhase === 'pending'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || limitPriceInvalid || !hasValidPrice) return
    if (amountTooLarge) return
    if (sellDisabled) return

    if (isDeployed && orderType === 'market') {
      const amountNum = parseFloat(amount)
      // Assume G$ ≈ $0.01 on devnet for collateral calculation.
      // Route through toG$Wei (parseUnits) — never `Math.round(x * 1e18)`,
      // which drifts by tens of millions of wei on realistic trade sizes.
      const GD_PRICE_USD = 0.01
      const collateralGD = amountNum / GD_PRICE_USD
      const collateralWei = toG$Wei(collateralGD)
      const sharesWei = toG$Wei(shares)
      if (side === 'buy') {
        await mint(stock.ticker, collateralWei, sharesWei)
      } else {
        // Redeem: burn shares and withdraw equivalent collateral
        await redeem(stock.ticker, sharesWei, collateralWei)
      }
    } else {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <form id="stock-order-form" onSubmit={handleSubmit} className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Buy
        </button>
        <button type="button" onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`}>
          Sell
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setOrderType('market')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${orderType === 'market' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
          Market
        </button>
        <button type="button" onClick={() => setOrderType('limit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${orderType === 'limit' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
          Limit
        </button>
      </div>

      {orderType === 'limit' && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Limit Price</label>
          <input type="text" inputMode="decimal" placeholder="0.00" value={limitPrice} onChange={e => setLimitPrice(sanitizeNumericInput(e.target.value))}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${limitPriceInvalid ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {limitPriceInvalid && (
            <p className="text-red-400 text-[10px] mt-1">Price must be greater than 0</p>
          )}
        </div>
      )}

      {sellGated && (
        <div role="alert" aria-live="polite"
          className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          You have no {stock.ticker} to sell. Switch to <span className="font-semibold">Buy</span> to open a position first.
        </div>
      )}
      {sellSharesExceedsBalance && (
        <div role="alert" aria-live="polite"
          className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          You only hold {balanceShares.toFixed(4)} {stock.ticker}. Reduce the amount to sell.
        </div>
      )}

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
        <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(sanitizeNumericInput(e.target.value))}
          aria-invalid={sellSharesExceedsBalance || amountTooLarge || undefined}
          className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${sellSharesExceedsBalance || amountTooLarge ? 'border-red-500/50' : 'border-gray-700/30'}`} />
        {amountTooLarge && (
          <p className="text-red-400 text-[10px] mt-1">
            Max order is ${MAX_STOCK_ORDER_USD.toLocaleString('en-US')} per trade. Split larger orders into multiple smaller ones.
          </p>
        )}
      </div>

      {amount && parseFloat(amount) > 0 && hasValidPrice && effectivePrice > 0 && !sellGated && !amountTooLarge && (
        <div className="mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Est. Shares</span>
            <span className="text-white truncate ml-2">{formatStockShares(shares)} {stock.ticker}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price</span>
            <span className="text-white truncate ml-2">{formatStockPrice(effectivePrice)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Fee (0.1%)</span>
            <span className="text-white truncate ml-2">{formatTradeAmount(fee)}</span>
          </div>
          <div className="flex justify-between text-goodgreen/80">
            <span>→ UBI Pool (20%)</span>
            <span className="truncate ml-2">{formatTradeAmount(ubiFee)}</span>
          </div>
        </div>
      )}

      {actionError && (
        <p className="text-[10px] text-red-400 text-center truncate mb-2">{actionError}</p>
      )}
      {walletReady && sellGated ? (
        <button type="button" disabled
          className="w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed">
          No {stock.ticker} to sell
        </button>
      ) : walletReady ? (
        <WalletGatedTradeButton hasAmount={hasAmount && hasValidPrice && !sellSharesExceedsBalance}>
          <button type="submit" disabled={limitPriceInvalid || !hasValidPrice || isPending || sellSharesExceedsBalance || amountTooLarge}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}>
            {actionPhase === 'approving' ? 'Approving…' : actionPhase === 'pending' ? 'Confirming…' : actionPhase === 'done' ? 'Order Submitted!' : submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
          </button>
        </WalletGatedTradeButton>
      ) : (
        <button type="submit" disabled={!hasAmount || limitPriceInvalid || !hasValidPrice || sellDisabled || amountTooLarge}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
          }`}>
          {submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
        </button>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-goodgreen">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        <span>0.1% fee → 20% funds UBI</span>
      </div>
    </form>
  )
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
        <div
          data-testid="stocks-detail-main-column"
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-xs font-bold text-goodgreen">
              {stock.ticker.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{stock.ticker}</h1>
              <p className="text-xs sm:text-sm text-gray-400">{stock.name} · {stock.sector}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl sm:text-3xl font-bold text-white">{formatStockPrice(stock.price)}</span>
            <span className={`text-xs sm:text-sm font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
            </span>
          </div>
          <div className="mb-4">
            <OracleStatusBadge variant="detail" symbol={stock.ticker} />
          </div>

          <DeferredAnalystOutlookCard
            currentPrice={stock.price}
            outlook={analystOutlook}
            isLoading={analystLoading}
          />

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-3 sm:p-4 mb-4">
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeframe === tf ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
                  {tf}
                </button>
              ))}
            </div>
            {chartMounted ? (
              <PriceChart data={chartData} height={300} />
            ) : (
              <div className="w-full bg-dark-50/30 rounded-xl animate-pulse h-[300px]" />
            )}
          </div>

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Key Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
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
              <div className="hidden sm:block">
                <div className="text-gray-500 text-xs mb-0.5">P/E Ratio</div>
                <div className="text-white font-medium">{stock.peRatio.toFixed(1)}x</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-gray-500 text-xs mb-0.5">EPS</div>
                <div className={`font-medium ${stock.eps >= 0 ? 'text-green-400' : 'text-red-400'}`}>${stock.eps.toFixed(2)}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-gray-500 text-xs mb-0.5">Dividend Yield</div>
                <div className="text-white font-medium">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-gray-500 text-xs mb-0.5">Avg Volume</div>
                <div className="text-white font-medium">{formatLargeNumber(stock.avgVolume).replace('$', '')}</div>
              </div>
            </div>
            <details className="sm:hidden mt-3 border-t border-gray-700/20 pt-3">
              <summary className="text-xs font-medium text-goodgreen cursor-pointer select-none">
                More metrics
              </summary>
              <div className="grid grid-cols-2 gap-3 text-sm mt-2">
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
            </details>
          </div>

          {stock.description && (
            <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
              <h2 className="text-sm font-semibold text-white mb-2">About {stock.name}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{stock.description}</p>
            </div>
          )}

          <DeferredNewsEventsPanel
            ticker={stock.ticker}
            isLoading={newsLoading}
            error={newsError}
            items={newsItems}
          />
        </div>

        <div
          data-testid="stocks-detail-side-column"
          className="lg:w-80 shrink-0"
        >
          <OrderForm stock={stock} position={position} />

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

          <DeferredRelatedMoversPanel
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
