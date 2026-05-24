/**
 * /api/analytics/overview — `status.healthy` derivation.
 *
 * Locks the fix from task 0007d-0019: the proxy must always recount
 * `healthy` from `services[].status === 'ok'` and ignore the upstream's
 * pre-computed `data.healthy` field, which has been observed to count
 * degraded services as healthy.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Stub the address book read so the route handler reaches the status fetch.
const STUB_ADDRESS_BOOK = {
  version: 'test',
  generated_at: '2026-05-23T00:00:00Z',
  protocols: {},
  fee_routes: [],
  notes: {
    fee_split_bps: { protocol: 0, ubi: 0 },
    specialised_splitters_pending: [],
  },
}

vi.mock('fs', () => {
  const readFile = vi.fn(async () => JSON.stringify(STUB_ADDRESS_BOOK))
  return {
    promises: { readFile },
    default: { promises: { readFile } },
  }
})

import { GET } from '../route'

const dummyReq = new NextRequest('http://localhost/api/analytics/overview')

function statusResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function indexerResponse(): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      data: { lastBlock: 100, totalEvents: 0, protocols: [], topEvents: [] },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function rpcResponse(): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x64' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function dispatchFetch(statusPayload: unknown) {
  const calls = { status: 0, indexer: 0, rpc: 0 }
  return {
    calls,
    fn: async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as { url?: string }).url ?? String(input)
      if (url.includes('status')) {
        calls.status += 1
        return statusResponse(statusPayload)
      }
      if (url.includes('overview')) {
        calls.indexer += 1
        return indexerResponse()
      }
      calls.rpc += 1
      return rpcResponse()
    },
  }
}

describe('/api/analytics/overview status.healthy', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('recounts healthy from services[].status === "ok" instead of trusting upstream healthy=14', async () => {
    const SERVICES_FROM_DEVNET = [
      { name: 'swap-oracle', status: 'ok' },
      { name: 'activity-reporter', status: 'degraded' },
      { name: 'harvest-keeper', status: 'ok' },
      { name: 'liquidator', status: 'ok' },
      { name: 'revenue-tracker', status: 'ok' },
      { name: 'stocks-keeper', status: 'ok' },
      { name: 'indexer', status: 'ok' },
      { name: 'monitor', status: 'ok' },
      { name: 'rpc-balancer', status: 'ok' },
      { name: 'bridge-keeper', status: 'ok' },
      { name: 'perps', status: 'ok' },
      { name: 'predict', status: 'ok' },
      { name: 'hedge-engine', status: 'degraded' },
      { name: 'oracle-signer', status: 'degraded' },
    ]

    const dispatcher = dispatchFetch({
      overall: 'degraded',
      healthy: 14,
      total: 14,
      services: SERVICES_FROM_DEVNET,
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(dispatcher.fn)

    const res = await GET(dummyReq)
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.status.ok).toBe(true)
    expect(body.status.overall).toBe('degraded')
    expect(body.status.healthy).toBe(11)
    expect(body.status.total).toBe(14)
  })

  it('falls back to services.length total and counts ok-only when upstream omits total/healthy', async () => {
    const dispatcher = dispatchFetch({
      overall: 'healthy',
      services: [
        { name: 'a', status: 'ok' },
        { name: 'b', status: 'ok' },
        { name: 'c', status: 'ok' },
      ],
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(dispatcher.fn)

    const res = await GET(dummyReq)
    const body = await res.json()
    expect(body.status.healthy).toBe(3)
    expect(body.status.total).toBe(3)
  })

  it('returns healthy=0 when every service reports degraded — never silently inflates the count', async () => {
    const dispatcher = dispatchFetch({
      overall: 'degraded',
      total: 3,
      services: [
        { name: 'a', status: 'degraded' },
        { name: 'b', status: 'degraded' },
        { name: 'c', status: 'degraded' },
      ],
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(dispatcher.fn)

    const res = await GET(dummyReq)
    const body = await res.json()
    expect(body.status.healthy).toBe(0)
    expect(body.status.total).toBe(3)
  })
})
