import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getRealIp, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, _resetRateLimitStore } from '../rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    _resetRateLimitStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('allows the first request and reports remaining = MAX - 1', () => {
      const result = checkRateLimit('1.2.3.4')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(RATE_LIMIT_MAX - 1)
      expect(result.resetAt).toBe(Date.now() + RATE_LIMIT_WINDOW_MS)
    })

    it('decrements remaining on each subsequent request within the window', () => {
      checkRateLimit('1.2.3.4')
      const second = checkRateLimit('1.2.3.4')
      expect(second.allowed).toBe(true)
      expect(second.remaining).toBe(RATE_LIMIT_MAX - 2)
    })

    it('blocks once the IP exceeds RATE_LIMIT_MAX in a window', () => {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        const r = checkRateLimit('1.2.3.4')
        expect(r.allowed).toBe(true)
      }
      const blocked = checkRateLimit('1.2.3.4')
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
      expect(blocked.resetAt).toBeGreaterThan(Date.now())
    })

    it('resets the window after RATE_LIMIT_WINDOW_MS has elapsed', () => {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('1.2.3.4')
      expect(checkRateLimit('1.2.3.4').allowed).toBe(false)

      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1)

      const afterReset = checkRateLimit('1.2.3.4')
      expect(afterReset.allowed).toBe(true)
      expect(afterReset.remaining).toBe(RATE_LIMIT_MAX - 1)
    })

    it('tracks each IP independently', () => {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('1.2.3.4')
      expect(checkRateLimit('1.2.3.4').allowed).toBe(false)
      expect(checkRateLimit('5.6.7.8').allowed).toBe(true)
    })
  })

  describe('getRealIp', () => {
    function makeReq(headers: Record<string, string>) {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
      } as unknown as Request
    }

    it('prefers x-real-ip', () => {
      const ip = getRealIp(makeReq({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))
      expect(ip).toBe('1.1.1.1')
    })

    it('falls back to first entry of x-forwarded-for', () => {
      const ip = getRealIp(makeReq({ 'x-forwarded-for': '3.3.3.3, 4.4.4.4' }))
      expect(ip).toBe('3.3.3.3')
    })

    it('trims whitespace in x-forwarded-for', () => {
      const ip = getRealIp(makeReq({ 'x-forwarded-for': '  5.5.5.5  , 6.6.6.6' }))
      expect(ip).toBe('5.5.5.5')
    })

    it('defaults to 127.0.0.1 when no headers present', () => {
      const ip = getRealIp(makeReq({}))
      expect(ip).toBe('127.0.0.1')
    })
  })
})
