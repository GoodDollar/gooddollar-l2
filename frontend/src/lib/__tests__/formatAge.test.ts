import { describe, it, expect } from 'vitest'
import { formatAge } from '@/lib/formatAge'

describe('formatAge', () => {
  it('reports "just now" under 1s', () => {
    expect(formatAge(0)).toBe('just now')
    expect(formatAge(999)).toBe('just now')
  })
  it('reports seconds under a minute', () => {
    expect(formatAge(1000)).toBe('1s ago')
    expect(formatAge(45_000)).toBe('45s ago')
  })
  it('reports minutes under an hour', () => {
    expect(formatAge(60_000)).toBe('1m ago')
    expect(formatAge(59 * 60_000)).toBe('59m ago')
  })
  it('reports hours after an hour', () => {
    expect(formatAge(3_600_000)).toBe('1h ago')
    expect(formatAge(5 * 3_600_000)).toBe('5h ago')
  })
})
