import { describe, it, expect } from 'vitest'
import { formatNotionalUsd } from '../format-notional'

describe('formatNotionalUsd', () => {
  it('inserts thousands separators', () => {
    expect(formatNotionalUsd(1234.5)).toBe('$1,234.50')
    expect(formatNotionalUsd(1_000_000)).toBe('$1,000,000.00')
  })

  it('places the sign before the currency symbol for negatives', () => {
    expect(formatNotionalUsd(-50)).toBe('-$50.00')
  })

  it('renders zero with two decimals', () => {
    expect(formatNotionalUsd(0)).toBe('$0.00')
  })

  it('returns the em-dash sentinel for non-finite values', () => {
    expect(formatNotionalUsd(Number.NaN)).toBe('—')
    expect(formatNotionalUsd(Number.POSITIVE_INFINITY)).toBe('—')
    expect(formatNotionalUsd(Number.NEGATIVE_INFINITY)).toBe('—')
  })
})
