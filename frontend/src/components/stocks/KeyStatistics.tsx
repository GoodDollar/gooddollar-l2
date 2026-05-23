'use client'

/**
 * KeyStatistics — the overview-tab statistics grid for a single stock.
 *
 * This block sits next to the headline 24h-change and the Peer Compare /
 * Daily Movers panels. All four surfaces shared a flat-green "+0.00%"
 * bug when the oracle had no 24h-change or fundamentals data; the
 * `hasLiveOracle{Change,Fundamentals}` helpers from `@/lib/oracleHonesty`
 * are the single source of truth, applied uniformly here so the grid
 * renders `—` in gray instead of fabricating a green zero.
 */

import type { Stock } from '@/lib/stockData'
import { formatLargeNumber, formatStockPrice } from '@/lib/stockData'
import { hasLiveOracleChange, hasLiveOracleFundamentals } from '@/lib/oracleHonesty'

const MUTED = 'text-gray-500'
const MUTED_DASH = <span className={MUTED}>—</span>

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-gray-500 text-xs mb-0.5">{label}</div>
      <div className="text-white font-medium truncate">{children}</div>
    </div>
  )
}

export function KeyStatistics({ stock }: { stock: Stock }) {
  const liveChange = hasLiveOracleChange(stock)
  const liveFundamentals = hasLiveOracleFundamentals(stock)

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5">
      <h2 className="text-sm font-semibold text-white mb-3">Key Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
        <Tile label="Market Cap">
          {liveFundamentals ? formatLargeNumber(stock.marketCap) : MUTED_DASH}
        </Tile>
        <Tile label="24h Volume">
          {liveFundamentals ? formatLargeNumber(stock.volume24h) : MUTED_DASH}
        </Tile>
        <Tile label="Sector">{stock.sector}</Tile>
        <Tile label="52W High">{formatStockPrice(stock.high52w)}</Tile>
        <Tile label="52W Low">{formatStockPrice(stock.low52w)}</Tile>
        <div className="min-w-0">
          <div className="text-gray-500 text-xs mb-0.5">24h Change</div>
          {liveChange ? (
            <div
              data-testid="key-stats-change-24h"
              className={`font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
            </div>
          ) : (
            <div data-testid="key-stats-change-24h" className={`font-medium ${MUTED}`}>
              —
            </div>
          )}
        </div>
        <Tile label="P/E Ratio">
          {liveFundamentals && stock.peRatio > 0 ? `${stock.peRatio.toFixed(1)}x` : MUTED_DASH}
        </Tile>
        <div>
          <div className="text-gray-500 text-xs mb-0.5">EPS</div>
          {liveFundamentals && stock.eps !== 0 ? (
            <div className={`font-medium ${stock.eps > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stock.eps.toFixed(2)}
            </div>
          ) : (
            <div className={`font-medium ${MUTED}`}>—</div>
          )}
        </div>
        <Tile label="Dividend Yield">
          {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}
        </Tile>
        <Tile label="Avg Volume">
          {liveFundamentals ? formatLargeNumber(stock.avgVolume).replace('$', '') : MUTED_DASH}
        </Tile>
      </div>
    </div>
  )
}
