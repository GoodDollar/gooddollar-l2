import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_RPC_RESPONSE = JSON.stringify({
  jsonrpc: '2.0',
  result: '0x1234',
  id: 1,
})

beforeEach(() => {
  vi.restoreAllMocks()
})

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

describe('POST /api/rpc', () => {
  it('proxies a valid JSON-RPC request to the upstream RPC', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(MOCK_RPC_RESPONSE, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const req = makeRequest({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.result).toBe('0x1234')
    expect(fetchSpy).toHaveBeenCalledOnce()
  })

  it('returns 400 for unparseable body', async () => {
    const req = new Request('http://localhost/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    }) as unknown as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe(-32700)
  })

  it('returns 502 when upstream is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const req = makeRequest({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error.message).toBe('Upstream RPC unreachable')
  })
})
