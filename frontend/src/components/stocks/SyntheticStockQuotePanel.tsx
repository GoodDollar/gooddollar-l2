'use client'

/**
 * SyntheticStockQuotePanel — task 0025.
 *
 * Replaces the fabricated bid/ask ladder that the generic `<OrderBook>`
 * used to render next to the Buy/Sell ticket on `/stocks/[ticker]`.
 * Synthetic stocks are oracle-priced AMM-style tokens with no CLOB, so
 * the old panel was pure invention; this component shows the honest
 * picture instead.
 *
 * Shape A — `markPrice > 0`: renders the oracle mark, a small slippage
 *   table at $100 / $1,000 / $10,000 (via the existing `calcPriceImpact`
 *   helper and a conservative liquidity heuristic), and the on-chain
 *   synthetic supply when available.
 *
 * Shape B — no oracle mark / unknown source: renders an explanatory
 *   empty-state card so the surface still answers "where do quotes come
 *   from?" without showing fabricated levels.
 *
 * Either shape carries a `<PriceSourceBadge>` so the attribution chain
 * stays consistent with the rest of the lane.
 */

import { calcPriceImpact } from '@/lib/ammPricing'
import { formatStockPrice } from '@/lib/stockData'
import type { PriceSource } from '@/lib/priceSource'
import { PriceSourceBadge } from '@/components/PriceSourceBadge'
import { useSyntheticTokenSupply } from '@/lib/useSyntheticTokenSupply'

interface Props {
  ticker: string
  markPrice: number
  source: PriceSource
}

const SLIPPAGE_ORDER_SIZES_USD = [100, 1_000, 10_000] as const

/**
 * Conservative liquidity floor used when the on-chain supply is unknown
 * or zero — keeps the $100 row near 0 % impact while still making the
 * $10k row visibly larger. Matches the AMM contract's intrinsic curve
 * within an order of magnitude until pool depth is exposed on-chain.
 */
const DEFAULT_LIQUIDITY_FLOOR_USD = 1_000_000

function poolLiquidityFor(supply: number | null, markPrice: number): number {
  if (supply != null && supply > 0 && markPrice > 0) {
    return Math.max(supply * markPrice * 4, DEFAULT_LIQUIDITY_FLOOR_USD)
  }
  return DEFAULT_LIQUIDITY_FLOOR_USD
}

function formatImpactPct(pct: number): string {
  if (pct <= 0) return '0.00%'
  if (pct < 0.0001) return '< 0.01%'
  return `${(pct * 100).toFixed(2)}%`
}

function formatSupply(supply: number, ticker: string): string {
  return `${Math.round(supply).toLocaleString()} s${ticker}`
}

export function SyntheticStockQuotePanel({ ticker, markPrice, source }: Props) {
  const { supply } = useSyntheticTokenSupply(ticker)
  const ammReady = markPrice > 0
  const poolLiquidity = poolLiquidityFor(supply, markPrice)
  const slippageRows = SLIPPAGE_ORDER_SIZES_USD.map((sizeUsd) => ({
    sizeUsd,
    impactPct: calcPriceImpact(sizeUsd, poolLiquidity),
  }))

  return (
    <section
      data-testid="synthetic-stock-quote-panel"
      className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Quote</h3>
        <PriceSourceBadge source={source} size="sm" />
      </div>

      {ammReady ? (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Oracle mark</span>
            <span className="text-white font-semibold">{formatStockPrice(markPrice)}</span>
          </div>
          <div className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-500">
              Estimated slippage (AMM)
            </div>
            <ul data-testid="synthetic-stock-slippage-rows" className="space-y-1">
              {slippageRows.map((row) => (
                <li key={row.sizeUsd} className="flex items-center justify-between">
                  <span className="text-gray-400">${row.sizeUsd.toLocaleString()}</span>
                  <span className="text-white font-medium">{formatImpactPct(row.impactPct)}</span>
                </li>
              ))}
            </ul>
          </div>
          {supply != null && supply > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Synthetic supply</span>
              <span className="text-white font-medium" data-testid="synthetic-stock-supply">
                {formatSupply(supply, ticker)}
              </span>
            </div>
          )}
          <p className="pt-1 text-[11px] text-gray-500 leading-snug">
            No central order book — synthetic <span className="font-medium">s{ticker}</span> is
            oracle-priced and settled against the AMM. The Buy / Sell ticket below shows the
            real fill estimate once you enter an amount.
          </p>
        </div>
      ) : (
        <div className="space-y-2 text-xs text-gray-400 leading-snug">
          <p>
            No central order book. Synthetic <span className="font-medium">s{ticker}</span> is
            an oracle-priced ERC-20 — quotes come from{' '}
            <span className="text-gray-300">StockOracleV2</span> and trades settle against the
            AMM rather than against bids and asks.
          </p>
          <p>The order ticket below will show an estimated fill price after you enter an amount.</p>
          <a
            href="/stocks#how"
            className="inline-flex items-center gap-1 text-goodgreen hover:text-goodgreen/80"
          >
            Learn how synthetic stocks settle <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </section>
  )
}
