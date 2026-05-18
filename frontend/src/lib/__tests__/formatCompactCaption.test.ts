import { describe, it, expect } from 'vitest'
import {
  formatCompactCaption,
  formatCompactUsdCaption,
} from '../formatCompactCaption'

describe('formatCompactCaption — unit-less', () => {
  it('renders small values with locale grouping', () => {
    expect(formatCompactCaption(0)).toBe('0.00')
    expect(formatCompactCaption(1)).toBe('1.00')
    expect(formatCompactCaption(1234.5678)).toBe('1,234.5678')
  })

  it('uses 4 decimals by default for sub-1e9 values', () => {
    expect(formatCompactCaption(0.00002789)).toBe('0.00')
    expect(formatCompactCaption(0.12345)).toBe('0.1235')
  })

  it('respects a custom fractionDigits value', () => {
    expect(formatCompactCaption(0.00002789, 8)).toBe('0.00002789')
    expect(formatCompactCaption(12.3456789, 6)).toBe('12.345679')
  })

  it('collapses 1e9+ to a B suffix', () => {
    expect(formatCompactCaption(2.45e9)).toBe('2.45B')
    expect(formatCompactCaption(601e9)).toBe('601B')
  })

  it('collapses 1e12+ to a T suffix', () => {
    expect(formatCompactCaption(1.5e12)).toBe('1.50T')
    expect(formatCompactCaption(6.01e12)).toBe('6.01T')
  })

  it('collapses 1e15+ to a Q suffix', () => {
    expect(formatCompactCaption(6e15)).toBe('6.00Q')
    expect(formatCompactCaption(1.5e16)).toBe('15.0Q')
  })

  it('handles values that would otherwise overflow to scientific notation', () => {
    // 9.99e21 used to render as "9.99e+21" via toLocaleString — must NOT
    // contain an "e" anymore.
    const out = formatCompactCaption(9.99e21)
    expect(out).not.toMatch(/e/i)
    expect(out.endsWith('Q')).toBe(true)
  })

  it('handles negative values with a leading minus', () => {
    expect(formatCompactCaption(-2.5e9)).toBe('-2.50B')
    expect(formatCompactCaption(-1234.56)).toBe('-1,234.56')
  })

  it('returns an em-dash for non-finite inputs', () => {
    expect(formatCompactCaption(NaN)).toBe('—')
    expect(formatCompactCaption(Infinity)).toBe('—')
    expect(formatCompactCaption(-Infinity)).toBe('—')
  })
})

describe('formatCompactUsdCaption — $ prefix', () => {
  it('renders small values with $ prefix and 2 decimals', () => {
    expect(formatCompactUsdCaption(0)).toBe('$0.00')
    expect(formatCompactUsdCaption(1234.56)).toBe('$1,234.56')
  })

  it('collapses large values with K/M/B/T/Q suffixes', () => {
    expect(formatCompactUsdCaption(2.45e9)).toBe('$2.45B')
    expect(formatCompactUsdCaption(1.5e12)).toBe('$1.50T')
    expect(formatCompactUsdCaption(6e15)).toBe('$6.00Q')
  })

  it('never falls back to scientific notation for huge values', () => {
    const out = formatCompactUsdCaption(9.99e21)
    expect(out).not.toMatch(/e/i)
    expect(out.startsWith('$')).toBe(true)
  })

  it('handles negatives with sign before the dollar', () => {
    expect(formatCompactUsdCaption(-2.5e9)).toBe('-$2.50B')
    expect(formatCompactUsdCaption(-1234.56)).toBe('-$1,234.56')
  })

  it('returns $— for non-finite inputs', () => {
    expect(formatCompactUsdCaption(NaN)).toBe('$—')
    expect(formatCompactUsdCaption(Infinity)).toBe('$—')
  })
})
