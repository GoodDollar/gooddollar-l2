export type MarketHoursState = 'OPEN' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED' | 'HALTED'

const BASE_SPREAD_BPS = 30
const MAX_SKEW_SPREAD_BPS = 200
const MAX_PRICE_IMPACT = 0.05

export function calcInventorySkew(longSize: number, shortSize: number): number {
  const total = longSize + shortSize
  if (total === 0) return 0
  return Math.max(-1, Math.min(1, (longSize - shortSize) / total))
}

export function calcDynamicSpread(skew: number): number {
  const baseFrac = BASE_SPREAD_BPS / 10_000
  const skewFrac = (MAX_SKEW_SPREAD_BPS / 10_000) * Math.abs(skew)
  return baseFrac + skewFrac
}

export interface OracleQuote {
  mid: number
  bid: number
  ask: number
  spread: number
}

export function getOracleQuote(oraclePrice: number, skew: number): OracleQuote {
  const halfSpread = calcDynamicSpread(skew) / 2
  const skewShift = skew * halfSpread * 0.5
  return {
    mid: oraclePrice,
    bid: oraclePrice * (1 - halfSpread - skewShift),
    ask: oraclePrice * (1 + halfSpread + skewShift),
    spread: calcDynamicSpread(skew),
  }
}

export function calcPriceImpact(orderSizeUsd: number, poolLiquidity: number): number {
  if (orderSizeUsd === 0) return 0
  const raw = (orderSizeUsd / poolLiquidity) * 0.1
  return Math.min(raw, MAX_PRICE_IMPACT)
}

/**
 * US equity market hours (Eastern Time):
 * - PRE_MARKET: 4:00 - 9:30 ET (08:00 - 13:30 UTC)
 * - OPEN: 9:30 - 16:00 ET (13:30 - 20:00 UTC)
 * - AFTER_HOURS: 16:00 - 20:00 ET (20:00 - 00:00 UTC)
 * - CLOSED: weekends + outside extended hours
 */
export function getMarketHoursState(now: Date): MarketHoursState {
  const day = now.getUTCDay()
  if (day === 0 || day === 6) return 'CLOSED'

  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const preMarketOpen = 8 * 60   // 04:00 ET = 08:00 UTC
  const marketOpen = 13 * 60 + 30 // 09:30 ET = 13:30 UTC
  const marketClose = 20 * 60     // 16:00 ET = 20:00 UTC
  const afterHoursClose = 24 * 60 // 20:00 ET = 00:00 UTC next day

  if (utcMinutes >= marketOpen && utcMinutes < marketClose) return 'OPEN'
  if (utcMinutes >= preMarketOpen && utcMinutes < marketOpen) return 'PRE_MARKET'
  if (utcMinutes >= marketClose && utcMinutes < afterHoursClose) return 'AFTER_HOURS'
  return 'CLOSED'
}
