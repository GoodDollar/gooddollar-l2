import { describe, it, expect } from 'vitest'
import { FALLBACK_PAIRS } from '@/lib/useOnChainPerps'

// Task 0037 — data-layer regression guard for the perps fallback.
//
// FALLBACK_PAIRS used to ship every quantitative field (change24h,
// volume24h, fundingRate, openInterest, high24h, low24h) as non-zero,
// so the `/perps` market header rendered a confident "Vol $1.25B ·
// Funding +0.4900% · OI $890M · 24h H $86,433 · 24h L $82,036" header
// even when the crypto oracle was offline. Lock the shape: the
// fallback may carry a sentinel `markPrice` (already labelled by the
// "Crypto oracle offline" banner), but every other quantitative field
// must be the zero sentinel so PairInfoBar renders an em-dash.
describe('FALLBACK_PAIRS dataset honesty', () => {
  it('ships every entry with the no-market-data sentinel shape', () => {
    expect(FALLBACK_PAIRS.length).toBeGreaterThan(0)
    for (const pair of FALLBACK_PAIRS) {
      expect(pair.change24h, `${pair.symbol} change24h`).toBe(0)
      expect(pair.volume24h, `${pair.symbol} volume24h`).toBe(0)
      expect(pair.fundingRate, `${pair.symbol} fundingRate`).toBe(0)
      expect(pair.openInterest, `${pair.symbol} openInterest`).toBe(0)
      expect(pair.high24h, `${pair.symbol} high24h`).toBe(pair.markPrice)
      expect(pair.low24h, `${pair.symbol} low24h`).toBe(pair.markPrice)
    }
  })

  it('keeps a positive markPrice sentinel so the chart still renders', () => {
    for (const pair of FALLBACK_PAIRS) {
      expect(pair.markPrice, `${pair.symbol} markPrice`).toBeGreaterThan(0)
    }
  })
})
