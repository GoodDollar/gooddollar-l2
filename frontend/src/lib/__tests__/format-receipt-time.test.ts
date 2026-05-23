import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  formatClockTimeUtc,
  formatIsoTitle,
  formatRelativeTime,
} from '../format-receipt-time'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T19:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats seconds-ago for input < 60s', () => {
    expect(formatRelativeTime(Date.now() - 51_000)).toBe('51s ago')
  })
  it('formats minutes-ago for input < 1h', () => {
    expect(formatRelativeTime(Date.now() - 12 * 60_000)).toBe('12m ago')
  })
  it('formats hours-ago for input < 1d', () => {
    expect(formatRelativeTime(Date.now() - 5 * 3600_000)).toBe('5h ago')
  })
  it('formats days-ago for input >= 1d', () => {
    expect(formatRelativeTime(Date.now() - 3 * 86_400_000)).toBe('3d ago')
  })
  it('returns em-dash placeholder for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('—')
  })
  it('returns em-dash placeholder for 0 timestamp', () => {
    expect(formatRelativeTime(0)).toBe('—')
  })
  it('returns em-dash placeholder for NaN', () => {
    expect(formatRelativeTime(Number.NaN)).toBe('—')
  })
})

describe('formatClockTimeUtc', () => {
  it('returns a "HH:MM:SS UTC" string for a finite positive timestamp', () => {
    const ms = Date.UTC(2026, 4, 23, 14, 32, 18, 237)
    expect(formatClockTimeUtc(ms)).toMatch(/^\d{2}:\d{2}:\d{2} UTC$/)
    expect(formatClockTimeUtc(ms)).toBe('14:32:18 UTC')
  })

  it('returns an empty string for undefined', () => {
    expect(formatClockTimeUtc(undefined)).toBe('')
  })

  it('returns an empty string for NaN', () => {
    expect(formatClockTimeUtc(Number.NaN)).toBe('')
  })

  it('returns an empty string for Infinity', () => {
    expect(formatClockTimeUtc(Number.POSITIVE_INFINITY)).toBe('')
  })

  it('returns an empty string for 0 (treated as missing)', () => {
    expect(formatClockTimeUtc(0)).toBe('')
  })
})

describe('formatIsoTitle', () => {
  it('returns the full ISO with date + ms for a finite timestamp', () => {
    const ms = Date.UTC(2026, 4, 23, 14, 32, 18, 237)
    expect(formatIsoTitle(ms)).toBe('2026-05-23T14:32:18.237Z')
  })

  it('returns undefined for undefined input so React omits the title attribute', () => {
    expect(formatIsoTitle(undefined)).toBeUndefined()
  })

  it('returns undefined for NaN', () => {
    expect(formatIsoTitle(Number.NaN)).toBeUndefined()
  })

  it('returns undefined for 0 (treated as missing)', () => {
    expect(formatIsoTitle(0)).toBeUndefined()
  })
})
