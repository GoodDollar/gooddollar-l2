import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { __resetRebalanceStatusCacheForTests } from '@/lib/rebalanceStatusCache'
import { GET } from '../route'

const originalRateLimit = process.env.RATE_LIMIT_ENABLED
const originalCacheMs = process.env.STATUS_AGGREGATOR_CACHE_MS

function mockUpstream(payload: unknown, opts: { status?: number; delayMs?: number } = {}) {
  const { status = 200, delayMs = 0 } = opts
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs))
    return new Response(JSON.stringify(payload), { status })
  })
  return spy
}

function request(symbols?: string): NextRequest {
  const path = symbols
    ? `http://localhost/api/stocks/rebalance-status?symbols=${symbols}`
    : 'http://localhost/api/stocks/rebalance-status'
  return new NextRequest(path)
}

const aggregatorPayload = {
  blockNumber: 100,
  stocksRebalance: { currentBlock: 100, symbols: {} },
}

describe('/api/stocks/rebalance-status — cache wiring', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_ENABLED = 'false'
    __resetRebalanceStatusCacheForTests()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalRateLimit === undefined) delete process.env.RATE_LIMIT_ENABLED
    else process.env.RATE_LIMIT_ENABLED = originalRateLimit
    if (originalCacheMs === undefined) delete process.env.STATUS_AGGREGATOR_CACHE_MS
    else process.env.STATUS_AGGREGATOR_CACHE_MS = originalCacheMs
  })

  it('collapses concurrent client requests for the same symbols into one upstream fetch', async () => {
    const spy = mockUpstream(aggregatorPayload, { delayMs: 20 })
    const responses = await Promise.all([
      GET(request('AAPL')),
      GET(request('AAPL')),
      GET(request('AAPL')),
      GET(request('AAPL')),
      GET(request('AAPL')),
    ])
    expect(spy).toHaveBeenCalledTimes(1)
    for (const res of responses) {
      expect(res.status).toBe(200)
    }
  })

  it('fetches upstream once per unique symbol set within the TTL', async () => {
    const spy = mockUpstream(aggregatorPayload)
    await GET(request('AAPL'))
    await GET(request('AAPL'))
    await GET(request('AAPL,MSFT'))
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('does not poison cache when upstream fails — next call retries', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
      .mockImplementationOnce(async () => new Response('boom', { status: 500 }))
      .mockImplementationOnce(async () => new Response(JSON.stringify(aggregatorPayload), { status: 200 }))

    const first = await GET(request('AAPL'))
    expect(first.status).toBe(502)
    const second = await GET(request('AAPL'))
    expect(second.status).toBe(200)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('preserves Cache-Control: no-store on the client-facing response', async () => {
    mockUpstream(aggregatorPayload)
    const res = await GET(request('AAPL'))
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })
})
