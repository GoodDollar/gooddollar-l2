'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { formatVolume } from '@/lib/predictData'
import { useOnChainPredictPositions, useOnChainMarkets } from '@/lib/useOnChainPredict'
import { SectionHeader, EmptyState } from '@/components/ui'

export function LazyPredictSection() {
  const { positions: predictPositions } = useOnChainPredictPositions()
  const { markets: predictMarkets } = useOnChainMarkets()

  // Build predict market lookup
  const predictMarketMap = useMemo(() => {
    const m = new Map<string, { question: string; yesPrice: number }>()
    for (const market of predictMarkets) {
      m.set(market.id, { question: market.question, yesPrice: market.yesPrice })
    }
    return m
  }, [predictMarkets])

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4">
      <SectionHeader
        title="Predictions"
        href="/predict/portfolio"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      {predictPositions.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No prediction positions"
          description="Trade on prediction markets to see your positions here."
          action={{ label: 'Browse markets', href: '/predict' }}
        />
      ) : (
        <div className="space-y-2">
          {predictPositions.slice(0, 3).map(p => {
            const market = predictMarketMap.get(p.marketId)
            const yesPrice = market?.yesPrice ?? 0
            const currentPrice = p.side === 'yes' ? yesPrice : 1 - yesPrice
            const value = p.shares * currentPrice
            const pnl = value - (p.shares * p.avgPrice)
            const sideLabel = p.side.toUpperCase()

            return (
              <Link key={`${p.marketId}-${p.side}`} href={`/predict/${p.marketId}`} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                    p.side === 'yes'
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {sideLabel}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-white truncate block">{market?.question || `Market ${p.marketId}`}</span>
                    <span className="text-xs text-gray-500">{formatVolume(p.shares)} shares @ {Math.round(currentPrice * 100)}¢</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">${value.toFixed(2)}</div>
                  <div className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                  </div>
                </div>
              </Link>
            )
          })}
          {predictPositions.length > 3 && (
            <Link href="/predict/portfolio" className="block text-center py-2 text-xs text-gray-400 hover:text-goodgreen transition-colors">
              View all {predictPositions.length} positions →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}