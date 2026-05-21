import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_STATUS = {
  overall: 'degraded',
  healthy: 3,
  total: 12,
  aggregatorUptime: 120,
  timestamp: '2026-05-17T00:00:00.000Z',
  services: [
    { name: 'swap-oracle', status: 'ok', latencyMs: 5, lastChecked: '2026-05-17T00:00:00.000Z' },
    { name: 'indexer', status: 'unreachable', latencyMs: 2, error: 'fetch failed', lastChecked: '2026-05-17T00:00:00.000Z' },
  ],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

function makeRequest(): NextRequest {
  return new Request('http://localhost/api/status') as unknown as NextRequest
}

describe('GET /api/status', () => {
  it('returns aggregated status when aggregator is reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_STATUS), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.overall).toBe('degraded')
    expect(data.healthy).toBe(3)
    expect(data.services).toHaveLength(2)
  })

  it('returns 502 when aggregator returns non-OK status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    )

    const res = await GET(makeRequest())
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain('error')
  })

  it('returns 503 when aggregator is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toContain('unreachable')
    expect(data.overall).toBe('unknown')
  })
})
