import { describe, it, expect } from 'vitest'

import {
  STOCKS_LISTING_SYMBOLS,
  buildRebalanceStatusUrl,
} from '@/lib/stocksDefaultSymbols'

describe('STOCKS_LISTING_SYMBOLS', () => {
  it('snapshots the canonical 10-ticker listing set', () => {
    expect(Array.from(STOCKS_LISTING_SYMBOLS)).toEqual([
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
    ])
  })

  it('is sorted alphabetically', () => {
    const sorted = Array.from(STOCKS_LISTING_SYMBOLS).slice().sort()
    expect(Array.from(STOCKS_LISTING_SYMBOLS)).toEqual(sorted)
  })

  it('has no duplicates', () => {
    expect(new Set(STOCKS_LISTING_SYMBOLS).size).toBe(STOCKS_LISTING_SYMBOLS.length)
  })

  it('contains only uppercase A–Z (no empty strings, no lowercase, no symbols)', () => {
    for (const ticker of STOCKS_LISTING_SYMBOLS) {
      expect(ticker).toMatch(/^[A-Z]+$/)
      expect(ticker.length).toBeGreaterThan(0)
    }
  })
})

describe('buildRebalanceStatusUrl', () => {
  it('returns the bare URL when the input is empty', () => {
    expect(buildRebalanceStatusUrl([])).toBe('/api/stocks/rebalance-status')
  })

  it('returns the bare URL when input contains only blank/whitespace entries', () => {
    expect(buildRebalanceStatusUrl(['', '   '])).toBe('/api/stocks/rebalance-status')
  })

  it('encodes the canonical listing set in alphabetical order', () => {
    const expected = `/api/stocks/rebalance-status?symbols=${encodeURIComponent(
      'AAPL,AMD,AMZN,COIN,GOOGL,META,MSFT,NFLX,NVDA,TSLA',
    )}`
    expect(buildRebalanceStatusUrl(STOCKS_LISTING_SYMBOLS)).toBe(expected)
  })

  it('produces the same URL regardless of caller order (sort is internal)', () => {
    const a = buildRebalanceStatusUrl(['TSLA', 'AAPL', 'MSFT'])
    const b = buildRebalanceStatusUrl(['AAPL', 'MSFT', 'TSLA'])
    expect(a).toBe(b)
  })

  it('dedupes and uppercases case-insensitive duplicates', () => {
    const a = buildRebalanceStatusUrl(['aapl', 'AAPL', 'Aapl', 'msft'])
    const b = buildRebalanceStatusUrl(['AAPL', 'MSFT'])
    expect(a).toBe(b)
  })

  it('produces the byte-identical URL string the hook would (parity with useStocksRebalanceStatus normalization)', () => {
    // Mirror the exact normalization pipeline from
    // `useStocksRebalanceStatus.ts` so any future drift in either side
    // fails this assertion loudly.
    const hookEquivalent = (symbols: readonly string[]) => {
      const symbolKey = Array.from(
        new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)),
      )
        .sort()
        .join(',')
      return symbolKey.length > 0
        ? `/api/stocks/rebalance-status?symbols=${encodeURIComponent(symbolKey)}`
        : '/api/stocks/rebalance-status'
    }
    expect(buildRebalanceStatusUrl(STOCKS_LISTING_SYMBOLS)).toBe(
      hookEquivalent(STOCKS_LISTING_SYMBOLS),
    )
  })
})
