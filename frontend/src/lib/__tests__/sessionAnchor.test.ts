import { describe, it, expect } from 'vitest'

import { formatSessionAsOf, lastSessionAnchorMs } from '../sessionAnchor'

// 2026-05-22 is a Friday. 2026-05-23 is Saturday. Anchor both relative to
// New_York EDT (UTC−4 in May).
const FRIDAY_2200_UTC = Date.UTC(2026, 4, 22, 22, 0)   // 18:00 EDT
const SATURDAY_1200_UTC = Date.UTC(2026, 4, 23, 12, 0) // 08:00 EDT
const FRIDAY_2030_UTC = Date.UTC(2026, 4, 22, 20, 30)  // 16:30 EDT (after close)

describe('lastSessionAnchorMs', () => {
  it('returns null for the open session', () => {
    expect(lastSessionAnchorMs('open', FRIDAY_2200_UTC)).toBeNull()
  })

  it('returns null for the unknown session', () => {
    expect(lastSessionAnchorMs('unknown', FRIDAY_2200_UTC)).toBeNull()
  })

  it('returns null for the halted session (no honest synthesis available)', () => {
    expect(lastSessionAnchorMs('halted', FRIDAY_2200_UTC)).toBeNull()
  })

  it('returns the previous-weekday 16:00 ET anchor when closed on a weekend', () => {
    const anchor = lastSessionAnchorMs('closed', SATURDAY_1200_UTC)
    expect(anchor).not.toBeNull()
    // 16:00 EDT on 2026-05-22 = 20:00 UTC.
    expect(anchor).toBe(Date.UTC(2026, 4, 22, 20, 0))
  })

  it('returns today’s 16:00 ET anchor for after-hours', () => {
    const anchor = lastSessionAnchorMs('after-hours', FRIDAY_2200_UTC)
    expect(anchor).toBe(Date.UTC(2026, 4, 22, 20, 0))
  })

  it('returns today’s 04:00 ET anchor for pre-market', () => {
    // Friday 06:00 UTC = 02:00 EDT → still before today's pre-market open.
    const friday0600 = Date.UTC(2026, 4, 22, 6, 0)
    const anchor = lastSessionAnchorMs('pre-market', friday0600)
    expect(anchor).toBe(Date.UTC(2026, 4, 22, 8, 0))
  })

  it('returns the most-recent weekday close when closed after Friday close', () => {
    // Friday 16:30 EDT — already after today’s close, so anchor is today.
    const anchor = lastSessionAnchorMs('closed', FRIDAY_2030_UTC)
    expect(anchor).toBe(Date.UTC(2026, 4, 22, 20, 0))
  })
})

describe('formatSessionAsOf', () => {
  it('formats closed sessions with "At close · …"', () => {
    const out = formatSessionAsOf('closed', Date.UTC(2026, 4, 22, 20, 0))
    expect(out).toMatch(/^At close · /)
    expect(out).toMatch(/May 22/)
    expect(out).toMatch(/\bEDT\b/)
  })

  it('formats after-hours sessions with "After hours since …"', () => {
    const out = formatSessionAsOf('after-hours', Date.UTC(2026, 4, 22, 20, 0))
    expect(out).toMatch(/^After hours since /)
    expect(out).toMatch(/\bEDT\b/)
  })

  it('formats pre-market sessions with "Pre-market since …"', () => {
    const out = formatSessionAsOf('pre-market', Date.UTC(2026, 4, 22, 8, 0))
    expect(out).toMatch(/^Pre-market since /)
  })

  it('formats halted sessions with "Halted since …"', () => {
    const out = formatSessionAsOf('halted', Date.UTC(2026, 4, 22, 18, 32))
    expect(out).toMatch(/^Halted since /)
  })

  it('returns null for the open session and unknown sessions', () => {
    expect(formatSessionAsOf('open', Date.now())).toBeNull()
    expect(formatSessionAsOf('unknown', Date.now())).toBeNull()
  })
})
