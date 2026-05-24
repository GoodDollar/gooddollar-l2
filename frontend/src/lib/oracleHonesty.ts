/**
 * oracleHonesty — single source of truth for the "is this datum a real
 * oracle value or a missing-value sentinel?" rule.
 *
 * The standing degraded state for this lane is `service.status:
 * "unknown"`, `rails.{stocks,crypto}.enabled: false`, and quotes carrying
 * zero `change24h` / `volume24h` / `marketCap`. Without these guards the
 * UI renders four-tile walls of "+0.00%" in green that look real and are
 * not; using these helpers, the same surfaces render `—` in gray.
 *
 * `hasLiveOracleChange` is the gate for any 24h-change render.
 * `hasLiveOracleFundamentals` is the gate for any market-cap / volume /
 * P-E / EPS render. Both intentionally accept a structurally-typed
 * subset of `Stock` so the helpers can be applied uniformly to peer
 * compare rows, daily-mover rows, and the headline datum.
 */

export interface OracleChangeShape {
  change24h: number
  volume24h: number
  marketCap: number
}

export interface OracleFundamentalsShape {
  eps?: number
  peRatio?: number
  marketCap: number
  volume24h: number
}

export function hasLiveOracleChange(stock: OracleChangeShape): boolean {
  if (stock.volume24h > 0) return true
  if (stock.marketCap > 0) return true
  if (stock.change24h !== 0) return true
  return false
}

export function hasLiveOracleFundamentals(stock: OracleFundamentalsShape): boolean {
  if (stock.marketCap > 0) return true
  if (stock.volume24h > 0) return true
  if (typeof stock.eps === 'number' && stock.eps !== 0) return true
  if (typeof stock.peRatio === 'number' && stock.peRatio > 0) return true
  return false
}
