'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { formatStockPrice } from '@/lib/stockData'
import { useOnChainHoldings } from '@/lib/useOnChainStocks'
import { Sparkline } from '@/components/Sparkline'
import { getStockByTicker } from '@/lib/stockData'
import { SectionHeader, EmptyState } from '@/components/ui'

export function LazyStocksSection() {
  const { holdings: stockHoldings } = useOnChainHoldings()

  return (
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
            <Link href="/stocks/portfolio" className="block text-center py-2 text-xs text-gray-400 hover:text-goodgreen transition-colors">
              View all {stockHoldings.length} stocks →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}