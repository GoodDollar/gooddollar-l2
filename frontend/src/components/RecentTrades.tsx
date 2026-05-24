'use client'

/**
 * RecentTrades — DEMO / FIXTURE COMPONENT ONLY.
 *
 * GoodPerps has no on-chain trade tape (fills price off the oracle mark
 * against an AMM-style margin engine). Production routes MUST NOT mount
 * `DemoRecentTrades` or call `generateDemoRecentTrades`. Use
 * `<PerpsMarketStructureCard>` instead (task 0043). The generator is
 * kept exported for storybook only.
 */

import { useMemo } from 'react'
import { formatPerpsPrice } from '@/lib/perpsData'

interface RecentTrade {
  price: number
  size: number
  side: 'buy' | 'sell'
  time: string
}

// DEMO ONLY (task 0043). Production /perps uses `PerpsMarketStructureCard`.
function generateDemoRecentTrades(midPrice: number, count: number = 20): RecentTrade[] {
  const trades: RecentTrade[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.5) * midPrice * 0.002
    const side = Math.random() > 0.5 ? 'buy' : 'sell' as const
    const time = new Date(now.getTime() - i * (2000 + Math.random() * 8000))
    trades.push({
      price: midPrice + drift,
      size: parseFloat((0.01 + Math.random() * 3).toFixed(3)),
      side,
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    })
  }
  return trades
}

interface DemoRecentTradesProps {
  markPrice: number
}

/**
 * DemoRecentTrades — DEMO / FIXTURE COMPONENT ONLY. See file header.
 */
export function DemoRecentTrades({ markPrice }: DemoRecentTradesProps) {
  const trades = useMemo(() => generateDemoRecentTrades(markPrice), [markPrice])

  return (
    <div className="text-xs">
      <div className="flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20">
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-700/5 scrollbar-none" tabIndex={0} role="region" aria-label="Recent trades list">
        {trades.map((t, i) => (
          <div key={i} className="flex justify-between px-2 py-1">
            <span className={t.side === 'buy' ? 'text-green-400' : 'text-red-400'}>{formatPerpsPrice(t.price)}</span>
            <span className="text-gray-300">{t.size.toFixed(3)}</span>
            <span className="text-gray-500">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
