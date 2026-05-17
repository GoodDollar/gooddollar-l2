'use client'

import Link from 'next/link'
import { formatPerpsPrice } from '@/lib/perpsData'
import { useOnChainPositions } from '@/lib/useOnChainPerps'
import { SectionHeader, EmptyState } from '@/components/ui'

export function LazyPerpsSection() {
  const { positions: perpsPositions } = useOnChainPositions()

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <SectionHeader
        title="Perpetuals"
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
          title="No perpetual positions"
          description="Trade leveraged positions on ETH, BTC and other assets."
          action={{ label: 'Start trading', href: '/perps' }}
        />
      ) : (
        <div className="space-y-2">
          {perpsPositions.slice(0, 3).map(p => {
            const isLong = p.side === 'long'
            const positionValue = p.size * p.markPrice

            return (
              <Link key={`${p.pair}-${p.side}`} href="/perps" className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-dark-50/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                    isLong
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {isLong ? 'L' : 'S'}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">{p.pair}</span>
                    <span className="text-xs text-gray-500 ml-1.5">
                      {p.size.toFixed(3)} @ {formatPerpsPrice(p.entryPrice)} ({p.leverage.toFixed(1)}x)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">${positionValue.toFixed(2)}</div>
                  <div className={`text-xs ${p.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.unrealizedPnl >= 0 ? '+' : ''}${p.unrealizedPnl.toFixed(2)}
                  </div>
                </div>
              </Link>
            )
          })}
          {perpsPositions.length > 3 && (
            <Link href="/perps/portfolio" className="block text-center py-2 text-xs text-gray-400 hover:text-goodgreen transition-colors">
              View all {perpsPositions.length} positions →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}