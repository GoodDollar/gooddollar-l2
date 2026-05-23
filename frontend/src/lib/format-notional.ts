/**
 * USD notional formatter for hedge proof surfaces.
 *
 * - Conventional sign placement: `-50` → `-$50.00` (not `$-50.00`).
 * - Thousands separators: `12500` → `$12,500.00`.
 * - Defends against non-finite engine bugs: returns `—` for NaN / ±Infinity
 *   so the dashboard never reads `$NaN` to an operator.
 */

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatNotionalUsd(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return USD_FORMATTER.format(value)
}
