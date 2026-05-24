'use client'

/**
 * PriceDivergenceChip — small inline chip surfaced next to a price when
 * the winning source disagrees with the next-best source by more than
 * `DIVERGENCE_THRESHOLD` (0.5 %).
 *
 * Lane 4 / task 0044 — the chip lets a user spot "chain says $84,250 but
 * CoinGecko says $76,531" without leaving the row. Two callers wire it
 * up today:
 *
 *   - `<LivePriceCard>` (used by `/perps` top strip, landing strip, etc.)
 *   - `<TokenRow>` on `/explore` (BTC/WBTC + ETH/WETH canonical rows)
 *
 * The numeric `otherUsd` is rendered as a USD value with 2 fraction digits
 * for sub-thousand prices and zero for >= $1k (matching `LivePriceCard`'s
 * `formatPrice`). The chip lives in `title` so screen readers and hover
 * tooltips agree on the same number.
 */

interface PriceDivergenceChipProps {
  /** The rejected feed's USD value — the one the winning source disagreed with. */
  otherUsd: number
  /**
   * Optional symbol passed for accessibility — the chip reads "BTC drift"
   * to make the aria-label meaningful when multiple chips share a page.
   */
  symbol?: string
  /** Compact mode for inline use next to a table-cell price. Defaults to `false`. */
  compact?: boolean
  className?: string
}

function formatOther(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '$–'
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}

export function PriceDivergenceChip({
  otherUsd, symbol, compact = false, className = '',
}: PriceDivergenceChipProps) {
  const otherText = formatOther(otherUsd)
  const labelSym = symbol ? `${symbol} ` : ''
  return (
    <span
      data-testid="price-divergence-chip"
      title={`Other source: ${otherText}`}
      aria-label={`${labelSym}source disagreement: other feed reports ${otherText}`}
      className={
        `inline-flex items-center ${compact ? 'text-[10px]' : 'text-[11px]'} ` +
        `text-amber-400 shrink-0 ${className}`
      }
    >
      Source disagrees
    </span>
  )
}
