import { describe, expect, it } from 'vitest'
import { FALLBACK_STOCKS } from '@/lib/useOnChainStocks'

// Task 0035 — data-layer regression guard.
//
// The previous FALLBACK_STOCKS shipped hardcoded `change24h`, `volume24h`,
// `marketCap`, `sparkline7d`, P/E, EPS values for every ticker. When the
// on-chain `getPrice` reads returned zero (devnet default), the listing
// page fell back to this array and rendered the hardcoded numbers as if
// they were live oracle quotes — the same trust failure this lane is
// trying to eliminate everywhere.
//
// This test locks the shape: the fallback is allowed to carry a ticker
// label, sector/description metadata, and a sentinel `price` (already
// covered by the "Oracle offline" banner), but every quantitative
// market-data field must be the zero / null sentinel. Adding a ticker
// with non-zero quantitative data here should fail CI at the constant.
describe('FALLBACK_STOCKS dataset honesty', () => {
  it('ships every entry with the no-market-data sentinel shape', () => {
    expect(FALLBACK_STOCKS.length).toBeGreaterThan(0)
    for (const stock of FALLBACK_STOCKS) {
      expect(stock.change24h, `${stock.ticker} change24h`).toBe(0)
      expect(stock.volume24h, `${stock.ticker} volume24h`).toBe(0)
      expect(stock.marketCap, `${stock.ticker} marketCap`).toBe(0)
      expect(stock.high52w, `${stock.ticker} high52w`).toBe(0)
      expect(stock.low52w, `${stock.ticker} low52w`).toBe(0)
      expect(stock.peRatio, `${stock.ticker} peRatio`).toBe(0)
      expect(stock.eps, `${stock.ticker} eps`).toBe(0)
      expect(stock.dividendYield, `${stock.ticker} dividendYield`).toBe(0)
      expect(stock.avgVolume, `${stock.ticker} avgVolume`).toBe(0)
      expect(stock.sparkline7d, `${stock.ticker} sparkline7d`).toBeNull()
    }
  })

  it('keeps a positive price sentinel so the table still renders a ticker label', () => {
    for (const stock of FALLBACK_STOCKS) {
      expect(stock.price, `${stock.ticker} price`).toBeGreaterThan(0)
    }
  })
})
