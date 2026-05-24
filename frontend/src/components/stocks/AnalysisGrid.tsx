'use client'

/**
 * AnalysisGrid — the 4-tile valuation/profitability/income/liquidity strip
 * inside the Overview-tab "Analysis" section on the stock detail page.
 *
 * Every tile routes through `hasLiveOracleFundamentals(stock)` and a
 * per-field `> 0` / `!== 0` defensive check, matching the conventions
 * already enforced in `KeyStatistics.tsx`. Without this gating, the four
 * tiles paint `P/E 0.0x`, a bright-green `EPS $0.00`, a friendly
 * `No dividend`, and `0 avg vol` as if they were real fundamentals when
 * the oracle is degraded — the same honesty failure tasks 0025/0026/
 * 0028/0035/0038 deleted from neighboring surfaces.
 */

import type { Stock } from '@/lib/stockData'
import { formatLargeNumber } from '@/lib/stockData'
import { hasLiveOracleFundamentals } from '@/lib/oracleHonesty'

const MUTED = 'text-gray-500'
const TILE = 'rounded-xl border border-gray-700/30 bg-dark-50/30 p-3'
const LABEL = 'text-[10px] uppercase tracking-wide text-gray-500'
const VALUE = 'mt-1 text-sm font-medium'

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={TILE}>
      <div className={LABEL}>{label}</div>
      <div className={VALUE}>{children}</div>
    </div>
  )
}

export function AnalysisGrid({ stock }: { stock: Stock }) {
  const live = hasLiveOracleFundamentals(stock)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="analysis-grid">
      <Tile label="Valuation">
        {live && stock.peRatio > 0 ? (
          <span className="text-white">P/E {stock.peRatio.toFixed(1)}x</span>
        ) : (
          <span className={MUTED}>P/E —</span>
        )}
      </Tile>
      <Tile label="Profitability">
        {live && stock.eps !== 0 ? (
          <span className={stock.eps > 0 ? 'text-green-400' : 'text-red-400'}>
            EPS ${stock.eps.toFixed(2)}
          </span>
        ) : (
          <span className={MUTED}>EPS —</span>
        )}
      </Tile>
      <Tile label="Income">
        {live ? (
          stock.dividendYield > 0 ? (
            <span className="text-white">{stock.dividendYield.toFixed(2)}% yield</span>
          ) : (
            <span className={MUTED}>No dividend</span>
          )
        ) : (
          <span className={MUTED}>Yield —</span>
        )}
      </Tile>
      <Tile label="Liquidity">
        {live ? (
          <span className="text-white">{formatLargeNumber(stock.avgVolume).replace('$', '')} avg vol</span>
        ) : (
          <span className={MUTED}>Avg vol —</span>
        )}
      </Tile>
    </div>
  )
}
