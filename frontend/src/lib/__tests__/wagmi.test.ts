import { describe, it, expect } from 'vitest'
import { validateWcProjectId } from '../wagmi-helpers'

describe('validateWcProjectId', () => {
  it('returns empty string for undefined', () => {
    expect(validateWcProjectId(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(validateWcProjectId(null)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(validateWcProjectId('')).toBe('')
  })

  it('returns empty string for known placeholder "goodswap-dev"', () => {
    expect(validateWcProjectId('goodswap-dev')).toBe('')
  })

  it('returns empty string for too-short strings', () => {
    expect(validateWcProjectId('abc123')).toBe('')
  })

  it('returns empty string for 31-char hex (off by one)', () => {
    expect(validateWcProjectId('0123456789abcdef0123456789abcde')).toBe('')
  })

  it('returns empty string for 33-char hex (off by one)', () => {
    expect(validateWcProjectId('0123456789abcdef0123456789abcdef0')).toBe('')
  })

  it('returns empty string for 32 chars with non-hex characters', () => {
    expect(validateWcProjectId('0123456789abcdef0123456789abcdez')).toBe('')
  })

  it('returns empty string for 32 chars containing dashes (UUID shape)', () => {
    // 32 visible chars but includes dashes → not pure hex
    expect(validateWcProjectId('01234567-89ab-cdef-0123-456789abcd')).toBe('')
  })

  it('returns the input unchanged for a valid 32-char lowercase hex ID', () => {
    const id = '0123456789abcdef0123456789abcdef'
    expect(validateWcProjectId(id)).toBe(id)
  })

  it('returns the input unchanged for a valid 32-char uppercase hex ID', () => {
    const id = '0123456789ABCDEF0123456789ABCDEF'
    expect(validateWcProjectId(id)).toBe(id)
  })

  it('returns the input unchanged for a valid 32-char mixed-case hex ID', () => {
    const id = '0123456789AbCdEf0123456789aBcDeF'
    expect(validateWcProjectId(id)).toBe(id)
  })
})
