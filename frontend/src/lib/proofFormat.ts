/**
 * proofFormat — precision-aware USD formatter shared by the
 * /live-prices-proof panels.
 *
 * The price-service synthesiser emits stock prices at 2/3-decimal
 * precision and crypto prices at 4-decimal precision; the on-chain
 * oracle decodes 8-decimal big integers into floats. Without a
 * normalising formatter, the same instrument renders as `$426.10`
 * in one column and `$426.125` in another. This module picks the
 * digit count from the symbol's instrument class so MID, BID, ASK,
 * and the on-chain decode all read as a tidy ladder.
 */

export const CRYPTO_SYMBOLS: ReadonlySet<string> = new Set(['BTC', 'ETH', 'SOL'])

export function decimalsFor(symbol: string, value: number): number {
  if (CRYPTO_SYMBOLS.has(symbol)) {
    if (value >= 1_000) return 2
    if (value >= 1) return 4
    return 6
  }
  return 2
}

export function formatProofUsd(symbol: string, n: number): string {
  if (!Number.isFinite(n)) return '—'
  const decimals = decimalsFor(symbol, n)
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
