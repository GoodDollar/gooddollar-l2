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
 * Resolution is offline-friendly: no network calls, no remote logos,
 * no IntersectionObserver. The asset class is derived purely from the
 * ticker string via `resolveAssetClass`, the visible glyph from
 * `monogram`, and the colour from a small inline allow-list. The chip
 * is `aria-hidden="true"` so screen readers still announce the ticker
 * exactly once (via the visible sibling label that the receipts table
 * owns).
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

function isFxPair(t: string): boolean {
  if (t.includes('/')) {
    const [a, b] = t.split('/').map((s) => s.trim().toUpperCase())
    return CURRENCY_CODES.has(a) && CURRENCY_CODES.has(b)
  }
  if (t.length === 6) {
    const a = t.slice(0, 3)
    const b = t.slice(3)
    return CURRENCY_CODES.has(a) && CURRENCY_CODES.has(b)
  }
  return false
}

function isCrypto(t: string): boolean {
  if (CRYPTO_TICKERS.has(t)) return true
  for (const suffix of CRYPTO_SUFFIXES) {
    if (t.endsWith(suffix) && t.length > suffix.length) {
      const base = t.slice(0, t.length - suffix.length)
      if (CRYPTO_TICKERS.has(base)) return true
    }
  }
  return false
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
      if (t.includes('/')) {
        const [a, b] = t.split('/')
        return `${a.slice(0, 2)}/${b.slice(0, 2)}`
      }
      return `${t.slice(0, 2)}/${t.slice(3, 5)}`
    }
    case 'crypto':
    case 'stock':
      return t.slice(0, 2) || '?'
    case 'unknown':
      return '?'
  }
}

function colorsFor(cls: InstrumentClass, ticker: string): ClassColors {
  if (cls === 'crypto') {
    const t = normalize(ticker)
    if (CRYPTO_BRAND_COLORS[t]) return CRYPTO_BRAND_COLORS[t]
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
