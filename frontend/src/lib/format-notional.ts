/**
 * Format notional USD amounts for display
 */
export function formatNotionalUsd(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  
  const abs = Math.abs(amount)
  
  // Format large amounts with K/M suffixes
  if (abs >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  } else if (abs >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  } else if (abs >= 1) {
    return `$${amount.toFixed(0)}`
  } else if (abs > 0) {
    return `$${amount.toFixed(2)}`
  } else {
    return '$0'
  }
}