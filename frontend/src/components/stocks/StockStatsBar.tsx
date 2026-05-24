'use client'

import type { Stock } from '@/lib/stockData'
import { formatStockPrice } from '@/lib/stockData'
import { isNoData, usdOrDash, NO_DATA_DASH } from '@/lib/formatNoData'

/**
 * 24h high / low derived from the spot + change. When the chain path
 * has no change print, both sides collapse to the spot — but the
 * rendered tile then em-dashes the value via `isNoData(change24h)`.
 */
function derive24hRange(price: number, change24h: number) {
  if (change24h === 0) return { high: price, low: price }
  const baseline = price / (1 + change24h / 100)
  return {
    high: Math.max(price, baseline),
    low: Math.min(price, baseline),
  }
}

/**
 * `isLive` defaults to `true` for backward compatibility. Callers
 * should pass `useOnChainStocks().isLive` explicitly; when the gate is
 * false the 24h%, 24h H, 24h L and Vol cells collapse to em-dashes so
 * the strip never reprints `FALLBACK_STOCKS` literals as live market
 * data (task 0038). The Mark cell keeps rendering — it's the
 * well-attributed value that already carries its own source pill.
 */
export function StockStatsBar({ stock, isLive = true }: { stock: Stock; isLive?: boolean }) {
  const { high, low } = derive24hRange(stock.price, stock.change24h)
  const derivedMissing = !isLive || isNoData(stock.change24h)
  const volMissing = !isLive || isNoData(stock.volume24h)

  const tileCls = 'flex flex-col sm:flex-row sm:items-baseline'
  const labelCls =
    'text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs sm:normal-case sm:tracking-normal'
  const dashCls = 'text-gray-500 font-medium sm:ml-1.5'

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
        {derivedMissing ? (
          <span className={dashCls}>{NO_DATA_DASH}</span>
        ) : (
          <span
            className={`font-medium sm:ml-1.5 ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {stock.change24h >= 0 ? '▲ +' : '▼ '}
            {stock.change24h.toFixed(2)}%
          </span>
        )}
      </div>
      <div className={tileCls}>
        <span className={labelCls}>24h H</span>
        {derivedMissing ? (
          <span className={dashCls}>{NO_DATA_DASH}</span>
        ) : (
          <span className="text-green-400 font-medium sm:ml-1.5">
            {formatStockPrice(high)}
          </span>
        )}
      </div>
      <div className={tileCls}>
        <span className={labelCls}>24h L</span>
        {derivedMissing ? (
          <span className={dashCls}>{NO_DATA_DASH}</span>
        ) : (
          <span className="text-red-400 font-medium sm:ml-1.5">
            {formatStockPrice(low)}
          </span>
        )}
      </div>
      <div className={tileCls}>
        <span className={labelCls}>Vol</span>
        <span className={volMissing ? dashCls : 'text-white font-medium sm:ml-1.5'}>
          {volMissing ? NO_DATA_DASH : usdOrDash(stock.volume24h)}
        </span>
      </div>
    </div>
  )
}
