'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { formatStockPrice, formatLargeNumber, type PortfolioHolding, type TradeRecord } from '@/lib/stockData'
import { useStockHoldings } from '@/lib/useStockHoldings'
import { useStockTrades } from '@/lib/useStockTrades'
import { isWalletConnectConfigured } from '@/lib/walletConnectReadiness'
import { ConnectWalletEmptyState } from '@/components/ConnectWalletEmptyState'
import { WalletConnectNotice } from '@/components/stocks/WalletConnectNotice'
import { StocksConnectFallbackRail } from '@/components/stocks/StocksConnectFallbackRail'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PRECONNECT_BENCHMARKS = [
  { ticker: 'NVDA', move: '+3.2%', volume: '$310.0M' },
  { ticker: 'AAPL', move: '+1.3%', volume: '$62.0M' },
  { ticker: 'TSLA', move: '-2.1%', volume: '$95.0M' },
] as const

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
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-goodgreen text-[#031615] hover:bg-[#22c5b6] active:bg-[#00a697] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 transition-colors"
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
  return (
    <tr className="border-b border-gray-700/10">
      <td className="py-3 px-3 text-sm text-white">{trade.ticker}</td>
      <td className="py-3 px-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.side === 'buy' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {trade.side.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm">{trade.shares.toFixed(2)}</td>
      <td className="py-3 px-3 text-right text-white text-sm">{formatStockPrice(trade.price)}</td>
      <td className="py-3 px-3 text-right text-gray-400 text-sm hidden sm:table-cell">
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-500'}`}>
        {trade.pnl !== 0 ? `${trade.pnl > 0 ? '+' : ''}${formatStockPrice(trade.pnl)}` : '—'}
      </td>
    </tr>
  )
}

export default function StocksPortfolioPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const walletConnectConfigured = isWalletConnectConfigured()
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

  const summary = { totalValue, unrealizedPnl, pnlPercent, totalCollateral, totalRequired, healthRatio }
  const isDisconnected = !isConnected || !address
  const hasLivePositions = holdings.some((holding) => holding.shares > 0)
  const hasRiskPosition = hasLivePositions && summary.totalRequired > 0
  const isLoading = holdingsLoading || tradesLoading

  return (
    <ConnectWalletEmptyState
      title="Connect to View Stocks"
      description="Connect your wallet to view your tokenized stock holdings and trade history."
    >
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Stock Portfolio</h1>
      {isDisconnected && !walletConnectConfigured && (
        <>
          <WalletConnectNotice className="mb-3" />
          <StocksConnectFallbackRail
            onUseInBrowserWallet={() => router.push('/stocks/AAPL')}
            onTryAnotherConnector={() => router.push('/stocks/AAPL')}
            onContinueReadOnly={() => router.push('/stocks')}
            continueLabel="Continue in Read-only Mode"
          />
        </>
      )}
      {isDisconnected ? (
        <section
          data-testid="stocks-portfolio-disconnected-hero"
          className="mb-6 rounded-2xl border border-goodgreen/20 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5 p-5 sm:p-6"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-white">Start your stock portfolio</h2>
          <p className="mt-2 text-sm text-gray-200">
            Connect your wallet to unlock portfolio value, collateral health, and UBI contribution tracking.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-700/30 bg-dark-100/55 px-3 py-2 text-xs text-gray-200">Connect wallet</div>
            <div className="rounded-xl border border-gray-700/30 bg-dark-100/55 px-3 py-2 text-xs text-gray-200">Review live metrics</div>
            <div className="rounded-xl border border-gray-700/30 bg-dark-100/55 px-3 py-2 text-xs text-gray-200">Track impact and holdings</div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-goodgreen text-[#031615] font-semibold text-sm hover:bg-[#22c5b6] active:bg-[#00a697] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 transition-colors"
            >
              Connect Wallet to Unlock Portfolio
            </button>
            <Link href="/stocks" className="text-sm text-goodgreen hover:text-[#22c5b6] transition-colors">
              Browse Stocks First
            </Link>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2" data-testid="stocks-portfolio-preconnect-preview">
            <div className="rounded-xl border border-gray-700/25 bg-dark-100/70 p-3">
              <p className="text-xs font-semibold text-white">Market benchmark preview</p>
              <p className="mt-1 text-[11px] text-gray-400">Today&apos;s synthetic movers (read-only preview)</p>
              <div className="mt-2.5 space-y-1.5">
                {PRECONNECT_BENCHMARKS.map((entry) => (
                  <div key={entry.ticker} className="flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-50/45 px-2 py-1.5 text-xs">
                    <span className="text-gray-200">{entry.ticker}</span>
                    <span className={entry.move.startsWith('-') ? 'text-red-300' : 'text-green-300'}>{entry.move}</span>
                    <span className="text-gray-400">{entry.volume}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-700/25 bg-dark-100/70 p-3">
              <p className="text-xs font-semibold text-white">Portfolio health preview</p>
              <p className="mt-1 text-[11px] text-gray-400">Sample values to show what unlocks after connect</p>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-gray-700/25 bg-dark-50/45 p-2">
                  <p className="text-gray-400">Value</p>
                  <p className="mt-1 text-white">$4,320</p>
                </div>
                <div className="rounded-lg border border-gray-700/25 bg-dark-50/45 p-2">
                  <p className="text-gray-400">P&L</p>
                  <p className="mt-1 text-green-300">+6.4%</p>
                </div>
                <div className="rounded-lg border border-gray-700/25 bg-dark-50/45 p-2">
                  <p className="text-gray-400">UBI impact</p>
                  <p className="mt-1 text-goodgreen">$2.59</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
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
              <div className={`text-lg sm:text-xl font-bold ${summary.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.unrealizedPnl >= 0 ? '+' : ''}{formatStockPrice(summary.unrealizedPnl)}
                <span className="hidden sm:inline text-sm ml-1 opacity-70">({summary.pnlPercent >= 0 ? '+' : ''}{summary.pnlPercent.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
              <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">UBI Contributed</div>
              <div className="text-lg sm:text-xl font-bold text-goodgreen">
                {formatStockPrice((summary.totalValue || 0) * 0.003 * 0.2)}
                <span className="hidden sm:inline text-sm ml-1 opacity-70 text-gray-400">via fees</span>
              </div>
            </div>
            <div className="bg-dark-100 rounded-xl sm:rounded-2xl border border-gray-700/20 p-3 sm:p-5">
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
            </div>
          </div>

          <DeferredStocksPortfolioImpactSection userUBIContribution={(summary.totalValue || 0) * 0.003 * 0.2} />
        </>
      )}

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
          ) : isDisconnected ? (
            <div className="py-16 text-center">
              <p className="text-gray-300 text-sm mb-1">Connect wallet to unlock your holdings timeline</p>
              <p className="text-gray-500 text-xs mb-4">Preview cards above show the metrics you will get after connection.</p>
              <Link href="/stocks" className="text-goodgreen text-sm hover:underline">Browse Stocks</Link>
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
          {isDisconnected ? (
            <div className="py-16 text-center">
              <p className="text-gray-300 text-sm mb-1">Connect wallet to unlock trade history and UBI impact timeline</p>
              <p className="text-gray-500 text-xs">You can keep exploring markets before connecting.</p>
            </div>
          ) : trades.length === 0 ? (
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
