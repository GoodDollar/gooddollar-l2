/**
 * priceSource — shared discriminated union for the provenance of every
 * price rendered anywhere in the app.
 *
 * Lane 4 (`0007d-app-integration`) requires every visible price to carry
 * a single, honest attribution. This module is the canonical helper:
 *
 *   resolvePriceSource({ chainOk, statusQuote, coinGeckoLive, hasFallback })
 *
 * Returns one of:
 *   - `chain-oracle`  — on-chain `*PriceOracle` answered with a sane value
 *   - `etoro-demo`    — price-service marks the symbol as eToro-fed
 *   - `coingecko`     — CoinGecko proxy returned a live value
 *   - `fallback`      — only the static seed is available (cached, fabricated)
 *   - `stale`         — last known value is past `STALE_THRESHOLD_MS`
 *   - `closed`        — sessionState is `closed` or `halted`
 *   - `unknown`       — no signal whatsoever
 *
 * The function is pure. No React, no fetch.
 */

export type PriceSource =
  | 'chain-oracle'
  | 'etoro-demo'
  | 'coingecko'
  | 'fallback'
  | 'stale'
  | 'closed'
  | 'unknown'

export const STALE_THRESHOLD_MS = 60_000
export const WARN_THRESHOLD_MS = 15_000

export interface ResolverStatusQuote {
  /** Age in ms of the quote (mirrors `usePriceServiceStatus.QuoteStatus.lastUpdateMs`). */
  lastUpdateMs: number
  /** `open` | `pre-market` | `after-hours` | `closed` | `halted` | string. */
  sessionState: string
  /**
   * Optional provenance tag from price-service (`'etoro'` when the symbol
   * is fed by the eToro demo upstream). When undefined we treat the quote
   * as "unknown source" and fall through to coingecko/fallback below.
   */
  source?: string
}

export interface ResolverInput {
  /** True when the on-chain `PriceOracle.getAssetPrice` (or equivalent) returned > 0. */
  chainOk: boolean
  /** True when the CoinGecko proxy returned a live price for the symbol. */
  coinGeckoLive?: boolean
  /** Whether a static FALLBACK value is available as a last-resort. */
  hasFallback?: boolean
  /** Price-service status entry for the same symbol, if available. */
  statusQuote?: ResolverStatusQuote
}

/**
 * Pure resolver. Order of precedence:
 *   1. chain-oracle (chain wins always — it's the on-chain truth users
 *      eventually trade against)
 *   2. closed / halted session state (no trading possible, surface
 *      market closure even if a stale price exists)
 *   3. stale (last update too old)
 *   4. etoro-demo (status quote with source=etoro, fresh)
 *   5. coingecko (only CG had a value)
 *   6. fallback (only the static seed remains)
 *   7. unknown
 */
export function resolvePriceSource(input: ResolverInput): PriceSource {
  const { chainOk, coinGeckoLive = false, hasFallback = false, statusQuote } = input

  if (chainOk) return 'chain-oracle'

  if (statusQuote) {
    const session = statusQuote.sessionState
    if (session === 'closed' || session === 'halted') return 'closed'
    if (statusQuote.lastUpdateMs > STALE_THRESHOLD_MS) return 'stale'
    if (statusQuote.source === 'etoro') return 'etoro-demo'
  }

  if (coinGeckoLive) return 'coingecko'
  if (hasFallback) return 'fallback'
  return 'unknown'
}

/** Human label used by the badge component (and a couple of tests). */
export function priceSourceLabel(source: PriceSource): string {
  switch (source) {
    case 'chain-oracle': return 'Chain oracle'
    case 'etoro-demo':   return 'eToro demo'
    case 'coingecko':    return 'Cached (CoinGecko)'
    case 'fallback':     return 'Fallback price'
    case 'stale':        return 'Stale'
    case 'closed':       return 'Market closed'
    // "Feed pending" matches the empty-state vocabulary established by
    // tasks 0028/0029/0030 (`Source: feed pending` captions on Top
    // Movers / Analyst Outlook / News & Events). Task 0036.
    case 'unknown':      return 'Feed pending'
  }
}
