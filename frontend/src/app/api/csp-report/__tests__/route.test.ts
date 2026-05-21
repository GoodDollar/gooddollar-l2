import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST } from '../route'

function makeRequest(body: unknown, contentType = 'application/csp-report') {
  return new Request('http://localhost/api/csp-report', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('POST /api/csp-report', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 204 for a valid legacy csp-report payload', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await POST(
      makeRequest({
        'csp-report': {
          'blocked-uri': 'https://evil.example',
          'violated-directive': 'script-src',
          'document-uri': 'https://goodswap.goodclaw.org/',
        },
      }),
    )

    expect(res.status).toBe(204)
    expect(spy).toHaveBeenCalledOnce()

    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.type).toBe('csp-violation')
    expect(logged.blockedUri).toBe('https://evil.example')
    expect(logged.violatedDirective).toBe('script-src')
  })

  it('handles Reporting API v1 array format', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await POST(
      makeRequest(
        [
          {
            type: 'csp-violation',
            body: {
              blockedURL: 'https://bad.example/script.js',
              effectiveDirective: 'script-src-elem',
              documentURL: 'https://goodswap.goodclaw.org/swap',
            },
          },
        ],
        'application/reports+json',
      ),
    )

    expect(res.status).toBe(204)
    expect(spy).toHaveBeenCalledOnce()

    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.blockedUri).toBe('https://bad.example/script.js')
    expect(logged.violatedDirective).toBe('script-src-elem')
  })

  it('returns 204 even for malformed body', async () => {
    const res = await POST(
      new Request('http://localhost/api/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/csp-report' },
        body: 'not json',
      }) as unknown as NextRequest,
    )

    expect(res.status).toBe(204)
  })

  it('returns 204 for empty object (logs with undefined fields)', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(204)
    expect(spy).toHaveBeenCalledOnce()

    const logged = JSON.parse(spy.mock.calls[0][0] as string)
    expect(logged.type).toBe('csp-violation')
    expect(logged.blockedUri).toBeUndefined()
  })
})
