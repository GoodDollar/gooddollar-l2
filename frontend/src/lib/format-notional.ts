/**
 * Format notional USD amounts for display.
 *
 * Dashboard money values should be exact cents with thousands separators; no
 * compact K/M suffixes, because receipts/proof audits need unambiguous values.
 */
export function formatNotionalUsd(amount: number): string {
  if (!Number.isFinite(amount)) return '—'

  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)

  return `${sign}$${formatted}`
}
