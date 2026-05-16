import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rpcCall, RpcError } from '../rpc'

// These tests exercise the four error paths that the Activity page's previous
// inline rpcCall swallowed silently — see task 0069. The activity page rendered
// "Block #0" beside a green "Live" pulse because `data.result === undefined`
// flowed through hexToNumber(undefined) → NaN → 0 with no error surfaced.

const URL = 'https://rpc.example.org'

describe('rpcCall', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.useRealTimers()
  })

  it('returns data.result on a healthy 200 response', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: '2.0', result: '0x1a6ce', id: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    await expect(rpcCall<string>(URL, 'eth_blockNumber')).resolves.toBe('0x1a6ce')
  })

  it('sends only CORS-safelisted-or-acceptable headers and uses the cache:no-store RequestInit option (no Cache-Control header — that would trigger a CORS preflight that production rpc.goodclaw.org rejects, see task 0091)', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: '2.0', result: '0x1', id: 1 }), { status: 200 }),
    )
    await rpcCall(URL, 'eth_blockNumber')
    expect(fetchSpy).toHaveBeenCalledOnce()
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['Accept']).toBe('application/json')
    // Regression guard for task 0091: Cache-Control is NOT a CORS-safelisted
    // request header per the Fetch spec, so sending it forces a preflight that
    // the upstream RPC (Caddy) rejects because it only whitelists Content-Type
    // in Access-Control-Allow-Headers. The cache-busting behavior is instead
    // expressed via the RequestInit `cache` option below.
    expect(headers['Cache-Control']).toBeUndefined()
    expect(init.cache).toBe('no-store')
  })

  it('throws RpcError when res.ok is false (e.g. 500)', async () => {
    fetchSpy.mockResolvedValue(new Response('Internal Server Error', { status: 500 }))
    await expect(rpcCall(URL, 'eth_blockNumber')).rejects.toMatchObject({
      name: 'RpcError',
      method: 'eth_blockNumber',
      code: 500,
      url: URL,
    })
  })

  it('throws RpcError when the response carries a JSON-RPC error envelope', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ jsonrpc: '2.0', error: { code: -32601, message: 'method not found' }, id: 1 }),
        { status: 200 },
      ),
    )
    await expect(rpcCall(URL, 'eth_unknownMethod')).rejects.toMatchObject({
      name: 'RpcError',
      method: 'eth_unknownMethod',
      code: -32601,
      message: 'method not found',
      url: URL,
    })
  })

  it('throws RpcError when the response is missing both result and error (this was the original silent-zero bug)', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: '2.0', id: 1 }), { status: 200 }),
    )
    await expect(rpcCall(URL, 'eth_blockNumber')).rejects.toMatchObject({
      name: 'RpcError',
      method: 'eth_blockNumber',
      code: 'no-result',
    })
  })

  it('aborts and throws when the request exceeds timeoutMs', async () => {
    // Simulate a hanging fetch that respects the AbortSignal
    fetchSpy.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    })

    await expect(
      rpcCall(URL, 'eth_blockNumber', [], { timeoutMs: 20 }),
    ).rejects.toThrow()
  })
})
