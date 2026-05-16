import { describe, it, expect } from 'vitest'
import { truncateMiddle } from '../strings'

describe('truncateMiddle', () => {
  it('returns empty input unchanged', () => {
    expect(truncateMiddle('', 24)).toBe('')
  })

  it('returns short values unchanged', () => {
    expect(truncateMiddle('AAPL', 24)).toBe('AAPL')
    expect(truncateMiddle('A', 24)).toBe('A')
  })

  it('returns values exactly at the cap unchanged', () => {
    const exact = 'X'.repeat(24)
    expect(truncateMiddle(exact, 24)).toBe(exact)
  })

  it('truncates values one over the cap with a middle ellipsis', () => {
    const justOver = 'X'.repeat(25)
    const result = truncateMiddle(justOver, 24)
    expect(result).toContain('…')
    expect(result.length).toBeLessThanOrEqual(24)
    expect(result).not.toBe(justOver)
  })

  it('truncates very long values and stays within the cap', () => {
    const long = 'A'.repeat(500)
    const result = truncateMiddle(long, 24)
    expect(result.length).toBeLessThanOrEqual(24)
    expect(result).toContain('…')
    expect(result).not.toContain('A'.repeat(500))
  })

  it('keeps both head and tail content (not just the head)', () => {
    // 12 leading 'A's + ellipsis + 11 trailing 'B's would be a typical layout.
    const value = `${'A'.repeat(100)}${'B'.repeat(100)}`
    const result = truncateMiddle(value, 24)
    expect(result.startsWith('A')).toBe(true)
    expect(result.endsWith('B')).toBe(true)
    expect(result).toContain('…')
  })

  it('respects a custom max length', () => {
    const result = truncateMiddle('A'.repeat(100), 10)
    expect(result.length).toBeLessThanOrEqual(10)
    expect(result).toContain('…')
  })

  it('handles a max of 1 without throwing (degenerate but defensible)', () => {
    const result = truncateMiddle('A'.repeat(10), 1)
    // With max=1, head=0 and tail=0, so we get just the ellipsis.
    expect(result).toBe('…')
  })
})
