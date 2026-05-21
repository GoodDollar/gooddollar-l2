import { describe, it, expect } from 'vitest'
import { getChartData, computeSMA, type Timeframe } from '@/lib/chartData'

describe('chartData', () => {
  describe('extended timeframes', () => {
    it.each(['1H', '4H', '1D', '1W', '1M', '3M', '1Y'] satisfies Timeframe[])(
      'generates OHLC data for %s timeframe',
      (tf) => {
        const data = getChartData('TEST', tf, 100)
        expect(data.length).toBeGreaterThan(0)
        for (const d of data) {
          expect(d).toHaveProperty('open')
          expect(d).toHaveProperty('high')
          expect(d).toHaveProperty('low')
          expect(d).toHaveProperty('close')
          expect(d).toHaveProperty('volume')
          expect(d.high).toBeGreaterThanOrEqual(d.low)
        }
      }
    )

    it('1H produces intraday timestamps', () => {
      const data = getChartData('AAPL', '1H', 200)
      expect(data.length).toBe(60)
      expect(typeof data[0].time).toBe('number')
    })

    it('4H produces intraday timestamps', () => {
      const data = getChartData('AAPL', '4H', 200)
      expect(data.length).toBe(42)
      expect(typeof data[0].time).toBe('number')
    })
  })

  describe('computeSMA', () => {
    it('returns empty array when data is shorter than period', () => {
      const data = [
        { time: '2024-01-01', open: 10, high: 12, low: 9, close: 11, volume: 100 },
      ]
      expect(computeSMA(data, 20)).toEqual([])
    })

    it('calculates correct SMA values', () => {
      const data = Array.from({ length: 5 }, (_, i) => ({
        time: `2024-01-0${i + 1}`,
        open: 10,
        high: 12,
        low: 9,
        close: (i + 1) * 10,
        volume: 100,
      }))
      const sma = computeSMA(data, 3)
      expect(sma).toHaveLength(3)
      expect(sma[0].value).toBeCloseTo(20)
      expect(sma[1].value).toBeCloseTo(30)
      expect(sma[2].value).toBeCloseTo(40)
    })

    it('uses the close price for SMA calculation', () => {
      const data = Array.from({ length: 3 }, (_, i) => ({
        time: `2024-01-0${i + 1}`,
        open: 100,
        high: 200,
        low: 50,
        close: 10 * (i + 1),
        volume: 100,
      }))
      const sma = computeSMA(data, 3)
      expect(sma).toHaveLength(1)
      expect(sma[0].value).toBeCloseTo(20)
    })
  })
})
