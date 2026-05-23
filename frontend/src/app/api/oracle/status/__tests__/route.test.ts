import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { GET, redactUpstreamReason } from '../route'

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
    expect(data.upstreams.priceService).toEqual({ status: 'ok' })
    expect(data.upstreams.oracleSigner).toEqual({ status: 'ok' })
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
    expect(data.upstreams.priceService).toEqual({ status: 'ok' })
    expect(data.upstreams.oracleSigner.status).toBe('down')
    expect(data.upstreams.oracleSigner.reason).toContain('ECONNREFUSED')
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
    expect(data.upstreams.priceService.status).toBe('down')
    expect(data.upstreams.priceService.reason).toContain('ECONNREFUSED')
    expect(data.upstreams.oracleSigner).toEqual({ status: 'ok' })
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

  it('503 body surfaces the failing-upstream reason for each rail', async () => {
    fetchMockTwo({
      '/status/quotes': () => { throw new Error('fetch failed: ECONNREFUSED 127.0.0.1:9300') },
      '/proof':         () => new Response('bad gateway', { status: 502 }),
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.upstreams.priceService.status).toBe('down')
    expect(data.upstreams.priceService.reason).toContain('ECONNREFUSED')
    expect(data.upstreams.oracleSigner.status).toBe('down')
    expect(data.upstreams.oracleSigner.reason).toMatch(/returned 502/)
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
    expect(data.upstreams.priceService.status).toBe('down')
    expect(data.upstreams.priceService.reason).toMatch(/returned 502/)
    expect(data.upstreams.oracleSigner).toEqual({ status: 'ok' })
  })
})

describe('GET /api/oracle/status — ingest counters', () => {
  it('forwards ingest counters from upstream proof when present', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify({
        ...proofBody,
        ingest: {
          accepted: 4221, droppedJsonParse: 1, droppedShape: 0,
          droppedInvalidMid: 2, droppedMissingSymbol: 0,
          lastDroppedAtMs: 1700000005000,
          lastDroppedReason: 'SyntaxError: Unexpected token',
          lastDroppedSnippet: 'not-json',
        },
      }), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.ingest.accepted).toBe(4221)
    expect(data.ingest.droppedJsonParse).toBe(1)
    expect(data.ingest.droppedInvalidMid).toBe(2)
    expect(data.ingest.lastDroppedReason).toBe('SyntaxError: Unexpected token')
    expect(data.ingest.lastDroppedSnippet).toBe('not-json')
  })

  it('defaults ingest counters to zero when upstream omits them (older signer)', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify(proofBody), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.ingest).toEqual({
      accepted: 0, droppedJsonParse: 0, droppedShape: 0,
      droppedInvalidMid: 0, droppedMissingSymbol: 0,
    })
  })

  it('503 body includes a zero-ingest object so consumers can read it unconditionally', async () => {
    fetchMockTwo({
      '/status/quotes': () => { throw new Error('ECONNREFUSED') },
      '/proof':         () => { throw new Error('ECONNREFUSED') },
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.ingest).toBeDefined()
    expect(data.ingest.accepted).toBe(0)
    expect(data.ingest.droppedJsonParse).toBe(0)
  })
})

describe('GET /api/oracle/status — failures + counts', () => {
  it('forwards failures and counts from upstream proof when present', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify({
        ...proofBody,
        failures: {
          stocks: [{
            rail: 'stocks',
            reason: 'execution reverted: deviation too high',
            errorClass: 'CALL_EXCEPTION',
            symbols: ['AAPL'],
            attemptedAtMs: 1700000003000,
          }],
          crypto: [],
        },
        counts: {
          stocks: { ok: 412, failed: 3 },
          crypto: { ok: 117, failed: 0 },
        },
      }), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.failures.stocks).toHaveLength(1)
    expect(data.failures.stocks[0].errorClass).toBe('CALL_EXCEPTION')
    expect(data.failures.stocks[0].reason).toContain('deviation too high')
    expect(data.counts.stocks).toEqual({ ok: 412, failed: 3 })
    expect(data.counts.crypto).toEqual({ ok: 117, failed: 0 })
  })

  it('defaults failures and counts to empty/zero when upstream omits them (older signer)', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify(proofBody), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.failures).toEqual({ stocks: [], crypto: [] })
    expect(data.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    })
  })

  it('503 body includes empty failures + zero counts so consumers can read them unconditionally', async () => {
    fetchMockTwo({
      '/status/quotes': () => { throw new Error('ECONNREFUSED') },
      '/proof':         () => { throw new Error('ECONNREFUSED') },
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.failures).toEqual({ stocks: [], crypto: [] })
    expect(data.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    })
  })

  it('treats malformed upstream failures/counts as zero defaults', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify({
        ...proofBody,
        failures: 'oops not an object',
        counts: { stocks: 'oops', crypto: null },
      }), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.failures).toEqual({ stocks: [], crypto: [] })
    expect(data.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    })
  })
})

