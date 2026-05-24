import { describe, it, expect } from 'vitest'
import { isNoData, pctOrDash, usdOrDash, intOrDash, formatCompactUsd, NO_DATA_DASH } from '../formatNoData'

describe('isNoData', () => {
  it('treats null and undefined as no-data', () => {
    expect(isNoData(null)).toBe(true)
    expect(isNoData(undefined)).toBe(true)
  })

  it('treats non-numbers as no-data', () => {
    expect(isNoData('abc')).toBe(true)
    expect(isNoData({})).toBe(true)
  })

  it('treats NaN and Infinity as no-data', () => {
    expect(isNoData(NaN)).toBe(true)
    expect(isNoData(Infinity)).toBe(true)
    expect(isNoData(-Infinity)).toBe(true)
  })

  it('treats exact 0 as no-data (seed sentinel)', () => {
    expect(isNoData(0)).toBe(true)
    expect(isNoData(-0)).toBe(true)
  })

  it('treats real positive and negative numbers as data', () => {
    expect(isNoData(1)).toBe(false)
    expect(isNoData(-1)).toBe(false)
    expect(isNoData(0.0001)).toBe(false)
    expect(isNoData(-12.34)).toBe(false)
  })
})

describe('pctOrDash', () => {
  it('renders the em-dash for no-data inputs', () => {
    expect(pctOrDash(null)).toBe(NO_DATA_DASH)
    expect(pctOrDash(undefined)).toBe(NO_DATA_DASH)
    expect(pctOrDash(0)).toBe(NO_DATA_DASH)
    expect(pctOrDash(NaN)).toBe(NO_DATA_DASH)
  })

  it('renders positive values with + sign and 2 decimals', () => {
    expect(pctOrDash(1.234)).toBe('+1.23%')
    expect(pctOrDash(0.01)).toBe('+0.01%')
  })

  it('renders negative values without injecting an extra sign', () => {
    expect(pctOrDash(-4.5)).toBe('-4.50%')
  })

  it('honours custom decimals parameter', () => {
    expect(pctOrDash(1.2345, 4)).toBe('+1.2345%')
  })
})

describe('usdOrDash', () => {
  it('renders the em-dash for no-data inputs', () => {
    expect(usdOrDash(null)).toBe(NO_DATA_DASH)
    expect(usdOrDash(0)).toBe(NO_DATA_DASH)
  })

  it('renders compact form for large numbers', () => {
    expect(usdOrDash(2_500_000_000)).toBe('$2.50B')
    expect(usdOrDash(1_500_000)).toBe('$1.50M')
  })

  it('renders standard formatting for small numbers', () => {
    expect(usdOrDash(123.456)).toBe('$123.46')
    expect(usdOrDash(0.5)).toBe('$0.50')
  })
})

describe('intOrDash', () => {
  it('renders the em-dash for no-data inputs', () => {
    expect(intOrDash(null)).toBe(NO_DATA_DASH)
    expect(intOrDash(0)).toBe(NO_DATA_DASH)
  })

  it('renders integers with thousands separators', () => {
    expect(intOrDash(1234)).toBe('1,234')
    expect(intOrDash(1234567.89)).toBe('1,234,568')
  })
})

describe('formatCompactUsd', () => {
  it('handles the giga / mega / standard tiers', () => {
    expect(formatCompactUsd(1_000_000_000)).toBe('$1.00B')
    expect(formatCompactUsd(2_500_000)).toBe('$2.50M')
    expect(formatCompactUsd(3500)).toBe('$3,500.00')
    expect(formatCompactUsd(12.34)).toBe('$12.34')
  })

  it('handles negative values across tiers', () => {
    expect(formatCompactUsd(-2_500_000_000)).toBe('$-2.50B')
    expect(formatCompactUsd(-12.34)).toBe('$-12.34')
  })
})
