'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { formatStockPrice, formatLargeNumber } from '@/lib/stockData'
import { formatVolume } from '@/lib/predictData'
import { useOnChainPredictPositions, useOnChainPredictSummary, useOnChainMarkets } from '@/lib/useOnChainPredict'
import { formatPerpsPrice } from '@/lib/perpsData'
import { useOnChainHoldings } from '@/lib/useOnChainStocks'
import { useOnChainPositions, useOnChainAccountSummary } from '@/lib/useOnChainPerps'
import { ConnectWalletEmptyState } from '@/components/ConnectWalletEmptyState'
import { ConnectWalletBanner } from '@/components/ConnectWalletBanner'
import { PortfolioOnChain } from '@/components/PortfolioOnChain'
import { Sparkline } from '@/components/Sparkline'
import { getStockByTicker } from '@/lib/stockData'
import { SummaryCard, SectionHeader, EmptyState } from '@/components/ui'


export default function PortfolioPage() {
  const { holdings: stockHoldings } = useOnChainHoldings()
  const { positions: predictPositions } = useOnChainPredictPositions()
  const predictSummary = useOnChainPredictSummary()
  const { markets: predictMarkets } = useOnChainMarkets()
  const { positions: perpsPositions } = useOnChainPositions()
  const { summary: perpsAccount } = useOnChainAccountSummary()

  // Build predict market lookup
  const predictMarketMap = useMemo(() => {
    const m = new Map<string, { question: string; yesPrice: number }>()
    for (const market of predictMarkets) {
      m.set(market.id, { question: market.question, yesPrice: market.yesPrice })
    }
    return m
  }, [predictMarkets])

  // Compute stock summary from on-chain holdings
  const stockSummary = useMemo(() => {
    const totalValue = stockHoldings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
    const totalCost = stockHoldings.reduce((sum, h) => sum + h.shares * h.avgCost, 0)
    return { totalValue, unrealizedPnl: totalValue - totalCost }
  }, [stockHoldings])

  const totalPerpsPnl = perpsPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0)

  const totalValue = stockSummary.totalValue + predictSummary.currentValue + perpsAccount.equity
  const totalPnl = stockSummary.unrealizedPnl + predictSummary.unrealizedPnl + totalPerpsPnl
  const totalPositions = stockHoldings.length + predictPositions.length + perpsPositions.length

  const pnlColor = totalPnl >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <ConnectWalletEmptyState>
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Portfolio Overview</h1>

      {/* CTA banner: prompts disconnected / wrong-chain users to take action.
          Renders nothing when connected to chain 42069. */}
      <ConnectWalletBanner />

      {/* Live on-chain positions — only visible when connected to devnet (chain 42069) */}
      <PortfolioOnChain />

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <SummaryCard label="Total Value" value={formatLargeNumber(totalValue)} />
        <SummaryCard
          label="Unrealized P&L"
          value={`${totalPnl >= 0 ? '+' : ''}${formatStockPrice(totalPnl)}`}
          color={pnlColor}
        />
        <SummaryCard label="Active Positions" value={String(totalPositions)} />
      </div>

      {/* Stocks Section */}
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4">
        <SectionHeader
          title="Stocks"
          href="/stocks/portfolio"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        {stockHoldings.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            title="No stock holdings yet"
            description="Buy synthetic stocks like sAAPL or sTSLA to start tracking them here."
            action={{ label: 'Browse stocks', href: '/stocks' }}
          />
        ) : (
          <div className="space-y-2">
            {stockHoldings.slice(0, 3).map(h => {
              const stockName: string | null = null // on-chain doesn't store display names
              const value = h.shares * h.currentPrice
              const pnl = value - h.shares * h.avgCost

              // Get stock data for sparkline - derive P&L sparkline from price history
              const stockData = getStockByTicker(h.ticker)
              const pnlSparkline = stockData?.sparkline7d?.map(price =>
                h.shares * (price - h.avgCost)
              ) || []

              return (
                <Link key={h.ticker} href={`/stocks/${h.ticker}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-[8px] font-bold text-goodgreen">
                      {h.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{h.ticker}</span>
                      {stockName && <span className="text-xs text-gray-500 ml-1.5">{stockName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pnlSparkline.length > 0 && (
                      <div className="hidden sm:block">
                        <Sparkline data={pnlSparkline} positive={pnl >= 0} width={60} height={24} />
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-sm text-white">{formatStockPrice(value)}</div>
                      <div className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{formatStockPrice(pnl)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            {stockHoldings.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-1">+{stockHoldings.length - 3} more</p>
            )}
          </div>
        )}
      </div>

      {/* Predictions Section */}
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4">
        <SectionHeader
          title="Predictions"
          href="/predict/portfolio"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        {predictPositions.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="No prediction positions yet"
            description="Take a YES or NO position on a market to back your forecast."
            action={{ label: 'Browse markets', href: '/predict' }}
          />
        ) : (
          <div className="space-y-2">
            {predictPositions.slice(0, 3).map(pos => {
              const market = predictMarketMap.get(pos.marketId)
              const currentVal = pos.side === 'yes' ? pos.currentPrice : 1 - pos.currentPrice
              const pnl = pos.shares * (currentVal - pos.avgPrice)
              return (
                <Link key={pos.marketId} href={`/predict/${pos.marketId}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-white truncate">{market?.question ?? `Market #${pos.marketId}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pos.side === 'yes' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {pos.side.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{pos.shares.toFixed(1)} shares</span>
                    </div>
                  </div>
                  <div className={`text-sm font-medium shrink-0 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </div>
                </Link>
              )
            })}
            {predictPositions.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-1">+{predictPositions.length - 3} more</p>
            )}
          </div>
        )}
      </div>

      {/* Perps Section */}
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4">
        <SectionHeader
          title="Perpetual Futures"
          href="/perps/portfolio"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
        />
        {perpsPositions.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
            title="No open perps positions"
            description="Open a long or short with leverage on BTC, ETH and more."
            action={{ label: 'Open a position', href: '/perps' }}
          />
        ) : (
          <div className="space-y-2">
            {perpsPositions.slice(0, 3).map((pos, i) => (
              <Link key={i} href="/perps/portfolio" className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-white">{pos.pair}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pos.side === 'long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {pos.side.toUpperCase()} {pos.leverage}x
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.unrealizedPnl >= 0 ? '+' : ''}{formatPerpsPrice(pos.unrealizedPnl)}
                  </div>
                  <div className="text-xs text-gray-500">Size {pos.size}</div>
                </div>
              </Link>
            ))}
            {perpsPositions.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-1">+{perpsPositions.length - 3} more</p>
            )}
          </div>
        )}
      </div>

      {/* Lending Section */}
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4">
        <SectionHeader
          title="Lending"
          href="/lend"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
        />
        <EmptyState
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
          title="No lending positions yet"
          description="Supply assets to earn interest and help fund UBI."
          action={{ label: 'Start lending', href: '/lend' }}
        />
      </div>

      {/* Yield Vaults Section */}
      <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
        <SectionHeader
          title="Yield Vaults"
          href="/yield"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <EmptyState
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No vault deposits yet"
          description="Deposit into ERC-4626 vaults to auto-compound yield."
          action={{ label: 'Explore vaults', href: '/yield' }}
        />
      </div>
    </div>
    </ConnectWalletEmptyState>
  )
}
