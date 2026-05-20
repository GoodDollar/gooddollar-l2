import { describe, it, expect } from 'vitest'
import { getChartData } from '../chartData'

/**
 * Task 0031 — getChartData must track live basePrice on the last candle.
 *
 * Before the fix:
 *   - `getChartData(sym, tf, basePrice)` was a frozen module-level cache keyed on
 *     `(sym, tf)`. Subsequent calls with a different `basePrice` returned the
 *     same array, so the right-most candle drifted from the live oracle price.
 *
 * After the fix:
 *   - Historical candles (indices `0..N-2`) stay stable for a given `(sym, tf)`
 *     entry (no re-randomisation, no chart flicker).
 *   - The LAST candle's `close` always equals the latest `basePrice` passed in.
 *   - Switching timeframe and back still returns a chart whose last candle
 *     tracks the most recent `basePrice`.
 *   - Cross-ticker navigation does not leak: each `(sym, tf)` entry maintains
 *     its own historical baseline.
 */
describe('getChartData — live-price last candle', () => {
  it('returns the same number of points for a given timeframe', () => {
    const series = getChartData('TASK31_A', '3M', 100)
    // 3M is configured as 90 points in TIMEFRAME_CONFIG.
    expect(series).toHaveLength(90)
  })

  it('last candle close === basePrice on the very first call', () => {
    const series = getChartData('TASK31_B', '3M', 200)
    const last = series[series.length - 1]
    expect(last.close).toBeCloseTo(200, 6)
  })

  it('updates the last candle close when basePrice changes on subsequent calls', () => {
    const first = getChartData('TASK31_C', '3M', 200)
    const second = getChartData('TASK31_C', '3M', 250)

    expect(first[first.length - 1].close).toBeCloseTo(200, 6)
    expect(second[second.length - 1].close).toBeCloseTo(250, 6)
  })

  it('keeps historical candles stable across calls with different basePrice', () => {
    const first = getChartData('TASK31_D', '3M', 200)
    const firstHistorical = first.slice(0, -1).map((c) => ({ ...c }))

    const second = getChartData('TASK31_D', '3M', 350)
    const secondHistorical = second.slice(0, -1)

    expect(secondHistorical).toHaveLength(firstHistorical.length)
    for (let i = 0; i < firstHistorical.length; i++) {
      expect(secondHistorical[i].time).toEqual(firstHistorical[i].time)
      expect(secondHistorical[i].open).toBeCloseTo(firstHistorical[i].open, 10)
      expect(secondHistorical[i].close).toBeCloseTo(firstHistorical[i].close, 10)
      expect(secondHistorical[i].high).toBeCloseTo(firstHistorical[i].high, 10)
      expect(secondHistorical[i].low).toBeCloseTo(firstHistorical[i].low, 10)
      expect(secondHistorical[i].volume).toBe(firstHistorical[i].volume)
    }
  })

  it('keeps last candle high/low consistent with the new basePrice', () => {
    const first = getChartData('TASK31_E', '3M', 100)
    const lastBefore = first[first.length - 1]

    const second = getChartData('TASK31_E', '3M', 10_000)
    const lastAfter = second[second.length - 1]

    // After a huge upward tick, the high must be at least the new basePrice.
    expect(lastAfter.high).toBeGreaterThanOrEqual(10_000)
    // The low must be at most the new basePrice.
    expect(lastAfter.low).toBeLessThanOrEqual(10_000)
    // The time index must not shift; we are mutating the last candle only.
    expect(lastAfter.time).toEqual(lastBefore.time)
  })

  it('survives a timeframe round-trip: 3M → 1D → 3M reports the latest basePrice', () => {
    getChartData('TASK31_F', '3M', 100)
    getChartData('TASK31_F', '1D', 100)
    const back = getChartData('TASK31_F', '3M', 175)
    expect(back[back.length - 1].close).toBeCloseTo(175, 6)
  })

  it('different tickers do not leak last-candle close into each other', () => {
    const a = getChartData('TASK31_G_AAPL', '3M', 200)
    const b = getChartData('TASK31_G_TSLA', '3M', 400)
    expect(a[a.length - 1].close).toBeCloseTo(200, 6)
    expect(b[b.length - 1].close).toBeCloseTo(400, 6)
  })

  it('ignores non-finite or non-positive basePrice on update (does not corrupt last candle)', () => {
    const ok = getChartData('TASK31_H', '3M', 100)
    const closeBefore = ok[ok.length - 1].close
    expect(closeBefore).toBeCloseTo(100, 6)

    // NaN / 0 / negative should not poison the last candle. The implementation
    // is allowed to either keep the previous close or to leave the cached
    // series as-is — either way it must remain a finite positive number.
    const series2 = getChartData('TASK31_H', '3M', Number.NaN)
    expect(Number.isFinite(series2[series2.length - 1].close)).toBe(true)
    expect(series2[series2.length - 1].close).toBeGreaterThan(0)

    const series3 = getChartData('TASK31_H', '3M', 0)
    expect(Number.isFinite(series3[series3.length - 1].close)).toBe(true)
    expect(series3[series3.length - 1].close).toBeGreaterThan(0)
  })
})
