import { describe, it, expect } from 'vitest'
import { hasLiveOracleChange, hasLiveOracleFundamentals } from '../oracleHonesty'

const baseStock = {
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  eps: 0,
  peRatio: 0,
}

describe('hasLiveOracleChange', () => {
  it('returns false when change24h, volume24h, and marketCap are all zero', () => {
    expect(hasLiveOracleChange(baseStock)).toBe(false)
  })

  it('returns true when volume24h is non-zero', () => {
    expect(hasLiveOracleChange({ ...baseStock, volume24h: 1_000_000 })).toBe(true)
  })

  it('returns true when marketCap is non-zero', () => {
    expect(hasLiveOracleChange({ ...baseStock, marketCap: 1_000_000_000 })).toBe(true)
  })

  it('returns true when change24h is positive (real flat-day positive crypto tick)', () => {
    expect(hasLiveOracleChange({ ...baseStock, change24h: 0.01 })).toBe(true)
  })

  it('returns true when change24h is negative with no volume yet (real intraday move)', () => {
    expect(hasLiveOracleChange({ ...baseStock, change24h: -0.5 })).toBe(true)
  })

  it('returns false for null-like missing fields', () => {
    expect(hasLiveOracleChange({ change24h: 0, volume24h: 0, marketCap: 0 })).toBe(false)
  })
})

describe('hasLiveOracleFundamentals', () => {
  it('returns false when all fundamental fields are zero', () => {
    expect(hasLiveOracleFundamentals(baseStock)).toBe(false)
  })

  it('returns true when marketCap is positive', () => {
    expect(hasLiveOracleFundamentals({ ...baseStock, marketCap: 1_000_000 })).toBe(true)
  })

  it('returns true when volume24h is positive', () => {
    expect(hasLiveOracleFundamentals({ ...baseStock, volume24h: 1 })).toBe(true)
  })

  it('returns true when eps is non-zero (negative or positive)', () => {
    expect(hasLiveOracleFundamentals({ ...baseStock, eps: 1.25 })).toBe(true)
    expect(hasLiveOracleFundamentals({ ...baseStock, eps: -0.5 })).toBe(true)
  })

  it('returns true when peRatio is positive', () => {
    expect(hasLiveOracleFundamentals({ ...baseStock, peRatio: 12.4 })).toBe(true)
  })
})
