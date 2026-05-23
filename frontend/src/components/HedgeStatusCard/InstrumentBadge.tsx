'use client'

import { memo } from 'react'

/**
 * Lane 5 — instrument badge for the receipts table `symbol` column.
 *
 * eToro pairs every ticker with an instrument icon in its history
 * surfaces. Without one, our receipts column reads as raw log output.
 * `InstrumentBadge` renders a tiny 16-px monogram chip next to the
 * ticker so the table reads as a polished proof artifact (task 0046).
 *
 * Symbol shapes supported (task 0051):
 *   - Pure ticker:           `BTC`, `AAPL`, `EURUSD`
 *   - `BASE-QUOTE` (engine canonical): `BTC-USD`, `ETH-USDT`, `EUR-USD`
 *   - `BASE/QUOTE`:          `BTC/USD`, `EUR/USD`
 *   - 6-char FX concat:      `EURUSD`
 *   - Crypto with suffix:    `BTCUSD`, `ETHUSDT`
 *
 * Every classifier / colour / monogram path pivots off a single
 * `splitPair(t)` helper so we have one place that knows what a
 * "BASE-QUOTE" pair looks like. Classification order is FX (both
 * sides currency codes) → crypto (base in CRYPTO_TICKERS) → stock
 * (regex), matching retail convention (BTC/EUR is a crypto market,
 * not FX, because BTC isn't a currency code).
 *
 * Resolution is offline-friendly: no network calls, no remote logos,
 * no IntersectionObserver. The chip is `aria-hidden="true"` so screen
 * readers still announce the ticker exactly once via the visible
 * sibling label the receipts table owns.
 */

export type InstrumentClass = 'crypto' | 'fx' | 'stock' | 'unknown'

const CRYPTO_TICKERS = new Set([
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'USDC',
  'USDT',
  'DAI',
  'MATIC',
  'AVAX',
  'XRP',
  'ADA',
  'DOGE',
  'LINK',
  'UNI',
])

const CRYPTO_SUFFIXES = ['USDT', 'USD', 'BTC', 'ETH'] as const

const CURRENCY_CODES = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'AUD',
  'CAD',
  'NZD',
  'CNY',
  'SEK',
  'NOK',
  'DKK',
  'HKD',
  'SGD',
])

interface ClassColors {
  bg: string
  text: string
}

const CLASS_COLORS: Record<InstrumentClass, ClassColors> = {
  crypto: { bg: 'bg-amber-500/20', text: 'text-amber-200' },
  fx: { bg: 'bg-violet-500/20', text: 'text-violet-200' },
  stock: { bg: 'bg-blue-500/20', text: 'text-blue-200' },
  unknown: { bg: 'bg-gray-500/20', text: 'text-gray-300' },
}

const CRYPTO_BRAND_COLORS: Record<string, ClassColors> = {
  BTC: { bg: 'bg-amber-500/25', text: 'text-amber-200' },
  ETH: { bg: 'bg-indigo-500/25', text: 'text-indigo-100' },
  SOL: { bg: 'bg-fuchsia-500/25', text: 'text-fuchsia-100' },
  USDC: { bg: 'bg-blue-500/20', text: 'text-blue-100' },
  USDT: { bg: 'bg-emerald-500/20', text: 'text-emerald-100' },
}

function normalize(ticker: string): string {
  return (ticker ?? '').trim().toUpperCase()
}

/**
 * Split a `BASE-QUOTE` or `BASE/QUOTE` pair into its two halves.
 * Returns `null` for pure tickers, dash-less concats, multi-separator
 * symbols, or any shape where either half is empty. Both halves are
 * already upper-cased because `splitPair` is only ever called against
 * a `normalize`d ticker.
 */
