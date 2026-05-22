'use client'

import { useMemo } from 'react'
import {
  type MarketHoursState,
  calcDynamicSpread,
  calcInventorySkew,
  getOracleQuote,
} from '@/lib/ammPricing'

const STATE_BADGE: Record<MarketHoursState, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-green-600/20', text: 'text-green-400' },
  PRE_MARKET: { bg: 'bg-yellow-600/20', text: 'text-yellow-400' },
  AFTER_HOURS: { bg: 'bg-yellow-600/20', text: 'text-yellow-400' },
  CLOSED: { bg: 'bg-gray-600/20', text: 'text-gray-400' },
  HALTED: { bg: 'bg-red-600/20', text: 'text-red-400' },
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`
}

function SkewBar({ skew }: { skew: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 whitespace-nowrap">Inventory Skew</span>
      <div className="relative h-2 flex-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="absolute top-0 left-1/2 h-full bg-cyan-500/60 transition-all"
          style={{
            width: `${Math.abs(skew) * 50}%`,
            transform: skew >= 0 ? 'none' : 'translateX(-100%)',
          }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
      </div>
      <span className="text-xs text-gray-400 w-12 text-right">
        {skew > 0 ? 'Long' : skew < 0 ? 'Short' : 'Balanced'}
      </span>
    </div>
  )
}

export function AmmTradingPanel({
  oraclePrice,
  inventoryLong,
  inventoryShort,
  marketState,
  ticker,
}: {
  oraclePrice: number
  inventoryLong: number
  inventoryShort: number
  marketState: MarketHoursState
  ticker: string
}) {
  const skew = useMemo(
    () => calcInventorySkew(inventoryLong, inventoryShort),
    [inventoryLong, inventoryShort],
  )

  const quote = useMemo(() => getOracleQuote(oraclePrice, skew), [oraclePrice, skew])
  const spread = useMemo(() => calcDynamicSpread(skew), [skew])

  const badge = STATE_BADGE[marketState]

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">
          g{ticker} AMM
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
          {marketState}
        </span>
      </div>

      {marketState === 'HALTED' && (
        <div className="mb-3 rounded-xl bg-red-950/30 border border-red-600/30 p-3 text-sm text-red-300">
          Trading is paused — market is halted.
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Oracle Mid</span>
        <span className="text-sm font-mono text-white">{formatPrice(quote.mid)}</span>
      </div>

      <div className="flex gap-4 mb-2">
        <div className="flex-1 rounded-xl bg-green-950/20 border border-green-600/10 p-2 text-center">
          <div className="text-xs text-gray-400">Bid</div>
          <div className="text-sm font-mono text-green-400">{formatPrice(quote.bid)}</div>
        </div>
        <div className="flex-1 rounded-xl bg-red-950/20 border border-red-600/10 p-2 text-center">
          <div className="text-xs text-gray-400">Ask</div>
          <div className="text-sm font-mono text-red-400">{formatPrice(quote.ask)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Spread</span>
        <span className="text-xs font-mono text-gray-300">{formatPct(spread)}</span>
      </div>

      <div>
        <SkewBar skew={skew} />
      </div>
    </div>
  )
}
