/**
 * Canonical default symbol set the `/stocks` listing page mounts with
 * (matches `FALLBACK_STOCKS` in `useOnChainStocks.ts` after on-chain
 * data settles), and the URL-building helper the listing-page hook
 * and the layout-level preload share so the two cannot drift.
 *
 * Task 0049: previously the layout preloaded the bare
 * `/api/stocks/rebalance-status` URL while `useStocksRebalanceStatus`
 * always appended `?symbols=…`, so the preload bytes were thrown away
 * and the runtime fetch still incurred a network round-trip. Both
 * paths now flow through `buildRebalanceStatusUrl(STOCKS_LISTING_SYMBOLS)`
 * so the preloaded URL is byte-identical to the runtime URL and the
 * browser can satisfy the actual fetch from the preload cache.
 *
 * INVARIANT: the constant array MUST stay sorted alphabetically,
 * deduped, and uppercase — the hook's `symbolKey` normalization sorts
 * and uppercases before encoding, so any drift in the constant would
 * silently break the byte-level URL match. The unit test pins this.
 */

export const STOCKS_LISTING_SYMBOLS = [
  'AAPL',
  'AMD',
  'AMZN',
  'COIN',
  'GOOGL',
  'META',
  'MSFT',
  'NFLX',
  'NVDA',
  'TSLA',
] as const

/**
 * Build the `/api/stocks/rebalance-status` URL the way
 * `useStocksRebalanceStatus` does: trim → uppercase → dedupe → sort →
 * comma-join → `encodeURIComponent`. Returns the bare URL when the
 * normalized set is empty (the hook also takes that branch transiently
 * before on-chain reads settle).
 */
export function buildRebalanceStatusUrl(symbols: readonly string[]): string {
  const key = Array.from(
    new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)),
  )
    .sort()
    .join(',')
  return key.length > 0
    ? `/api/stocks/rebalance-status?symbols=${encodeURIComponent(key)}`
    : '/api/stocks/rebalance-status'
}
