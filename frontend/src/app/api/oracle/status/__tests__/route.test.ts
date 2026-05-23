import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { GET } from '../route'

// Vitest tests don't need a real NextRequest — the handler only checks rate
// limit headers via getRealIp(). A bare-bones stub typechecks and satisfies
// the wrapper.
const stubReq = new Request('http://localhost/api/oracle/status') as unknown as NextRequest

beforeEach(() => {
  vi.restoreAllMocks()
})

const quotesBody = {
  healthy: true,
  freshCount: 5,
  totalCount: 5,
  quotes: [{ symbol: 'AAPL', lastUpdateMs: 1200, sessionState: 'open', confidence: 92 }],
  timestamp: 1710000000000,
}

const proofBody = {
  generatedAt: 1710000001000,
  stocks: [{
    rail: 'stocks', txHash: '0xS1', blockNumber: 100, gasUsed: '150000',
    symbols: ['AAPL'], roundTripMs: 80, submittedAtMs: 1700000000000, mids: { AAPL: 191.5 },
  }],
  crypto: [{
    rail: 'crypto', txHash: '0xC1', blockNumber: 101, gasUsed: '120000',
    symbols: ['WETH'], roundTripMs: 60, submittedAtMs: 1700000001000, mids: { WETH: 3500 },
  }],
}

function fetchMockTwo(handlerByUrl: Record<string, () => Response | Promise<Response>>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    for (const key of Object.keys(handlerByUrl)) {
      if (url.includes(key)) {
        return handlerByUrl[key]()
      }
    }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

describe('GET /api/oracle/status — merged response', () => {
  it('returns merged payload when both upstreams are healthy', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify(proofBody),  { status: 200 }),
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.healthy).toBe(true)
    expect(data.degraded).toBe(false)
    expect(data.quotes).toHaveLength(1)
    expect(data.proof.stocks[0].txHash).toBe('0xS1')
    expect(data.proof.crypto[0].txHash).toBe('0xC1')
    expect(data.upstreams.priceService).toBe('ok')
    expect(data.upstreams.oracleSigner).toBe('ok')
  })

  it('degrades when only price-service is reachable; proof is empty', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => { throw new Error('ECONNREFUSED') },
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.degraded).toBe(true)
    expect(data.quotes).toHaveLength(1)
    expect(data.proof.stocks).toEqual([])
    expect(data.proof.crypto).toEqual([])
    expect(data.upstreams.priceService).toBe('ok')
    expect(data.upstreams.oracleSigner).toBe('down')
  })

  it('degrades when only oracle-signer is reachable; quotes are empty', async () => {
    fetchMockTwo({
      '/status/quotes': () => { throw new Error('ECONNREFUSED') },
      '/proof':         () => new Response(JSON.stringify(proofBody), { status: 200 }),
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.degraded).toBe(true)
    expect(data.quotes).toEqual([])
    expect(data.proof.stocks).toHaveLength(1)
    expect(data.upstreams.priceService).toBe('down')
    expect(data.upstreams.oracleSigner).toBe('ok')
  })

  it('returns 503 only when BOTH upstreams are down', async () => {
    fetchMockTwo({
      '/status/quotes': () => { throw new Error('ECONNREFUSED') },
      '/proof':         () => { throw new Error('ECONNREFUSED') },
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.healthy).toBe(false)
    expect(data.degraded).toBe(true)
    expect(Array.isArray(data.quotes)).toBe(true)
    expect(data.proof.stocks).toEqual([])
    expect(data.proof.crypto).toEqual([])
  })

  it('treats non-OK upstream response as down (not as data)', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response('bad gateway', { status: 502 }),
      '/proof':         () => new Response(JSON.stringify(proofBody), { status: 200 }),
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.degraded).toBe(true)
    expect(data.upstreams.priceService).toBe('down')
    expect(data.upstreams.oracleSigner).toBe('ok')
  })
})
