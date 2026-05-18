// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  buildFeedbackPayload,
  capConsoleEntries,
  FEEDBACK_LIMITS,
  isFeedbackType,
  truncate,
  type ConsoleEntry,
  type FeedbackContextInput,
} from '../feedbackContext'

const baseCtx: FeedbackContextInput = {
  pathname: '/predict/markets/42',
  wallet: '0x' + 'a'.repeat(40),
  viewport: { w: 1280, h: 800, dpr: 2 },
  sessionId: 'sess_abc',
  buildSha: 'deadbeef',
  recentConsole: [],
}

describe('truncate', () => {
  it('returns the input unchanged when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('appends an ellipsis marker when truncated', () => {
    const result = truncate('a'.repeat(50), 20)
    expect(result.length).toBe(20)
    expect(result.endsWith('…[truncated]')).toBe(true)
  })

  it('hard-slices when max is smaller than the marker itself', () => {
    expect(truncate('a'.repeat(20), 5)).toBe('aaaaa')
  })
})

describe('capConsoleEntries', () => {
  it('keeps the most recent N entries when over the cap', () => {
    const entries: ConsoleEntry[] = Array.from({ length: 50 }, (_, i) => ({
      level: 'error',
      message: `m${i}`,
      at: `2026-01-01T00:00:${String(i).padStart(2, '0')}Z`,
    }))
    const capped = capConsoleEntries(entries)
    expect(capped).toHaveLength(FEEDBACK_LIMITS.consoleMaxEntries)
    expect(capped[0].message).toBe('m30')
    expect(capped[capped.length - 1].message).toBe('m49')
  })

  it('truncates oversized console messages per entry', () => {
    const big = 'x'.repeat(FEEDBACK_LIMITS.consoleEntryMax + 100)
    const capped = capConsoleEntries([
      { level: 'warn', message: big, at: '2026-01-01T00:00:00Z' },
    ])
    expect(capped[0].message.length).toBe(FEEDBACK_LIMITS.consoleEntryMax)
    expect(capped[0].message.endsWith('…[truncated]')).toBe(true)
  })

  it('returns a new array (does not mutate input)', () => {
    const entries: ConsoleEntry[] = [
      { level: 'error', message: 'a', at: '2026-01-01T00:00:00Z' },
    ]
    const capped = capConsoleEntries(entries)
    expect(capped).not.toBe(entries)
  })
})

describe('isFeedbackType', () => {
  it.each(['bug', 'ux', 'feature', 'other'])('accepts %s', (t) => {
    expect(isFeedbackType(t)).toBe(true)
  })

  it.each(['', 'BUG', 'feedback', null, undefined, 42, {}])('rejects %p', (t) => {
    expect(isFeedbackType(t)).toBe(false)
  })
})

describe('buildFeedbackPayload', () => {
  it('produces a payload with the supplied context preserved verbatim', () => {
    const payload = buildFeedbackPayload(
      'bug',
      'something broke',
      baseCtx,
      () => '2026-05-18T09:47:00.000Z',
    )
    expect(payload.type).toBe('bug')
    expect(payload.description).toBe('something broke')
    expect(payload.pathname).toBe('/predict/markets/42')
    expect(payload.wallet).toBe('0x' + 'a'.repeat(40))
    expect(payload.viewport).toEqual({ w: 1280, h: 800, dpr: 2 })
    expect(payload.sessionId).toBe('sess_abc')
    expect(payload.buildSha).toBe('deadbeef')
    expect(payload.timestamp).toBe('2026-05-18T09:47:00.000Z')
  })

  it('truncates descriptions longer than the cap', () => {
    const desc = 'a'.repeat(FEEDBACK_LIMITS.descriptionMax + 500)
    const payload = buildFeedbackPayload('bug', desc, baseCtx)
    expect(payload.description.length).toBe(FEEDBACK_LIMITS.descriptionMax)
    expect(payload.description.endsWith('…[truncated]')).toBe(true)
  })

  it('caps console entries to the configured max', () => {
    const entries: ConsoleEntry[] = Array.from({ length: 100 }, (_, i) => ({
      level: 'error',
      message: `err-${i}`,
      at: '2026-01-01T00:00:00Z',
    }))
    const payload = buildFeedbackPayload('bug', 'd', { ...baseCtx, recentConsole: entries })
    expect(payload.recentConsole).toHaveLength(FEEDBACK_LIMITS.consoleMaxEntries)
  })

  it('preserves a null wallet for disconnected users', () => {
    const payload = buildFeedbackPayload('bug', 'd', { ...baseCtx, wallet: null })
    expect(payload.wallet).toBeNull()
  })

  it('never embeds a full URL with query/hash — only the pathname caller supplied', () => {
    // Caller is responsible for stripping query/hash; the builder must not
    // accept any other field that could leak it. Asserting via the public
    // surface: the payload type has no `url` field, only `pathname`.
    const payload = buildFeedbackPayload('bug', 'd', {
      ...baseCtx,
      pathname: '/portfolio',
    })
    expect(payload.pathname).toBe('/portfolio')
    expect('url' in payload).toBe(false)
    expect('search' in payload).toBe(false)
    expect('hash' in payload).toBe(false)
  })
})
