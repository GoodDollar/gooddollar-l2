/**
 * marketData.ts — Types and formatting utilities for token market data (Explore page).
 *
 * MOCK DATA REMOVED — all data now comes from:
 *   - useOnChainMarketData() for live token prices (via CoinGecko + on-chain)
 *   - usePriceFeeds() for raw price data
 *
 * This file retains types and formatting functions used by components.
 */

import { TOKENS, TOKEN_COLORS, type Token } from './tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Token market data.
 *
 * Fields that can be `null` ({@link change1h}, {@link change24h},
 * {@link change7d}, {@link volume24h}, {@link sparkline7d}) use `null` as a
 * sentinel meaning "the data source did not return this value" — distinct from
 * a literal `0` or a flat zero array. Consumers MUST render these as a neutral
 * placeholder (e.g. `—`) instead of `0.00%` / `$0` / a flat sparkline, to avoid
 * misleading users about token activity.
 */
export interface TokenMarketData extends Token {
  price: number
  change1h: number | null
  change24h: number | null
  change7d: number | null
  volume24h: number | null
  marketCap: number
  sparkline7d: number[] | null
  description: string
  circulatingSupply?: number
  maxSupply?: number | null
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Placeholder string rendered when a numeric market field is unavailable
 * (i.e. the upstream data source returned no value). Kept as a single
 * constant so the UI stays consistent across pages.
 */
export const MARKET_DATA_PLACEHOLDER = '—'

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (price >= 1) return `$${price.toFixed(2)}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  return `$${price.toFixed(6)}`
}

/**
 * Format a USD volume. Returns the {@link MARKET_DATA_PLACEHOLDER} for
 * `null`/`undefined`, so callers can pass through unknown values without
 * branching at every call site.
 */
export function formatVolume(vol: number | null | undefined): string {
  if (vol === null || vol === undefined) return MARKET_DATA_PLACEHOLDER
  if (vol >= 1e12) return `$${(vol / 1e12).toFixed(2)}T`
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export function formatMarketCap(cap: number | null | undefined): string {
  return formatVolume(cap)
}

export { TOKEN_COLORS }

// ─── Top Gainers selection (task 0052) ───────────────────────────────────────

/**
 * Smallest `change24h` value that still renders as a non-zero percent under
 * `change24h.toFixed(1)` (which is how the Explore Top Gainers card formats
 * the badge). Anything below this rounds to `0.0%` — and a "▲0.0% gainer" is
 * incoherent UX, so we filter those tokens out at the selection step.
 *
 * Keep this constant in lock-step with the display rounding in
 * `frontend/src/app/(app)/explore/page.tsx`. If the card switches to a
 * different decimal count, this floor must move with it.
 */
export const MIN_VISIBLE_GAINER_PCT = 0.05

/**
 * Pick the top `n` tokens by 24h change for the Explore "Top Gainers" card.
 *
 * Selection rules (see task 0052):
 *  - `change24h === null` → excluded (unknown is not a gainer).
 *  - `change24h < MIN_VISIBLE_GAINER_PCT` → excluded (would render as 0.0%).
 *  - Remainder is sorted descending by `change24h` and sliced to `n`.
 *
 * Pure helper — does not mutate the input array.
 */
export function selectTopGainers(
  tokens: readonly TokenMarketData[],
  n = 3,
): TokenMarketData[] {
  return [...tokens]
    .filter(t => t.change24h !== null && t.change24h >= MIN_VISIBLE_GAINER_PCT)
    .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
    .slice(0, n)
}

// ─── Deprecated mock getters — return empty; use hooks instead ───────────────

/** @deprecated Use useOnChainMarketData() hook instead */
export function getTokenMarketData(): TokenMarketData[] { return [] }

/** @deprecated Use useOnChainMarketData() hook instead */
export function getTokenBySymbol(_symbol: string): TokenMarketData | undefined { return undefined }
