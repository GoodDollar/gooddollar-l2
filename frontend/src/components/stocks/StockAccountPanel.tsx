'use client'

import { useAccount } from 'wagmi'
import { useStockHoldings } from '@/lib/useStockHoldings'
import { formatStockPrice } from '@/lib/stockData'

function HealthBar({ ratio }: { ratio: number }) {
  const clamped = Math.min(Math.max(ratio, 0), 300)
  const pct = Math.min((clamped / 300) * 100, 100)
  const color =
    ratio >= 200 ? 'bg-green-400' : ratio >= 150 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="h-1.5 w-full rounded-full bg-dark-50/50 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function StockAccountPanel() {
  const { address } = useAccount()
  const holdings = useStockHoldings(address)

  if (!address || holdings.isLoading || !holdings.isLive) return null

  const buyingPower = Math.max(holdings.totalCollateral - holdings.totalRequired, 0)

  return (
    <div
      data-testid="stock-account-panel"
      className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-5"
    >
      <h3 className="text-sm font-semibold text-white mb-3">Account Summary</h3>
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-400">Total Value</span>
          <span className="text-white font-medium tabular-nums">
            {formatStockPrice(holdings.totalValue)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-400">Unrealized P&L</span>
          <span
            className={`font-medium tabular-nums ${
              holdings.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {holdings.unrealizedPnl >= 0 ? '+' : '-'}
            {formatStockPrice(Math.abs(holdings.unrealizedPnl))}{' '}
            <span className="text-[10px] opacity-70">
              ({holdings.pnlPercent >= 0 ? '+' : ''}
              {holdings.pnlPercent.toFixed(2)}%)
            </span>
          </span>
        </div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-400">Collateral</span>
          <span className="text-white font-medium tabular-nums">
            {formatStockPrice(holdings.totalCollateral)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-gray-400">Buying Power</span>
          <span className="text-goodgreen font-medium tabular-nums">
            {formatStockPrice(buyingPower)}
          </span>
        </div>
        <div className="pt-1.5">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-gray-500">Collateral Health</span>
            <span
              className={`font-medium ${
                holdings.healthRatio >= 200
                  ? 'text-green-400'
                  : holdings.healthRatio >= 150
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {holdings.healthRatio.toFixed(0)}%
            </span>
          </div>
          <HealthBar ratio={holdings.healthRatio} />
        </div>
      </div>
    </div>
  )
}
