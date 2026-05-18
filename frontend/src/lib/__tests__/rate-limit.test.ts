import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getRealIp, _resetBuckets } from '../rate-limit'

describe('rate-limit (token bucket)', () => {
  beforeEach(() => {
    _resetBuckets()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    delete process.env.RATE_LIMIT_RPM
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.RATE_LIMIT_RPM
  })

  describe('checkRateLimit', () => {
    it('allows the first request from a new IP', () => {
      const result = checkRateLimit('10.0.0.1')
      expect(result.allowed).toBe(true)
      expect(result.retryAfterSeconds).toBe(0)
    })

    it('allows up to DEFAULT_RPM (60) requests then blocks', () => {
      for (let i = 0; i < 60; i++) {
        const r = checkRateLimit('10.0.0.1')
        expect(r.allowed).toBe(true)
      }
      const blocked = checkRateLimit('10.0.0.1')
      expect(blocked.allowed).toBe(false)
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    })

    it('refills tokens over time and allows requests again', () => {
      for (let i = 0; i < 60; i++) {
        checkRateLimit('10.0.0.1')
      }
      expect(checkRateLimit('10.0.0.1').allowed).toBe(false)

      // Advance 2 seconds — at 60 RPM that's 2 tokens refilled
      vi.advanceTimersByTime(2_000)

      const afterWait = checkRateLimit('10.0.0.1')
      expect(afterWait.allowed).toBe(true)
    })

    it('tracks each IP independently', () => {
      for (let i = 0; i < 60; i++) {
        checkRateLimit('10.0.0.1')
      }
      expect(checkRateLimit('10.0.0.1').allowed).toBe(false)
      expect(checkRateLimit('10.0.0.2').allowed).toBe(true)
    })

    it('respects RATE_LIMIT_RPM env var override', () => {
      process.env.RATE_LIMIT_RPM = '5'
      _resetBuckets()

      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit('10.0.0.1').allowed).toBe(true)
      }
      expect(checkRateLimit('10.0.0.1').allowed).toBe(false)
    })

    it('cleans up stale buckets after threshold', () => {
      checkRateLimit('10.0.0.1')
      checkRateLimit('10.0.0.2')

      // Advance past both cleanup interval (5 min) and stale threshold (10 min)
      vi.advanceTimersByTime(11 * 60 * 1000)

      // Trigger cleanup via a new request
      checkRateLimit('10.0.0.3')

      // The old IPs should have been cleaned; a fresh request for them should start with full tokens
      const result = checkRateLimit('10.0.0.1')
      expect(result.allowed).toBe(true)
      expect(result.retryAfterSeconds).toBe(0)
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

    it('defaults to 127.0.0.1 when request is undefined', () => {
      // Mirrors unit tests that call wrapped handlers without a real Request.
      expect(getRealIp(undefined)).toBe('127.0.0.1')
      expect(getRealIp(null)).toBe('127.0.0.1')
    })

    it('defaults to 127.0.0.1 when request has no headers', () => {
      expect(getRealIp({} as unknown as Request)).toBe('127.0.0.1')
    })
  })
})
