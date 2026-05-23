import { describe, it, expect } from 'vitest'

import { formatExposureDelta } from '../format-exposure-delta'

describe('formatExposureDelta', () => {
  it('returns em-dash placeholder when both inputs are null', () => {
    const r = formatExposureDelta(null, null)
    expect(r.display).toBe('— → —')
    expect(r.deltaSigned).toBe('—')
    expect(r.deltaClass).toBe('text-gray-500')
    expect(JSON.stringify(r)).not.toContain('null')
  })

  it('returns em-dash placeholder when both inputs are undefined', () => {
    const r = formatExposureDelta(undefined, undefined)
    expect(r.display).toBe('— → —')
    expect(r.deltaSigned).toBe('—')
    expect(JSON.stringify(r)).not.toContain('undefined')
  })

  it('returns em-dash placeholder when after is NaN', () => {
    const r = formatExposureDelta(100, Number.NaN)
    expect(r.display).toBe('— → —')
    expect(r.deltaSigned).toBe('—')
  })

  it('returns em-dash placeholder when after is Infinity', () => {
    const r = formatExposureDelta(100, Number.POSITIVE_INFINITY)
    expect(r.display).toBe('— → —')
    expect(r.deltaSigned).toBe('—')
  })

  it('formats a negative delta with the en-dash arrow and red class', () => {
    const r = formatExposureDelta(100, 50)
    expect(r.display).toBe('100 → 50')
    expect(r.deltaSigned).toBe('−50')
    expect(r.deltaClass).toBe('text-red-300')
  })

  it('formats a positive delta with the plus sign and green class', () => {
    const r = formatExposureDelta(50, 100)
    expect(r.display).toBe('50 → 100')
    expect(r.deltaSigned).toBe('+50')
    expect(r.deltaClass).toBe('text-goodgreen')
  })

  it('formats a zero delta as neutral grey with 0 sign', () => {
    const r = formatExposureDelta(0, 0)
    expect(r.display).toBe('0 → 0')
    expect(r.deltaSigned).toBe('0')
    expect(r.deltaClass).toBe('text-gray-500')
  })
})
