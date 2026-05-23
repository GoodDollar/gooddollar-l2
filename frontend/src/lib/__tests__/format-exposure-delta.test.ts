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

  it('formats a negative integer delta as red money with en-dash prefix', () => {
    const r = formatExposureDelta(100, 50)
    expect(r.display).toBe('$100.00 → $50.00')
    expect(r.deltaSigned).toBe('−$50.00')
    expect(r.deltaClass).toBe('text-red-300')
  })

  it('formats a positive integer delta as green money with plus prefix', () => {
    const r = formatExposureDelta(50, 100)
    expect(r.display).toBe('$50.00 → $100.00')
    expect(r.deltaSigned).toBe('+$50.00')
    expect(r.deltaClass).toBe('text-goodgreen')
  })

  it('formats a zero delta as neutral grey $0.00 (not "0")', () => {
    const r = formatExposureDelta(0, 0)
    expect(r.display).toBe('$0.00 → $0.00')
    expect(r.deltaSigned).toBe('$0.00')
    expect(r.deltaClass).toBe('text-gray-500')
  })

  // Acceptance criteria 0050: fractional inputs must collapse IEEE-754
  // subtraction noise to clean two-decimal money instead of bleeding
  // 12–17 digits of trailing float dust into the proof artifact.
  it('rounds the BTC-USD fractional case (1480.22, 1438.04) cleanly', () => {
    const r = formatExposureDelta(1480.22, 1438.04)
    expect(r.display).toBe('$1,480.22 → $1,438.04')
    expect(r.deltaSigned).toBe('−$42.18')
    expect(r.deltaClass).toBe('text-red-300')
  })

  it('rounds the ETH-USD fractional case (223.1, 242.02) cleanly and pads both sides to 2dp', () => {
    const r = formatExposureDelta(223.1, 242.02)
    expect(r.display).toBe('$223.10 → $242.02')
    expect(r.deltaSigned).toBe('+$18.92')
    expect(r.deltaClass).toBe('text-goodgreen')
  })

  it('rounds the BTC-USD positive case (1454.71, 1480.22) — never "+25.50999999999999"', () => {
    const r = formatExposureDelta(1454.71, 1480.22)
    expect(r.deltaSigned).toBe('+$25.51')
    expect(r.deltaClass).toBe('text-goodgreen')
  })

  it('renders a zero-delta NVDA-like fractional row as $0.00 (not "0")', () => {
    const r = formatExposureDelta(55.1, 55.1)
    expect(r.display).toBe('$55.10 → $55.10')
    expect(r.deltaSigned).toBe('$0.00')
    expect(r.deltaClass).toBe('text-gray-500')
  })

  it('rounds a clean half-decimal subtraction (100.5, 50.25) without trailing junk', () => {
    const r = formatExposureDelta(100.5, 50.25)
    expect(r.deltaSigned).toBe('−$50.25')
    expect(r.deltaClass).toBe('text-red-300')
  })

  it('uses thousands separators on large exposures', () => {
    const r = formatExposureDelta(12500, 12450)
    expect(r.display).toBe('$12,500.00 → $12,450.00')
    expect(r.deltaSigned).toBe('−$50.00')
  })

  it('never leaks more than 2 digits past the decimal point in any output field', () => {
    const samples: Array<[number, number]> = [
      [1480.22, 1438.04],
      [223.1, 242.02],
      [104.5, 95.46],
      [1454.71, 1480.22],
      [55.1, 55.1],
      [100.5, 50.25],
    ]
    const noisyDecimal = /\.\d{3,}/
    for (const [b, a] of samples) {
      const r = formatExposureDelta(b, a)
      expect(r.display, `display for (${b}, ${a})`).not.toMatch(noisyDecimal)
      expect(r.deltaSigned, `deltaSigned for (${b}, ${a})`).not.toMatch(noisyDecimal)
    }
  })
})
