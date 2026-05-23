/**
 * formatNoData — tiny formatting helpers that render a Unicode em-dash
 * ("—") whenever the underlying number is missing, non-finite, or a
 * suspicious zero used as a "no data" sentinel.
 *
 * Why exist: several stocks-related blocks (Top Movers, Drift & Rebalance,
 * Browse table 24h Change / Volume / Market Cap, per-ticker Key Statistics)
 * currently render literal `0` / `+0.00%` / `$0` for symbols whose
 * upstream feed has no value. That makes "we don't know" indistinguishable
 * from a real zero. These helpers gate every such cell on a single,
 * auditable rule:
 *
 *   isNoData(v) === true  →  render "—"
 *
 * Callers that have a genuine known-live zero can bypass by formatting
 * the value directly; the helpers are only for the "could be zero, could
 * be missing, we can't tell" case.
 */

const DASH = '—'

/**
 * Decide whether `v` should be rendered as "no data".
 *
 * Treated as "no data":
 *   - `null` / `undefined`
 *   - `NaN`, `Infinity`, `-Infinity`
 *   - exact `0` (suspect — real intra-day stock changes are rarely
 *     exactly 0 to 4 decimal places, and the seed dataset uses 0 as a
 *     sentinel for "no oracle update")
 */
export function isNoData(v: unknown): boolean {
  if (v == null) return true
  if (typeof v !== 'number') return true
  if (!Number.isFinite(v)) return true
  return v === 0
}

/** Percent: `+1.23%` / `-4.50%` / `—`. */
export function pctOrDash(value: number | null | undefined, decimals = 2): string {
  if (isNoData(value)) return DASH
  const n = value as number
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(decimals)}%`
}

/** USD: `$1,234.56` / `$12.5M` (delegated to compactUsd) / `—`. */
export function usdOrDash(value: number | null | undefined): string {
  if (isNoData(value)) return DASH
  return formatCompactUsd(value as number)
}

/** Integer: `1,234` / `—`. Used for volumes, share counts. */
export function intOrDash(value: number | null | undefined): string {
  if (isNoData(value)) return DASH
  return Math.round(value as number).toLocaleString()
}

/**
 * Compact USD formatting. Used by `usdOrDash` and exported for sites that
 * want the format without the no-data gate.
 *
 *   1_500_000_000  → "$1.50B"
 *   2_500_000      → "$2.50M"
 *   3_500         → "$3,500.00"
 */
export function formatCompactUsd(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000)     return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000)         return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toFixed(2)}`
}

export const NO_DATA_DASH = DASH
