'use client'

/**
 * RecentTrades — pure presentation component for the stock detail page's
 * "Trades" tab. Consumes a `TradeRecord[]` (the canonical on-chain trade
 * shape returned by `useStockTrades`) and renders either:
 *
 *   1. The real trade list, sorted DESC by `timestamp` (no inverted rows).
 *   2. An honest "No recent trades" empty state when no trades exist.
 *   3. A clearly-labelled `?demoTrades=1` legacy preview that uses the
 *      pre-on-chain RNG generator — gated behind a query param so it
 *      cannot leak into a default user render.
 *
 * The component never calls `Math.random` in the default path. Demo path
 * data is generated lazily inside `DemoRecentTrades` only when the flag
 * is on, so the default bundle's behavior is byte-for-byte free of RNG.
 */

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatPerpsPrice } from '@/lib/perpsData'
import type { TradeRecord } from '@/lib/stockData'
import { isCryptoRailSymbol } from '@/lib/oracleSource'

interface RecentTradesProps {
  trades: TradeRecord[]
  symbol?: string
  /**
   * Optional mark price used only by the `?demoTrades=1` legacy preview.
   * Default render path ignores this entirely.
   */
  markPrice?: number
}

const HEADER_CLASS = 'flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20'
const REGION_CLASS = 'max-h-[300px] overflow-y-auto divide-y divide-gray-700/5 scrollbar-none'
const EMPTY_REGION_CLASS = 'max-h-[300px] overflow-y-auto px-3 py-6 text-center scrollbar-none'

function emptyStateCopy(symbol: string | undefined): { title: string; subtitle: string } {
  if (symbol && isCryptoRailSymbol(symbol)) {
    return {
      title: 'No recent trades',
      subtitle: 'Crypto trade history is coming soon — none of this is fabricated.',
    }
  }
  return {
    title: 'No recent trades',
    subtitle: 'Trades will appear here once buy/sell activity hits the CollateralVault contract.',
  }
}

function formatTimeOfDay(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function RecentTrades({ trades, symbol, markPrice }: RecentTradesProps) {
  const params = useSearchParams()
  const demoOn = params?.get('demoTrades') === '1'

  // Sort DESC by timestamp, deterministic tiebreaker on id so equal
  // timestamps never produce render churn.
  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp
      return a.id < b.id ? 1 : -1
    })
  }, [trades])

  if (demoOn && typeof markPrice === 'number') {
    return <DemoRecentTrades markPrice={markPrice} />
  }

  if (sorted.length === 0) {
    const { title, subtitle } = emptyStateCopy(symbol)
    return (
      <div className="text-xs">
        <div className={HEADER_CLASS}>
          <span>Price</span>
          <span>Size</span>
          <span>Time</span>
        </div>
        <div
          className={EMPTY_REGION_CLASS}
          tabIndex={0}
          role="region"
          aria-label="Recent trades list"
        >
          <div className="text-sm font-medium text-gray-400">{title}</div>
          <div className="mt-1 text-xs text-gray-500 leading-relaxed">{subtitle}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-xs">
      <div className={HEADER_CLASS}>
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div className={REGION_CLASS} tabIndex={0} role="region" aria-label="Recent trades list">
        {sorted.map((t) => (
          <div key={t.id} className="flex justify-between px-2 py-1">
            <span className={t.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
              {formatPerpsPrice(t.price)}
            </span>
            <span className="text-gray-300">{t.shares.toFixed(3)}</span>
            <span className="text-gray-500">{formatTimeOfDay(t.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Legacy RNG-driven preview kept behind `?demoTrades=1` for design-system /
 * docs screenshots. Always banner-labelled so it can't be mistaken for
 * real trade data. Only mounted when the query flag is on; the default
 * render path has no reference to `Math.random` at all.
 */
function DemoRecentTrades({ markPrice }: { markPrice: number }) {
  const trades = useMemo(() => generateDemoTrades(markPrice), [markPrice])
  return (
    <div className="text-xs">
      <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/30 text-[10px] text-amber-200">
        Demo data — not on-chain
      </div>
      <div className={HEADER_CLASS}>
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <div className={REGION_CLASS} tabIndex={0} role="region" aria-label="Recent trades list">
        {trades.map((t) => (
          <div key={t.id} className="flex justify-between px-2 py-1">
            <span className={t.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
              {formatPerpsPrice(t.price)}
            </span>
            <span className="text-gray-300">{t.size.toFixed(3)}</span>
            <span className="text-gray-500">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DemoTrade {
  id: string
  price: number
  size: number
  side: 'buy' | 'sell'
  time: string
}

function generateDemoTrades(midPrice: number, count: number = 20): DemoTrade[] {
  const trades: DemoTrade[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.5) * midPrice * 0.002
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell'
    const timeOffsetMs = i * (2000 + Math.random() * 8000)
    const time = new Date(now.getTime() - timeOffsetMs)
    trades.push({
      id: `demo-${i}-${time.getTime()}`,
      price: midPrice + drift,
      size: parseFloat((0.01 + Math.random() * 3).toFixed(3)),
      side,
      time: time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    })
  }
  return trades
}
