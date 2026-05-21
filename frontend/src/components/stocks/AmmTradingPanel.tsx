'use client'

import { useState, useMemo } from 'react'
import {
  type MarketHoursState,
  calcDynamicSpread,
  calcInventorySkew,
  calcPriceImpact,
  getOracleQuote,
} from '@/lib/ammPricing'

const STATE_BADGE: Record<MarketHoursState, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-green-600/20', text: 'text-green-400' },
  PRE_MARKET: { bg: 'bg-yellow-600/20', text: 'text-yellow-400' },
  AFTER_HOURS: { bg: 'bg-yellow-600/20', text: 'text-yellow-400' },
  CLOSED: { bg: 'bg-gray-600/20', text: 'text-gray-400' },
  HALTED: { bg: 'bg-red-600/20', text: 'text-red-400' },
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0]

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`
}

function SkewBar({ skew }: { skew: number }) {
  const pct = ((skew + 1) / 2) * 100
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
  poolLiquidity,
  marketState,
  ticker,
}: {
  oraclePrice: number
  inventoryLong: number
  inventoryShort: number
  poolLiquidity: number
  marketState: MarketHoursState
  ticker: string
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [orderSize, setOrderSize] = useState('')
  const [slippage, setSlippage] = useState(0.5)

  const skew = useMemo(
    () => calcInventorySkew(inventoryLong, inventoryShort),
    [inventoryLong, inventoryShort],
  )

  const quote = useMemo(() => getOracleQuote(oraclePrice, skew), [oraclePrice, skew])
  const spread = useMemo(() => calcDynamicSpread(skew), [skew])

  const orderSizeNum = parseFloat(orderSize) || 0
  const impact = useMemo(
    () => calcPriceImpact(orderSizeNum, poolLiquidity),
    [orderSizeNum, poolLiquidity],
  )

  const tradingDisabled = marketState === 'CLOSED' || marketState === 'HALTED'
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

      {/* Oracle Price */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Oracle Mid</span>
        <span className="text-sm font-mono text-white">{formatPrice(quote.mid)}</span>
      </div>

      {/* Bid / Ask */}
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

      {/* Spread */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Spread</span>
        <span className="text-xs font-mono text-gray-300">{formatPct(spread)}</span>
      </div>

      {/* Skew bar */}
      <div className="mb-3">
        <SkewBar skew={skew} />
      </div>

      {/* Buy / Sell toggle */}
      <div className="flex gap-1 rounded-xl bg-white/5 p-1 mb-3">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            side === 'buy' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            side === 'sell' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order size input */}
      <div className="mb-2">
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Order size (USD)"
          value={orderSize}
          onChange={(e) => setOrderSize(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none"
        />
        {orderSize !== '' && orderSizeNum <= 0 && (
          <p className="text-red-400/80 text-xs mt-1">Enter a positive order amount</p>
        )}
      </div>

      {/* Price impact */}
      {orderSizeNum > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Price Impact</span>
          <span className={`text-xs font-mono ${impact > 0.01 ? 'text-amber-400' : 'text-gray-300'}`}>
            {formatPct(impact)}
          </span>
        </div>
      )}

      {/* Slippage tolerance */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">Slippage</span>
        <div className="flex gap-1">
          {SLIPPAGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSlippage(opt)}
              className={`rounded-lg px-2 py-0.5 text-xs transition-colors ${
                slippage === opt
                  ? 'bg-cyan-600/30 text-cyan-400'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {opt}%
            </button>
          ))}
        </div>
      </div>

      {/* Trade button */}
      <button
        type="button"
        disabled={tradingDisabled || orderSizeNum <= 0}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
          tradingDisabled || orderSizeNum <= 0
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : side === 'buy'
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {tradingDisabled ? `Market ${marketState}` : side === 'buy' ? 'Buy' : 'Sell'}
      </button>
    </div>
  )
}