function splitPair(t: string): { base: string; quote: string } | null {
  const dash = t.indexOf('-')
  const slash = t.indexOf('/')
  const sep = dash === -1 ? slash : slash === -1 ? dash : -1
  if (sep <= 0 || sep === t.length - 1) return null
  // Reject multi-separator symbols (`BTC-USD-PERP`, `AAPL.US.OPT`).
  if (t.indexOf('-', sep + 1) !== -1) return null
  if (t.indexOf('/', sep + 1) !== -1) return null
  return { base: t.slice(0, sep), quote: t.slice(sep + 1) }
}

function isFxPair(t: string): boolean {
  const pair = splitPair(t)
  if (pair) return CURRENCY_CODES.has(pair.base) && CURRENCY_CODES.has(pair.quote)
  if (t.length === 6) {
    return CURRENCY_CODES.has(t.slice(0, 3)) && CURRENCY_CODES.has(t.slice(3))
  }
  return false
}

/**
 * Resolve the crypto base ticker from any supported symbol shape, or
 * `null` if the ticker is not crypto under our classifier. One helper
 * for every path that needs the base (classification, monogram, brand
 * colors) so BTC, BTC-USD, BTC/USD, and BTCUSD all produce `'BTC'`.
 */
function cryptoBase(t: string): string | null {
  if (CRYPTO_TICKERS.has(t)) return t
  const pair = splitPair(t)
  if (pair && CRYPTO_TICKERS.has(pair.base)) return pair.base
  for (const suffix of CRYPTO_SUFFIXES) {
    if (t.endsWith(suffix) && t.length > suffix.length) {
      const base = t.slice(0, t.length - suffix.length)
      if (CRYPTO_TICKERS.has(base)) return base
    }
  }
  return null
}

function isCrypto(t: string): boolean {
  return cryptoBase(t) !== null
}

export function resolveAssetClass(rawTicker: string): InstrumentClass {
  const t = normalize(rawTicker)
  if (!t) return 'unknown'
  if (isFxPair(t)) return 'fx'
  if (isCrypto(t)) return 'crypto'
  if (/^[A-Z]{1,5}$/.test(t)) return 'stock'
  return 'unknown'
}

export function monogram(rawTicker: string, cls: InstrumentClass): string {
  const t = normalize(rawTicker)
  switch (cls) {
    case 'fx': {
      const pair = splitPair(t)
      if (pair) return `${pair.base.slice(0, 2)}/${pair.quote.slice(0, 2)}`
      return `${t.slice(0, 2)}/${t.slice(3, 5)}`
    }
    case 'crypto': {
      const base = cryptoBase(t) ?? splitPair(t)?.base ?? t
      return base.slice(0, 2) || '?'
    }
    case 'stock': {
      const base = splitPair(t)?.base ?? t
      return base.slice(0, 2) || '?'
    }
    case 'unknown':
      return '?'
  }
}

function colorsFor(cls: InstrumentClass, ticker: string): ClassColors {
  if (cls === 'crypto') {
    const base = cryptoBase(normalize(ticker))
    if (base && CRYPTO_BRAND_COLORS[base]) return CRYPTO_BRAND_COLORS[base]
  }
  return CLASS_COLORS[cls]
}

export interface InstrumentBadgeProps {
  ticker: string
  testId?: string
}

export const InstrumentBadge = memo(function InstrumentBadge({
  ticker,
  testId,
}: InstrumentBadgeProps) {
  const cls = resolveAssetClass(ticker)
  const glyph = monogram(ticker, cls)
  const colors = colorsFor(cls, ticker)
  // FX pairs need ~5 chars (e.g. EU/US) — widen the chip from a square
  // to a pill so the glyph never crops, while every other class keeps
  // the canonical 16×16 footprint.
  const sizing = cls === 'fx' ? 'h-4 px-1 rounded-md' : 'w-4 h-4 rounded-sm'
  return (
    <span
      data-testid={testId}
      data-instrument-class={cls}
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 ${sizing} text-[9px] font-bold leading-none ${colors.bg} ${colors.text}`}
    >
      {glyph}
    </span>
  )
})
