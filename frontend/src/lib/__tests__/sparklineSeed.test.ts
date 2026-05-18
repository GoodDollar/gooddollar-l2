import { describe, it, expect } from 'vitest'
import { generateSeededSparkline } from '../sparklineSeed'

describe('generateSeededSparkline', () => {
  describe('null fallback', () => {
    it('returns null when currentPrice is 0', () => {
      expect(generateSeededSparkline('ETH', 0, 1.5)).toBeNull()
    })

    it('returns null when currentPrice is negative', () => {
      expect(generateSeededSparkline('ETH', -10, 1.5)).toBeNull()
    })

    it('returns null when currentPrice is NaN', () => {
      expect(generateSeededSparkline('ETH', NaN, 1.5)).toBeNull()
    })

    it('returns null when currentPrice is Infinity', () => {
      expect(generateSeededSparkline('ETH', Infinity, 1.5)).toBeNull()
    })
  })

  describe('shape', () => {
    it('returns an array of length 7', () => {
      const out = generateSeededSparkline('ETH', 3000, 1.5)
      expect(out).not.toBeNull()
      expect(out).toHaveLength(7)
    })

    it('returns only finite positive numbers', () => {
      const out = generateSeededSparkline('WBTC', 65000, -2.1)!
      for (const v of out) {
        expect(Number.isFinite(v)).toBe(true)
        expect(v).toBeGreaterThan(0)
      }
    })

    it('places currentPrice at the last index (today)', () => {
      const out = generateSeededSparkline('ETH', 3000, 1.5)!
      expect(out[out.length - 1]).toBeCloseTo(3000, 6)
    })
  })

  describe('determinism', () => {
    it('returns identical arrays for identical inputs', () => {
      const a = generateSeededSparkline('ETH', 3000, 1.5)
      const b = generateSeededSparkline('ETH', 3000, 1.5)
      expect(a).toEqual(b)
    })

    it('returns different arrays for different symbols', () => {
      const a = generateSeededSparkline('ETH', 3000, 1.5)
      const b = generateSeededSparkline('WBTC', 3000, 1.5)
      expect(a).not.toEqual(b)
    })

    it('survives a third invocation (no hidden state)', () => {
      const a = generateSeededSparkline('USDC', 1, 0)
      const _ = generateSeededSparkline('LINK', 14, 3)
      const c = generateSeededSparkline('USDC', 1, 0)
      expect(a).toEqual(c)
    })

    it('treats null change24h the same as 0', () => {
      const a = generateSeededSparkline('ETH', 3000, null)
      const b = generateSeededSparkline('ETH', 3000, 0)
      expect(a).toEqual(b)
    })
  })

  describe('direction bias', () => {
    it('biases positive change24h toward last >= first across many symbols', () => {
      const symbols = [
        'ETH','WBTC','USDC','USDT','DAI','LINK','UNI','AAVE','ARB','OP',
        'MKR','COMP','SNX','CRV','LDO','MATIC','G$','SOL','AVAX','DOT',
      ]
      let upWhenPositive = 0
      for (const s of symbols) {
        const arr = generateSeededSparkline(s, 100, +5)!
        if (arr[arr.length - 1] >= arr[0]) upWhenPositive++
      }
      // Bias is statistical, not absolute — with a +5% drift, most should end up.
      expect(upWhenPositive).toBeGreaterThanOrEqual(Math.ceil(symbols.length * 0.7))
    })

    it('biases negative change24h toward last <= first across many symbols', () => {
      const symbols = [
        'ETH','WBTC','USDC','USDT','DAI','LINK','UNI','AAVE','ARB','OP',
        'MKR','COMP','SNX','CRV','LDO','MATIC','G$','SOL','AVAX','DOT',
      ]
      let downWhenNegative = 0
      for (const s of symbols) {
        const arr = generateSeededSparkline(s, 100, -5)!
        if (arr[arr.length - 1] <= arr[0]) downWhenNegative++
      }
      expect(downWhenNegative).toBeGreaterThanOrEqual(Math.ceil(symbols.length * 0.7))
    })
  })

  describe('scale', () => {
    it('keeps values within a reasonable band around currentPrice', () => {
      // Drift should not produce a 10x swing on a 1.5% daily change.
      const out = generateSeededSparkline('ETH', 3000, 1.5)!
      for (const v of out) {
        expect(v).toBeGreaterThan(3000 * 0.5)
        expect(v).toBeLessThan(3000 * 2.0)
      }
    })

    it('produces some variation (not a flat line) for non-zero change24h', () => {
      const out = generateSeededSparkline('ETH', 3000, 1.5)!
      const min = Math.min(...out)
      const max = Math.max(...out)
      expect(max - min).toBeGreaterThan(0)
    })
  })
})
