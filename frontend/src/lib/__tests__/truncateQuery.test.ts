import { describe, it, expect } from 'vitest'
import { truncateQuery } from '../truncateQuery'

describe('truncateQuery', () => {
  it('returns short queries unchanged (well under the cap)', () => {
    expect(truncateQuery('AAPL')).toBe('AAPL')
    expect(truncateQuery('hello')).toBe('hello')
  })

  it('returns the query unchanged when the length matches the cap exactly (24 chars)', () => {
    const exact = 'A'.repeat(24)
    expect(truncateQuery(exact)).toBe(exact)
  })

  it('truncates when the query is one character over the cap (25 chars)', () => {
    const overByOne = 'A'.repeat(25)
    expect(truncateQuery(overByOne)).toBe('A'.repeat(24) + '…')
    expect(truncateQuery(overByOne).length).toBe(25)
  })

  it('truncates a 128-character `Z` run to 24 chars plus the ellipsis glyph', () => {
    const longRun = 'Z'.repeat(128)
    expect(truncateQuery(longRun)).toBe('ZZZZZZZZZZZZZZZZZZZZZZZZ…')
  })

  it('preserves HTML-like input literally — escaping is the React layer concern', () => {
    expect(truncateQuery('<script>alert(1)</script>')).toBe('<script>alert(1)</script…')
  })

  it('respects an explicit `max` argument', () => {
    expect(truncateQuery('hello world', 5)).toBe('hello…')
    expect(truncateQuery('hi', 5)).toBe('hi')
  })

  it('returns an empty string for non-string inputs (defensive)', () => {
    expect(truncateQuery(undefined as unknown as string)).toBe('')
    expect(truncateQuery(null as unknown as string)).toBe('')
  })
})
