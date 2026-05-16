import { describe, it, expect } from 'vitest'

import {
  boundPerpsSize,
  MAX_PERPS_SIZE_INT_DIGITS,
  MAX_PERPS_SIZE_DEC_DIGITS,
} from '../perpsInput'

describe('boundPerpsSize', () => {
  it('strips non-numeric characters', () => {
    expect(boundPerpsSize('1,000abc')).toBe('1000')
    expect(boundPerpsSize('$1.50')).toBe('1.50')
    expect(boundPerpsSize('123e9')).toBe('1239')
  })

  it('collapses multiple decimal points to one', () => {
    expect(boundPerpsSize('1.2.3')).toBe('1.23')
    expect(boundPerpsSize('1.2.3.4.5')).toBe('1.2345')
  })

  it('caps the integer part at 18 digits', () => {
    const huge = '9'.repeat(50)
    const out = boundPerpsSize(huge)
    expect(out.length).toBe(MAX_PERPS_SIZE_INT_DIGITS)
    expect(out).toBe('9'.repeat(MAX_PERPS_SIZE_INT_DIGITS))
  })

  it('caps the integer part even when a decimal follows', () => {
    const huge = `${'9'.repeat(50)}.5`
    const out = boundPerpsSize(huge)
    const [intPart, decPart] = out.split('.')
    expect(intPart).toBe('9'.repeat(MAX_PERPS_SIZE_INT_DIGITS))
    expect(decPart).toBe('5')
  })

  it('caps the decimal part at 8 digits', () => {
    expect(boundPerpsSize('0.123456789012')).toBe('0.12345678')
    expect(boundPerpsSize('0.' + '1'.repeat(MAX_PERPS_SIZE_DEC_DIGITS + 10)))
      .toBe('0.' + '1'.repeat(MAX_PERPS_SIZE_DEC_DIGITS))
  })

  it('preserves a normal small trade value byte-for-byte', () => {
    expect(boundPerpsSize('0.5')).toBe('0.5')
    expect(boundPerpsSize('1.25')).toBe('1.25')
    expect(boundPerpsSize('100')).toBe('100')
  })

  it('returns empty string for empty input', () => {
    expect(boundPerpsSize('')).toBe('')
  })

  it('preserves a lone decimal point so users can keep typing', () => {
    expect(boundPerpsSize('.')).toBe('.')
    expect(boundPerpsSize('0.')).toBe('0.')
  })

  it('handles purely garbage input gracefully', () => {
    expect(boundPerpsSize('abc')).toBe('')
    expect(boundPerpsSize('!@#$%')).toBe('')
  })
})
