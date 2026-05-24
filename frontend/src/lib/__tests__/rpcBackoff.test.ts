import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  __resetRpcBackoffForTests,
  installRpcBackoff,
} from '@/lib/rpcBackoff'
import { __resetPageVisibilityForTests } from '@/lib/usePageVisibility'

// Mirror the constant used by the wrapper. Local copy keeps the tests
// independent of an export from the module under test (export the
// constant only if production code grows a need for it).
const BACKOFF_BASE_MS = 15_000

const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
const originalVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => state === 'hidden',
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

function upstreamUnreachable502(): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Upstream RPC unreachable' },
      id: null,
    }),
    { status: 502, headers: { 'Content-Type': 'application/json' } },
  )
}

function rpcOk200(result: unknown = '0x1'): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', result, id: 1 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('rpcBackoff', () => {
  let originalFetch: typeof fetch
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    __resetPageVisibilityForTests()
    __resetRpcBackoffForTests()
    originalFetch = globalThis.fetch
    fetchMock = vi.fn(async () => rpcOk200())
    globalThis.fetch = fetchMock as unknown as typeof fetch
    setVisibility('visible')
  })

  afterEach(() => {
    __resetRpcBackoffForTests()
    __resetPageVisibilityForTests()
    globalThis.fetch = originalFetch
    vi.useRealTimers()
    if (originalHidden) Object.defineProperty(Document.prototype, 'hidden', originalHidden)
    if (originalVisibility) Object.defineProperty(Document.prototype, 'visibilityState', originalVisibility)
  })

  it('install is idempotent — a second call does not double-wrap fetch', () => {
    installRpcBackoff()
    const afterFirst = globalThis.fetch
    installRpcBackoff()
    expect(globalThis.fetch).toBe(afterFirst)
  })

  it('passes a non-/api/rpc URL through unchanged (no interception)', async () => {
    installRpcBackoff()
    await globalThis.fetch('https://example.com/data', { method: 'POST' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/data', { method: 'POST' })
  })

  it('passes a non-POST /api/rpc request through unchanged', async () => {
    installRpcBackoff()
    await globalThis.fetch('/api/rpc', { method: 'GET' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('enters cooldown on a 502 with the -32000 envelope and short-circuits the next POST', async () => {
    installRpcBackoff()
    fetchMock.mockResolvedValueOnce(upstreamUnreachable502())

    const first = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(first.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const second = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(second.status).toBe(502)
    const body = await second.json() as { error: { code: number; message: string } }
    expect(body.error.code).toBe(-32000)
    expect(body.error.message).toBe('Upstream RPC unreachable (cooldown)')
    // Critical: the second call MUST NOT have hit upstream.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('exponential cooldown escalates 15s → 30s → 60s → 120s (capped)', async () => {
    vi.useFakeTimers()
    installRpcBackoff()
    fetchMock.mockResolvedValue(upstreamUnreachable502())

    const baseAt = Date.now()

    // 1st 502 → cooldown = 15s
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    vi.setSystemTime(baseAt + 15_000 + 1)

    // 2nd 502 → cooldown = 30s
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // 29.5s later: still in cooldown
    vi.setSystemTime(baseAt + 15_000 + 1 + 29_500)
    const inCooldown = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(inCooldown.status).toBe(502)
    expect(await inCooldown.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.setSystemTime(baseAt + 15_000 + 1 + 30_001)

    // 3rd 502 → cooldown = 60s
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    vi.setSystemTime(baseAt + 15_000 + 1 + 30_001 + 60_001)

    // 4th 502 → cooldown = 120s (the cap)
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(4)
    vi.setSystemTime(baseAt + 15_000 + 1 + 30_001 + 60_001 + 120_001)

    // 5th 502 → cooldown stays at 120s cap (15 * 2^4 = 240s capped at 120s)
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(5)
    vi.setSystemTime(baseAt + 15_000 + 1 + 30_001 + 60_001 + 120_001 + 119_000)
    const stillCapped = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(stillCapped.status).toBe(502)
    expect(await stillCapped.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it('resets failureCount + cooldownUntil on a 200 response', async () => {
    vi.useFakeTimers()
    installRpcBackoff()
    fetchMock.mockResolvedValueOnce(upstreamUnreachable502())

    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    // Cooldown is active — a second call would short-circuit.
    const inCd = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(await inCd.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })

    // Advance past the cooldown so the next call hits upstream and gets a 200.
    vi.setSystemTime(Date.now() + BACKOFF_BASE_MS + 1)
    fetchMock.mockResolvedValueOnce(rpcOk200())
    const ok = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(ok.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Now even another 502 immediately starts the backoff at 15s (failureCount
    // was reset to 0 and increments to 1 → 15s base, not 30s).
    fetchMock.mockResolvedValueOnce(upstreamUnreachable502())
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    // 14.5s later, still cooled (proves cooldown was re-armed).
    vi.setSystemTime(Date.now() + 14_500)
    const stillCd = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(await stillCd.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    // 1s past the 15s base → cooldown expired, the next call hits upstream
    // (verified by the fetchMock call count incrementing, not by the
    // response shape because the default mock returns 200).
    vi.setSystemTime(Date.now() + 1_000)
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('treats a 200 with an inner JSON-RPC error envelope as success (resets state)', async () => {
    vi.useFakeTimers()
    installRpcBackoff()
    fetchMock.mockResolvedValueOnce(upstreamUnreachable502())
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })

    // Advance past the cooldown so the next call actually hits upstream
    // (otherwise the wrapper short-circuits before reading the mock).
    vi.setSystemTime(Date.now() + BACKOFF_BASE_MS + 1)

    // Method-not-found is the proxy/upstream reporting a per-method
    // problem; the proxy itself is reachable, so state resets.
    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id: 1 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    const ok = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(ok.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Confirm cooldown is clear by issuing another POST immediately —
    // it must hit upstream (no synthetic-cooldown short-circuit).
    fetchMock.mockResolvedValueOnce(upstreamUnreachable502())
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('treats a 502 WITHOUT the -32000 envelope (e.g. LB HTML) as a non-cooldown error', async () => {
    installRpcBackoff()
    fetchMock.mockResolvedValueOnce(new Response(
      '<html><body>Bad Gateway</body></html>',
      { status: 502, headers: { 'Content-Type': 'text/html' } },
    ))
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })

    // The next call MUST hit upstream — no cooldown was armed.
    fetchMock.mockResolvedValueOnce(rpcOk200())
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('clears cooldown on visibilitychange → visible, but preserves failureCount', async () => {
    vi.useFakeTimers()
    installRpcBackoff()
    fetchMock.mockResolvedValue(upstreamUnreachable502())

    // 2 escalations: failureCount → 2, cooldown is 30s.
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    vi.setSystemTime(Date.now() + 15_500)
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // In cooldown — next call short-circuits.
    const cd = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(await cd.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Refocus the tab → cooldown clears, failureCount stays at 2.
    setVisibility('hidden')
    setVisibility('visible')

    // Next call hits upstream and gets another 502 → escalation continues
    // from failureCount=2 → 3 → cooldown jumps to 60s (not 15s, proving
    // failureCount was preserved).
    await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    // 59.5s later: still in cooldown.
    vi.setSystemTime(Date.now() + 59_500)
    const stillCd = await globalThis.fetch('/api/rpc', { method: 'POST', body: '[]' })
    expect(await stillCd.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('accepts a Request object input (viem may pass either form)', async () => {
    installRpcBackoff()
    fetchMock.mockResolvedValueOnce(upstreamUnreachable502())

    // jsdom's Request constructor requires an absolute URL.
    const req = new Request('http://localhost/api/rpc', { method: 'POST', body: '[]' })
    await globalThis.fetch(req)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const req2 = new Request('http://localhost/api/rpc', { method: 'POST', body: '[]' })
    const second = await globalThis.fetch(req2)
    // Cooldown short-circuit must trigger for the Request-form input too.
    expect(await second.json()).toMatchObject({ error: { message: 'Upstream RPC unreachable (cooldown)' } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('__resetRpcBackoffForTests restores the original fetch and clears state', async () => {
    installRpcBackoff()
    const originalRef = fetchMock
    expect(globalThis.fetch).not.toBe(originalRef)
    __resetRpcBackoffForTests()
    expect(globalThis.fetch).toBe(originalRef)
  })
})