describe('GET /api/oracle/status — per-rail status', () => {
  it('forwards rails block from upstream proof when present', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify({
        ...proofBody,
        rails: {
          stocks: {
            enabled: true,
            lastSuccessAtMs: 1700000000000,
            lastSuccessAgeMs: 1203,
            lastFailureAtMs: null,
            lastFailureAgeMs: null,
          },
          crypto: {
            enabled: false,
            lastSuccessAtMs: null,
            lastSuccessAgeMs: null,
            lastFailureAtMs: null,
            lastFailureAgeMs: null,
          },
        },
      }), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.rails.stocks).toEqual({
      enabled: true,
      lastSuccessAtMs: 1700000000000,
      lastSuccessAgeMs: 1203,
      lastFailureAtMs: null,
      lastFailureAgeMs: null,
    })
    expect(data.rails.crypto.enabled).toBe(false)
    expect(data.rails.crypto.lastSuccessAtMs).toBeNull()
  })

  it('defaults rails to disabled+null when upstream omits the block (older signer)', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify(proofBody), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.rails).toEqual({
      stocks: {
        enabled: false,
        lastSuccessAtMs: null,
        lastSuccessAgeMs: null,
        lastFailureAtMs: null,
        lastFailureAgeMs: null,
      },
      crypto: {
        enabled: false,
        lastSuccessAtMs: null,
        lastSuccessAgeMs: null,
        lastFailureAtMs: null,
        lastFailureAgeMs: null,
      },
    })
  })

  it('503 body includes rails defaults so consumers can read them unconditionally', async () => {
    fetchMockTwo({
      '/status/quotes': () => { throw new Error('ECONNREFUSED') },
      '/proof':         () => { throw new Error('ECONNREFUSED') },
    })

    const res = await GET(stubReq)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.rails).toBeDefined()
    expect(data.rails.stocks.enabled).toBe(false)
    expect(data.rails.crypto.enabled).toBe(false)
    expect(data.rails.stocks.lastSuccessAtMs).toBeNull()
  })

  it('coerces malformed upstream rail status to defaults', async () => {
    fetchMockTwo({
      '/status/quotes': () => new Response(JSON.stringify(quotesBody), { status: 200 }),
      '/proof':         () => new Response(JSON.stringify({
        ...proofBody,
        rails: { stocks: 'oops', crypto: { enabled: 'not-a-bool' } },
      }), { status: 200 }),
    })

    const res = await GET(stubReq)
    const data = await res.json()
    expect(data.rails.stocks.enabled).toBe(false)
    expect(data.rails.stocks.lastSuccessAtMs).toBeNull()
    expect(data.rails.crypto.enabled).toBe(false)
  })
})

describe('redactUpstreamReason', () => {
  it('strips long hex sequences (signer keys, addresses)', () => {
    const r = redactUpstreamReason(
      new Error('rpc error using key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 — bad'),
    )
    expect(r).not.toContain('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
    expect(r).toContain('<redacted-hex>')
  })

  it('collapses newlines into spaces', () => {
    const r = redactUpstreamReason(new Error('first line\nsecond line\r\nthird'))
    expect(r).not.toContain('\n')
    expect(r).not.toContain('\r')
    expect(r).toContain('first line second line third')
  })

  it('clamps length to <=200 chars', () => {
    const long = 'x'.repeat(1000)
    const r = redactUpstreamReason(new Error(long))
    expect(r.length).toBeLessThanOrEqual(200)
  })

  it('handles non-Error throws (string)', () => {
    expect(redactUpstreamReason('plain string failure')).toBe('plain string failure')
  })

  it('prefers err.cause.code prefix when present (undici fetch failure pattern)', () => {
    const err = new Error('fetch failed')
    ;(err as { cause?: { code?: string } }).cause = { code: 'ECONNREFUSED' }
    expect(redactUpstreamReason(err)).toBe('ECONNREFUSED: fetch failed')
  })
})
