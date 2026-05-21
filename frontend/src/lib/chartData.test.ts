import { describe, it, expect, beforeEach } from 'vitest'
import { getChartData, type Timeframe } from './chartData'

describe('getChartData — timeframe coverage', () => {
  // Unique symbol per test avoids cache cross-contamination between cases.
  let counter = 0
  const sym = () => `TST_${++counter}`

  beforeEach(() => {
    // counter resets are unnecessary because we always mint a fresh symbol,
    // but reset anyway so test ordering doesn't surface as flaky.
    counter = 0
  })

  it('returns 24 candles for 1D', () => {
    const data = getChartData(sym(), '1D', 100)
    expect(data).toHaveLength(24)
  })

  it('returns 28 candles for 1W', () => {
    const data = getChartData(sym(), '1W', 100)
    expect(data).toHaveLength(28)
  })

  it('returns 30 candles for 1M', () => {
    const data = getChartData(sym(), '1M', 100)
    expect(data).toHaveLength(30)
  })

  it('returns 90 candles for 3M', () => {
    const data = getChartData(sym(), '3M', 100)
    expect(data).toHaveLength(90)
  })

  it('returns 180 candles for 6M', () => {
    const data = getChartData(sym(), '6M', 100)
    expect(data).toHaveLength(180)
  })

  it('returns 365 candles for 1Y', () => {
    const data = getChartData(sym(), '1Y', 100)
    expect(data).toHaveLength(365)
  })

  it('returns 260 candles for 5Y', () => {
    const data = getChartData(sym(), '5Y', 100)
    expect(data).toHaveLength(260)
  })

  it('returns 240 candles for ALL', () => {
    const data = getChartData(sym(), 'ALL', 100)
    expect(data).toHaveLength(240)
  })

  it('Timeframe union accepts the long-range options at the type level', () => {
    // Compile-time check: if these don't typecheck the build breaks.
    const tfs: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL']
    expect(tfs).toHaveLength(8)
  })

  it('produces last candle close equal to basePrice for new timeframes', () => {
    const longTfs: Timeframe[] = ['6M', '5Y', 'ALL']
    for (const tf of longTfs) {
      const data = getChartData(sym(), tf, 250)
      expect(data[data.length - 1].close).toBe(250)
    }
  })
})
