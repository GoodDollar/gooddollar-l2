'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import Link from 'next/link'
import { formatStockPrice, formatLargeNumber, formatStockShares, MAX_STOCK_ORDER_USD } from '@/lib/stockData'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { useStocksRebalanceStatus } from '@/lib/useStocksRebalanceStatus'
import { getAnalystOutlook } from '@/lib/stockInsights'
import { useStockNews } from '@/lib/useStockNews'
import { sanitizeNumericInput, formatTradeAmount } from '@/lib/format'
import { getChartData, type Timeframe } from '@/lib/chartData'
import { useWalletReady } from '@/lib/WalletReadyContext'
import { useMintSynthetic, useRedeemSynthetic, useStockPosition, type OnChainStockPosition } from '@/lib/useStocks'
import { computeSellGuards } from '@/lib/stocksOrderValidation'
import { toG$Wei } from '@/lib/gDollarAmount'
import { useMounted } from '@/lib/useMounted'
import { getRelatedSymbols, getTopMovers } from '@/lib/stockDiscovery'
import { AnalystOutlookCard } from '@/components/stocks/AnalystOutlookCard'
import { NewsEventsPanel } from '@/components/stocks/NewsEventsPanel'
import { RelatedMoversPanel } from '@/components/stocks/RelatedMoversPanel'
import { WalletConnectConfigWarning } from '@/components/stocks/WalletConnectConfigWarning'
import { PriceChart } from '@/components/PriceChart'
import { StockMarketData } from '@/components/stocks/StockMarketData'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { buildFundamentalsRows, parseTickerTab, type TickerTab } from './tickerTabState'

// NOTE: Keep these imports STATIC. Inside an App Router dynamic-segment
// page (e.g. `[ticker]/page.tsx`), wrapping a client component in
// `next/dynamic` with the no-SSR option produces a broken client-reference
// manifest in Next.js 14 production builds and causes a runtime
// `TypeError: Cannot read properties of undefined (reading 'call')`, which
// surfaces as HTTP 500. Use static imports plus the `useMounted()` gate
// below to defer rendering until after hydration instead.
// See task 0090 (initiative 0002) and task 0025 (initiative 0006).
// (A regression test at `src/__tests__/dynamic-routes-no-ssr-false.test.ts`
// enforces this rule; do not reintroduce the forbidden token here.)

function WalletGatedTradeButton({ hasAmount, children }: { hasAmount: boolean; children: React.ReactNode }) {
  const { isConnected } = useAccount()
  if (!isConnected) {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button type="button" onClick={openConnectModal}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors">
            Connect Wallet to Trade
          </button>
        )}
      </ConnectButton.Custom>
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

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y']
type PeerMetric = 'change24h' | 'marketCap' | 'peRatio'
const INVALID_TICKER_RECOVERY = ['AAPL', 'MSFT', 'NVDA'] as const
const SAFE_TICKER_PATTERN = /^[A-Z0-9]{1,16}$/
const UNSAFE_TICKER_PATTERN = /[%/\\\u0000-\u001F\u007F]|\.{2}/
const TRAILING_TICKER_DELIMITERS = /[/\\]+$/g

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
  const normalized = decoded.trim().toUpperCase().replace(TRAILING_TICKER_DELIMITERS, '')
  if (!normalized) return ''
  if (UNSAFE_TICKER_PATTERN.test(normalized)) return ''
  if (!SAFE_TICKER_PATTERN.test(normalized)) return ''
  return normalized
}

