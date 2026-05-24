import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '../route'

const dummyReq = new NextRequest('http://localhost/api/analytics/overview')

// The address-book loader reads from disk; mock fs so the handler can run
// without depending on the committed analytics/address-book.json.
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: vi.fn(),
    },
  }
})

const { promises: fsPromises } = await import('fs')

const MOCK_ADDRESS_BOOK = JSON.stringify({
  version: 'v0',
  generated_at: '2026-01-01T00:00:00Z',
  protocols: { swap: { label: 'GoodSwap', contracts: [] } },
  fee_routes: [],
  notes: { fee_split_bps: { protocol: 7000, ubi: 3000 }, specialised_splitters_pending: [] },
})

// Mock the four URL surfaces — the test asserts that adding the two new
// lane-1 fetchers does not break the existing three sub-sources.
function urlMatchesPriceHealth(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input.toString()
  return url.includes(':9300/health')
}
function urlMatchesPriceQuotes(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input.toString()
  return url.includes(':9300/status/quotes')
}
function urlMatchesSignerHealth(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input.toString()
  return url.includes(':9107/health')
}
function urlMatchesStatus(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input.toString()
  return url.includes(':9200/status.json')
}
function urlMatchesIndexer(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input.toString()
  return url.includes('4200')
}

function setupFetchMock(opts: {
  priceHealth?: () => Promise<Response> | Response
  priceQuotes?: () => Promise<Response> | Response
  signerHealth?: () => Promise<Response> | Response
  status?: () => Promise<Response> | Response
  indexer?: () => Promise<Response> | Response
  chain?: () => Promise<Response> | Response
}): void {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    if (urlMatchesPriceHealth(input) && opts.priceHealth) return opts.priceHealth()
    if (urlMatchesPriceQuotes(input) && opts.priceQuotes) return opts.priceQuotes()
    if (urlMatchesSignerHealth(input) && opts.signerHealth) return opts.signerHealth()
    if (urlMatchesStatus(input) && opts.status) return opts.status()
    if (urlMatchesIndexer(input) && opts.indexer) return opts.indexer()
    if (opts.chain) return opts.chain()
    return new Response('not mocked', { status: 500 })
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.mocked(fsPromises.readFile).mockResolvedValue(MOCK_ADDRESS_BOOK)
})

describe('GET /api/analytics/overview — lane-1 price feed (task 0063)', () => {
  it('happy path: priceFeed.ok=true with mode and freshQuotes when upstream is healthy', async () => {
    setupFetchMock({
      priceHealth: () =>
        new Response(
          JSON.stringify({ status: 'ok', mode: 'mock', freshQuotes: 8, configuredSymbols: 8 }),
          { status: 200 },
        ),
      priceQuotes: () =>
        new Response(
          JSON.stringify({
            healthy: true,
            freshCount: 8,
            totalCount: 8,
            quotes: [
              { symbol: 'BTC', divergenceBps: 2 },
              { symbol: 'ETH', divergenceBps: 4 },
              { symbol: 'SOL', divergenceBps: 3 },
            ],
            timestamp: 1779589494665,
          }),
          { status: 200 },
        ),
      signerHealth: () =>
        new Response(JSON.stringify({ status: 'ok', mode: 'ok' }), { status: 200 }),
      status: () => new Response(JSON.stringify({ overall: 'healthy', services: [] }), { status: 200 }),
      indexer: () =>
        new Response(
          JSON.stringify({ ok: true, data: { lastBlock: 100, totalEvents: 5, protocols: [], topEvents: [] } }),
          { status: 200 },
        ),
      chain: () =>
        new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x64' }), { status: 200 }),
    })

    const res = await GET(dummyReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.priceFeed).toBeDefined()
    expect(body.priceFeed.ok).toBe(true)
    expect(body.priceFeed.mode).toBe('mock')
    expect(body.priceFeed.freshQuotes).toBe(8)
    expect(body.priceFeed.totalSymbols).toBe(8)
    expect(body.priceFeed.medianDivergenceBps).toBe(3)
    expect(body.oracleSubmitter).toBeDefined()
    expect(body.oracleSubmitter.ok).toBe(true)
    expect(body.oracleSubmitter.status).toBe('ok')
  })

  it('sad path: priceFeed.ok=false with error string when price-service is unreachable, other panels unaffected', async () => {
    setupFetchMock({
      priceHealth: () => Promise.reject(new Error('ECONNREFUSED')),
      priceQuotes: () => Promise.reject(new Error('ECONNREFUSED')),
      signerHealth: () =>
        new Response(
          JSON.stringify({
            status: 'degraded',
            mode: 'disabled',
            reason: 'ORACLE_SIGNER_KEY is not set; signer loop disabled',
          }),
          { status: 503 },
        ),
      status: () => new Response(JSON.stringify({ overall: 'healthy', services: [] }), { status: 200 }),
      indexer: () =>
        new Response(
          JSON.stringify({ ok: true, data: { lastBlock: 100, totalEvents: 5, protocols: [], topEvents: [] } }),
          { status: 200 },
        ),
      chain: () =>
        new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x64' }), { status: 200 }),
    })

    const res = await GET(dummyReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.priceFeed.ok).toBe(false)
    expect(typeof body.priceFeed.error).toBe('string')
    expect(body.oracleSubmitter.ok).toBe(false)
    expect(body.oracleSubmitter.status).toBe('degraded')
    expect(body.oracleSubmitter.reason).toContain('ORACLE_SIGNER_KEY')
    expect(body.status.ok).toBe(true)
    expect(body.indexer.ok).toBe(true)
    expect(body.chain.ok).toBe(true)
  })

  it('signer unreachable: oracleSubmitter.status=unreachable when signer host is down', async () => {
    setupFetchMock({
      priceHealth: () =>
        new Response(JSON.stringify({ status: 'ok', mode: 'mock' }), { status: 200 }),
      priceQuotes: () =>
        new Response(JSON.stringify({ healthy: true, freshCount: 1, totalCount: 1, quotes: [] }), {
          status: 200,
        }),
      signerHealth: () => Promise.reject(new Error('ECONNREFUSED')),
      status: () => new Response(JSON.stringify({ overall: 'healthy', services: [] }), { status: 200 }),
      indexer: () =>
        new Response(
          JSON.stringify({ ok: true, data: { lastBlock: 100, totalEvents: 5, protocols: [], topEvents: [] } }),
          { status: 200 },
        ),
      chain: () =>
        new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x64' }), { status: 200 }),
    })

    const res = await GET(dummyReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.priceFeed.ok).toBe(true)
    expect(body.oracleSubmitter.ok).toBe(false)
    expect(body.oracleSubmitter.status).toBe('unreachable')
  })
})
