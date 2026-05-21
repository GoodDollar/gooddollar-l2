'use client'

import type { Stock } from '@/lib/stockData'
import { formatStockPrice, formatLargeNumber } from '@/lib/stockData'

function derive24hRange(price: number, change24h: number) {
  if (change24h === 0) return { high: price, low: price }
  const baseline = price / (1 + change24h / 100)
  return {
    high: Math.max(price, baseline),
    low: Math.min(price, baseline),
  }
}

export function StockStatsBar({ stock }: { stock: Stock }) {
  const { high, low } = derive24hRange(stock.price, stock.change24h)

  const tileCls = 'flex flex-col sm:flex-row sm:items-baseline'
  const labelCls =
    'text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs sm:normal-case sm:tracking-normal'

  return (
    <div
      data-testid="stock-stats-bar"
      className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-0 text-xs py-2 mb-3"
    >
      <div className={tileCls}>
        <span className={labelCls}>Mark</span>
        <span className="text-white font-medium sm:ml-1.5">
          {formatStockPrice(stock.price)}
        </span>
      </div>
      <div className={tileCls}>
        <span className={labelCls}>24h</span>
        <span
          className={`font-medium sm:ml-1.5 ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
        >
          {stock.change24h >= 0 ? '▲ +' : '▼ '}
          {stock.change24h.toFixed(2)}%
        </span>
      </div>
      <div className={tileCls}>
        <span className={labelCls}>24h H</span>
        <span className="text-green-400 font-medium sm:ml-1.5">
          {formatStockPrice(high)}
        </span>
      </div>
      <div className={tileCls}>
        <span className={labelCls}>24h L</span>
        <span className="text-red-400 font-medium sm:ml-1.5">
          {formatStockPrice(low)}
        </span>
      </div>
      <div className={tileCls}>
        <span className={labelCls}>Vol</span>
        <span className="text-white font-medium sm:ml-1.5">
          {formatLargeNumber(stock.volume24h)}
        </span>
      </div>
      <div className={tileCls}>
        <span className={labelCls}>Funding</span>
        <span className="text-gray-400 font-medium sm:ml-1.5">—</span>
      </div>
      <div className={tileCls}>
        <span className={labelCls}>OI</span>
        <span className="text-gray-400 font-medium sm:ml-1.5">—</span>
      </div>
    </div>
  )
}