function formatEventDate(offsetDays: number): string {
  const now = new Date()
  const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatCalendarDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

type StockOrderType = 'market' | 'limit' | 'stop-limit'

function OrderForm({
  stock,
  position,
  riskIncreaseAllowed,
  riskStopReasons,
}: {
  stock: { ticker: string; price: number }
  position: OnChainStockPosition | null
  riskIncreaseAllowed: boolean
  riskStopReasons: string[]
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<StockOrderType>('market')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [triggerPrice, setTriggerPrice] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showTpSl, setShowTpSl] = useState(false)
  const [tp, setTp] = useState('')
  const [sl, setSl] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [slippage, setSlippage] = useState('0.5')
  const walletReady = useWalletReady()
  const { isConnected } = useAccount()
  const { mint, phase: mintPhase, error: mintError, isDeployed } = useMintSynthetic()
  const { redeem, phase: redeemPhase, error: redeemError } = useRedeemSynthetic()

  const parsedLimitPrice = parseFloat(limitPrice)
  const parsedTriggerPrice = parseFloat(triggerPrice)
  const limitPriceInvalid = orderType !== 'market' && limitPrice !== '' && (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0)
  const triggerPriceInvalid = orderType === 'stop-limit' && triggerPrice !== '' && (isNaN(parsedTriggerPrice) || parsedTriggerPrice <= 0)
  const hasValidPrice = orderType === 'market' || parsedLimitPrice > 0
  const effectivePrice = orderType !== 'market' && parsedLimitPrice > 0 ? parsedLimitPrice : (orderType !== 'market' ? 0 : stock.price)
  const parsedTp = parseFloat(tp) || 0
  const parsedSl = parseFloat(sl) || 0
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
  const buyBlockedBySync = side === 'buy' && !riskIncreaseAllowed
  const buySyncReason = riskStopReasons.length > 0 ? riskStopReasons.join(', ') : 'stale_propagation'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0 || limitPriceInvalid || triggerPriceInvalid || !hasValidPrice) return
    if (amountTooLarge) return
    if (sellDisabled) return
    if (side === 'buy' && !riskIncreaseAllowed) return

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

      <div className="flex gap-1 mb-4">
        {(['market', 'limit', 'stop-limit'] as StockOrderType[]).map(ot => (
          <button key={ot} type="button" onClick={() => setOrderType(ot)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${orderType === ot ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
            {ot}
          </button>
        ))}
      </div>

      {/* Advanced Options */}
      <div className="mb-3">
        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
          {showAdvanced ? '▾' : '▸'} Advanced Options
          {!showAdvanced && slippage !== '0.5' && (
            <span className="text-[10px] text-gray-600 ml-1">Slippage {slippage}%</span>
          )}
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <label className="text-xs text-gray-400 mb-1 block">Slippage Tolerance (%)</label>
            <div className="flex gap-1.5">
              {['0.1', '0.5', '1.0'].map(val => (
                <button key={val} type="button" onClick={() => setSlippage(val)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${slippage === val ? 'bg-goodgreen/15 text-goodgreen' : 'bg-dark-50 text-gray-400 hover:text-white'}`}>
                  {val}%
                </button>
              ))}
              <input type="text" inputMode="decimal" value={slippage}
                aria-label="Slippage Tolerance"
                onChange={e => setSlippage(sanitizeNumericInput(e.target.value))}
                className="flex-1 px-2 py-1 rounded bg-dark-50 border border-gray-700/30 text-white text-[10px] outline-none focus-visible:ring-1 focus-visible:ring-goodgreen/50 min-w-0" />
            </div>
          </div>
        )}
      </div>

      {/* Trigger Price (stop-limit only) */}
      {orderType === 'stop-limit' && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Trigger Price</label>
          <input type="text" inputMode="decimal" placeholder={stock.price.toFixed(2)} value={triggerPrice}
            aria-label="Trigger Price"
            onChange={e => setTriggerPrice(sanitizeNumericInput(e.target.value))}
            className={`w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${triggerPriceInvalid ? 'border-red-500/50' : 'border-gray-700/30'}`} />
          {triggerPriceInvalid && (
            <p className="text-red-400 text-[10px] mt-1">Price must be greater than 0</p>
          )}
        </div>
      )}

      {/* Limit Price (for limit and stop-limit) */}
      {orderType !== 'market' && (
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
      {buyBlockedBySync && (
        <div role="alert" aria-live="polite"
          className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          Risk-increasing orders are paused until symbol sync reaches the current block ({buySyncReason}).
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

      {/* TP / SL */}
      <div className="mb-3">
        <button type="button" onClick={() => setShowTpSl(!showTpSl)}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
          {showTpSl ? '▾' : '▸'} TP / SL
          {(tp || sl) && !showTpSl && (
            <span className="text-[10px] text-gray-600 ml-1">
              {tp ? `TP $${parsedTp.toFixed(2)}` : ''}{tp && sl ? ' / ' : ''}{sl ? `SL $${parsedSl.toFixed(2)}` : ''}
            </span>
          )}
        </button>
        {showTpSl && (
          <div className="space-y-2 mt-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Take Profit</label>
              <input type="text" inputMode="decimal"
                aria-label="Take Profit"
                placeholder={side === 'buy' ? (stock.price * 1.1).toFixed(2) : (stock.price * 0.9).toFixed(2)}
                value={tp}
                onChange={e => setTp(sanitizeNumericInput(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dark-50 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50" />
              {parsedTp > 0 && shares > 0 && effectivePrice > 0 && (() => {
                const diff = side === 'buy' ? parsedTp - effectivePrice : effectivePrice - parsedTp
                const pnl = diff * shares
                return (
                  <p className={`text-[10px] mt-1 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Est. Profit: {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </p>
                )
              })()}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Stop Loss</label>
              <input type="text" inputMode="decimal"
                aria-label="Stop Loss"
                placeholder={side === 'buy' ? (stock.price * 0.95).toFixed(2) : (stock.price * 1.05).toFixed(2)}
                value={sl}
                onChange={e => setSl(sanitizeNumericInput(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dark-50 border border-gray-700/30 text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50" />
              {parsedSl > 0 && shares > 0 && effectivePrice > 0 && (() => {
                const diff = side === 'buy' ? parsedSl - effectivePrice : effectivePrice - parsedSl
                const pnl = diff * shares
                return (
                  <p className={`text-[10px] mt-1 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Est. Loss: {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </p>
                )
              })()}
            </div>
          </div>
        )}
      </div>

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
          <button type="submit" disabled={limitPriceInvalid || triggerPriceInvalid || !hasValidPrice || isPending || sellSharesExceedsBalance || amountTooLarge || buyBlockedBySync}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}>
            {actionPhase === 'approving' ? 'Approving…' : actionPhase === 'pending' ? 'Confirming…' : actionPhase === 'done' ? 'Order Submitted!' : submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`}
          </button>
        </WalletGatedTradeButton>
      ) : (
        <button type="submit" disabled={!hasAmount || limitPriceInvalid || triggerPriceInvalid || !hasValidPrice || sellDisabled || amountTooLarge || buyBlockedBySync}
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams()
  const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : (params.ticker as string | undefined)
  const ticker = normalizeTickerForLookup(rawTicker)
  const { stocks, isLive } = useOnChainStocks()
  const { bySymbol: rebalanceBySymbol } = useStocksRebalanceStatus(ticker ? [ticker] : [])
  const tickerRebalance = ticker ? rebalanceBySymbol[ticker] : undefined
  const riskIncreaseAllowed = tickerRebalance?.riskIncreaseAllowed ?? true
  const riskStopReasons = tickerRebalance?.stopReasons ?? []
  const stock = stocks.find(s => s.ticker === ticker)
  const { position } = useStockPosition(ticker ?? '')
  const [timeframe, setTimeframe] = useState<Timeframe>('3M')
  const [activeTab, setActiveTab] = useState<TickerTab>(() => parseTickerTab(searchParams.get('tab')))
  const [analysisExpanded, setAnalysisExpanded] = useState(true)
  const [peerMetric, setPeerMetric] = useState<PeerMetric>('change24h')
  const [analystLoading, setAnalystLoading] = useState(true)
  const analystOutlook = useMemo(() => (ticker ? getAnalystOutlook(ticker) : null), [ticker])
  const { items: newsItems, isLoading: newsLoading, error: newsError } = useStockNews(ticker ?? '')
  // Defer chart render until after hydration to avoid SSR layout glitches
  // and the Next.js 14 dynamic-segment manifest bug. See task 0090.
  const chartMounted = useMounted()

  const chartData = useMemo(() => {
    if (!stock || !chartMounted) return []
    return getChartData(stock.ticker, timeframe, stock.price)
  }, [chartMounted, stock, timeframe])
  const hasPosition = !!position && position.debtFloat > 0
  const relatedSymbols = useMemo(() => (stock ? getRelatedSymbols(stocks, stock.ticker, 4) : []), [stocks, stock])
  const topMovers = useMemo(() => getTopMovers(stocks, 5), [stocks])
  const peerCandidates = useMemo(() => {
    if (!stock) return []
    const directPeers = relatedSymbols.length > 0 ? relatedSymbols : topMovers.filter((candidate) => candidate.ticker !== stock.ticker)
    return directPeers.slice(0, 5)
  }, [relatedSymbols, stock, topMovers])
  const trendSummary = useMemo(() => {
    if (!chartData.length) return null
    const first = chartData[0]?.close ?? 0
    const last = chartData[chartData.length - 1]?.close ?? 0
    if (first <= 0 || last <= 0) return null
    const changePct = ((last - first) / first) * 100
    let signal: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral'
    if (changePct > 2) signal = 'Bullish'
    if (changePct < -2) signal = 'Bearish'
    const high = Math.max(...chartData.map((point) => point.high))
    const low = Math.min(...chartData.map((point) => point.low))
    const spreadPct = first > 0 ? ((high - low) / first) * 100 : 0
    return { signal, changePct, spreadPct }
  }, [chartData])
  const fundamentalsRows = useMemo(() => (stock ? buildFundamentalsRows(stock) : []), [stock])
  const eventTimeline = useMemo(() => {
    if (!stock) return []
    const upcoming = [
      { id: `${stock.ticker}-earnings-next`, label: 'Earnings call', date: formatEventDate(7), status: 'Upcoming' },
      { id: `${stock.ticker}-dividend-next`, label: 'Dividend ex-date', date: stock.dividendYield > 0 ? formatEventDate(13) : 'Not scheduled', status: stock.dividendYield > 0 ? 'Upcoming' : 'Info' },
    ]
    const recent = newsItems.slice(0, 2).map((item, idx) => ({
      id: item.id,
      label: item.headline,
      date: formatCalendarDate(item.publishedAt),
      status: idx === 0 ? 'Recent' : 'Catalyst',
    }))
    return [...upcoming, ...recent]
  }, [newsItems, stock])

  useEffect(() => {
    setAnalystLoading(true)
    const timer = setTimeout(() => setAnalystLoading(false), 140)
    return () => clearTimeout(timer)
  }, [ticker])

  useEffect(() => {
    const nextTab = parseTickerTab(searchParams.get('tab'))
    if (nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }, [activeTab, searchParams])

  useEffect(() => {
    const rawTab = searchParams.get('tab')
    if (rawTab === null) return
    const canonicalTab = parseTickerTab(rawTab)
    if (rawTab === canonicalTab) return
    const nextParams = new URLSearchParams(searchParams.toString())
    if (canonicalTab === 'overview') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', canonicalTab)
    }
    const next = nextParams.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const handleTabChange = (nextTab: TickerTab) => {
    setActiveTab(nextTab)
    const nextParams = new URLSearchParams(searchParams.toString())
    if (nextTab === 'overview') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', nextTab)
    }
    const next = nextParams.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
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
      <WalletConnectConfigWarning className="mb-4" />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-xs font-bold text-goodgreen">
              {stock.ticker.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{stock.ticker}</h1>
              <p className="text-sm text-gray-400">{stock.name} · {stock.sector}</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-white">{formatStockPrice(stock.price)}</span>
            <span className={`text-sm font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
            </span>
          </div>
          <div className="mb-4 min-h-[1.75rem]">
            {chartMounted ? (
              <OracleStatusBadge
                variant="detail"
                symbol={stock.ticker}
                useStocksFallback
                onChainReachable={isLive}
              />
            ) : null}
          </div>

          <AnalystOutlookCard
            currentPrice={stock.price}
            outlook={analystOutlook}
            isLoading={analystLoading}
          />

          <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4">
            <div className="flex gap-1 mb-3">
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeframe === tf ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}>
                  {tf}
                </button>
              ))}
            </div>
            {chartMounted ? (
              <PriceChart data={chartData} height={350} />
            ) : (
              <div className="w-full bg-dark-50/30 rounded-xl animate-pulse" style={{ height: 350 }} />
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-700/20 bg-dark-100/70 p-2">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'overview' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('fundamentals')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'fundamentals' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}
            >
              Fundamentals
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('events')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'events' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}
            >
              Events
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
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
            </>
          )}

          {activeTab === 'fundamentals' && (
            <section className="rounded-2xl border border-gray-700/20 bg-dark-100 p-5">
              <h2 className="mb-3 text-sm font-semibold text-white">Fundamentals</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {fundamentalsRows.map((row) => (
                  <div key={row.label} className="rounded-xl border border-gray-700/20 bg-dark-50/20 px-3 py-2.5">
                    <div className="text-[11px] text-gray-500">{row.label}</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{row.value}</div>
                    <div className={`mt-0.5 text-[11px] ${row.positive === null ? 'text-gray-400' : row.positive ? 'text-green-400' : 'text-red-400'}`}>{row.delta}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'events' && (
            <section className="rounded-2xl border border-gray-700/20 bg-dark-100 p-5">
              <h2 className="mb-3 text-sm font-semibold text-white">Events</h2>
              {eventTimeline.length === 0 ? (
                <p className="text-xs text-gray-500">No event data available right now.</p>
              ) : (
                <ul className="space-y-2">
                  {eventTimeline.map((event) => (
                    <li key={event.id} className="rounded-xl border border-gray-700/20 bg-dark-50/20 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{event.label}</span>
                        <span className="text-[10px] text-gray-500">{event.status}</span>
                      </div>
                      <p className="text-xs text-gray-400">{event.date}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeTab === 'overview' && (
          <section className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4" aria-labelledby="analysis-heading">
            <div className="flex items-center justify-between gap-2">
              <h2 id="analysis-heading" className="text-sm font-semibold text-white">Analysis</h2>
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-white transition-colors"
                onClick={() => setAnalysisExpanded((open) => !open)}
                aria-expanded={analysisExpanded}
              >
                {analysisExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {analysisExpanded && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Valuation</div>
                    <div className="mt-1 text-sm font-medium text-white">P/E {stock.peRatio.toFixed(1)}x</div>
                  </div>
                  <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Profitability</div>
                    <div className={`mt-1 text-sm font-medium ${stock.eps >= 0 ? 'text-green-400' : 'text-red-400'}`}>EPS ${stock.eps.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Income</div>
                    <div className="mt-1 text-sm font-medium text-white">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}% yield` : 'No dividend'}</div>
                  </div>
                  <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 p-3">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Liquidity</div>
                    <div className="mt-1 text-sm font-medium text-white">{formatLargeNumber(stock.avgVolume).replace('$', '')} avg vol</div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700/30 bg-dark-50/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300">Peer Compare</h3>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className={`px-2 py-1 rounded-md text-[11px] ${peerMetric === 'change24h' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`} onClick={() => setPeerMetric('change24h')}>24h%</button>
                      <button type="button" className={`px-2 py-1 rounded-md text-[11px] ${peerMetric === 'marketCap' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`} onClick={() => setPeerMetric('marketCap')}>Mkt Cap</button>
                      <button type="button" className={`px-2 py-1 rounded-md text-[11px] ${peerMetric === 'peRatio' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`} onClick={() => setPeerMetric('peRatio')}>P/E</button>
                    </div>
                  </div>
                  {peerCandidates.length === 0 ? (
                    <p className="text-xs text-gray-500">Peer data unavailable right now.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {peerCandidates
                        .toSorted((a, b) => (b[peerMetric] - a[peerMetric]))
                        .map((peer) => (
                          <div key={peer.ticker} className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2 text-xs">
                            <Link href={`/stocks/${peer.ticker}`} className="font-medium text-white hover:text-goodgreen transition-colors">{peer.ticker}</Link>
                            {peerMetric === 'change24h' && (
                              <span className={peer.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {peer.change24h >= 0 ? '+' : ''}{peer.change24h.toFixed(2)}%
                              </span>
                            )}
                            {peerMetric === 'marketCap' && <span className="text-gray-200">{formatLargeNumber(peer.marketCap)}</span>}
                            {peerMetric === 'peRatio' && <span className="text-gray-200">{peer.peRatio.toFixed(1)}x</span>}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-700/30 bg-dark-50/20 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">Trend Summary</h3>
                  {!trendSummary ? (
                    <p className="text-xs text-gray-500">Trend signal unavailable while chart data loads.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2">
                        <div className="text-gray-500">Signal</div>
                        <div className={`mt-1 font-semibold ${trendSummary.signal === 'Bullish' ? 'text-green-400' : trendSummary.signal === 'Bearish' ? 'text-red-400' : 'text-gray-200'}`}>{trendSummary.signal}</div>
                      </div>
                      <div className="rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2">
                        <div className="text-gray-500">{timeframe} move</div>
                        <div className={`mt-1 font-semibold ${trendSummary.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trendSummary.changePct >= 0 ? '+' : ''}{trendSummary.changePct.toFixed(2)}%
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2">
                        <div className="text-gray-500">Range spread</div>
                        <div className="mt-1 font-semibold text-gray-200">{trendSummary.spreadPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
          )}

          {activeTab === 'overview' && stock.description && (
            <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
              <h2 className="text-sm font-semibold text-white mb-2">About {stock.name}</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{stock.description}</p>
            </div>
          )}

          {activeTab === 'overview' && (
            <NewsEventsPanel
              ticker={stock.ticker}
              isLoading={newsLoading}
              error={newsError}
              items={newsItems}
            />
          )}
        </div>

        <div className="lg:w-80 shrink-0">
          {!isLive && (
            <aside
              role="note"
              className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
              title="On-chain StocksPriceOracle is unreachable. Prices on this page are demo data."
            >
              <span className="font-semibold">Demo data:</span>{' '}
              On-chain stocks oracle is not reachable. Prices are illustrative only and orders cannot settle.
            </aside>
          )}
          <OrderForm
            stock={stock}
            position={position}
            riskIncreaseAllowed={riskIncreaseAllowed}
            riskStopReasons={riskStopReasons}
          />

          <StockMarketData markPrice={stock.price} />

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
