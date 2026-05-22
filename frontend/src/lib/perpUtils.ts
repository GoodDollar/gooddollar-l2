export function calculateLiqPrice(
  entryPrice: number,
  leverage: number,
  side: 'long' | 'short'
): number {
  if (leverage <= 0 || entryPrice <= 0) return 0
  const maintenanceMarginFactor = 0.9
  return side === 'long'
    ? entryPrice * (1 - maintenanceMarginFactor / leverage)
    : entryPrice * (1 + maintenanceMarginFactor / leverage)
}

export function calculatePnL(
  entryPrice: number,
  markPrice: number,
  size: number,
  side: 'long' | 'short'
): number {
  if (entryPrice <= 0) return 0
  return side === 'long'
    ? (markPrice - entryPrice) * size
    : (entryPrice - markPrice) * size
}

export function calculatePnLPercent(
  entryPrice: number,
  markPrice: number,
  leverage: number,
  side: 'long' | 'short'
): number {
  if (entryPrice <= 0) return 0
  const priceChangePercent =
    side === 'long'
      ? ((markPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - markPrice) / entryPrice) * 100
  return priceChangePercent * leverage
}

export type LiqProximity = 'safe' | 'warning' | 'danger' | 'critical'

export function getLiqProximity(
  markPrice: number,
  liqPrice: number,
  side: 'long' | 'short'
): LiqProximity {
  if (markPrice <= 0 || liqPrice <= 0) return 'safe'
  const distance =
    side === 'long'
      ? (markPrice - liqPrice) / markPrice
      : (liqPrice - markPrice) / markPrice

  if (distance <= 0.1) return 'critical'
  if (distance <= 0.15) return 'danger'
  if (distance <= 0.25) return 'warning'
  return 'safe'
}
