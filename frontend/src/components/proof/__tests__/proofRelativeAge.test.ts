import { describe, it, expect } from 'vitest'
import { formatRelativeAge } from '../proofRelativeAge'

describe('formatRelativeAge — shared proof-page age formatter (#0069, #0070)', () => {
  it('returns "just now" for ages under one second', () => {
    expect(formatRelativeAge(0)).toBe('just now')
    expect(formatRelativeAge(999)).toBe('just now')
  })

  it('returns "Ns ago" for second-bucket ages', () => {
    expect(formatRelativeAge(1_000)).toBe('1s ago')
    expect(formatRelativeAge(5_999)).toBe('5s ago')
    expect(formatRelativeAge(59_999)).toBe('59s ago')
  })

  it('returns "Nm ago" for minute-bucket ages', () => {
    expect(formatRelativeAge(60_000)).toBe('1m ago')
    expect(formatRelativeAge(150_000)).toBe('2m ago')
    expect(formatRelativeAge(3_599_999)).toBe('59m ago')
  })

  it('returns "Nh ago" for hour-bucket ages', () => {
    expect(formatRelativeAge(3_600_000)).toBe('1h ago')
    expect(formatRelativeAge(7_200_000)).toBe('2h ago')
    expect(formatRelativeAge(36 * 3_600_000)).toBe('36h ago')
  })

  it('clamps negative input to zero (clock-skew defensiveness)', () => {
    expect(formatRelativeAge(-1)).toBe('just now')
    expect(formatRelativeAge(-1_000_000)).toBe('just now')
  })
})
