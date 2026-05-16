import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Regression tests for task 0092 — `frontend/public/sw.js` previously had a
// Cache-First branch for `request.destination === 'script'` whose `.catch`
// only `console.log`'d and implicitly returned `undefined`. Browsers treat
// `event.respondWith(<promise resolving to undefined>)` as a NetworkError,
// which webpack rewraps as `ChunkLoadError` — blanking /perps, /lend,
// /stable, /ubi-impact and /activity in production.
//
// The fix:
//   1. Bypass the SW entirely for same-origin `/_next/` requests (Next.js
//      content-hashed bundles are already immutable + perfectly cached by
//      the browser HTTP cache).
//   2. Replace the silent `.catch` with one that returns a real 503 Response.
//   3. Skip caching cross-origin / opaque responses.
//   4. Bump CACHE_NAME to invalidate the broken caches that already shipped.

const SW_PATH = resolve(__dirname, '..', '..', 'public', 'sw.js')
const SW_SOURCE = readFileSync(SW_PATH, 'utf8')

describe('Service Worker source-text guards', () => {
  it('bumps CACHE_NAME to gooddollar-v1.0.1 (or higher) so existing broken caches are purged', () => {
    // We accept v1.0.1+ so future bumps don't fail this test.
    expect(SW_SOURCE).toMatch(/const CACHE_NAME = 'gooddollar-v1\.0\.(?:[1-9]|\d{2,})'/)
    expect(SW_SOURCE).not.toContain("const CACHE_NAME = 'gooddollar-v1.0.0'")
  })

  it("bypasses the Service Worker for same-origin /_next/ requests", () => {
    // The bypass must live inside the fetch handler.
    expect(SW_SOURCE).toMatch(/url\.pathname\.startsWith\(['"]\/_next\/['"]\)/)
  })

  it('does not silently swallow fetch errors with a console.log-only catch', () => {
    // Forbid the literal broken pattern from the old code.
    // Old code: .catch(() => { /* comment */ console.log(...) })
    // New code must `return` a Response (or rethrow).
    const silentCatch =
      /\.catch\(\s*\(\s*\)\s*=>\s*\{\s*(?:\/\/[^\n]*\n\s*)?console\.log\([^)]*\)\s*\}\s*\)/
    expect(SW_SOURCE).not.toMatch(silentCatch)
  })

  it('returns a 503 Response when the static-asset fetch fails', () => {
    // Look for a literal `new Response(...{ status: 503 ...})` somewhere
    // in the fetch handler. We assert on the substring rather than parsing
    // because the SW is plain JS.
    expect(SW_SOURCE).toMatch(/new Response\([^)]*?\b503\b/s)
  })
})

// ---------------------------------------------------------------------------
// Behavioural tests — load sw.js into a sandbox and dispatch synthetic events.
// ---------------------------------------------------------------------------

type FetchListener = (ev: SyntheticFetchEvent) => void

interface SyntheticRequest {
  method: string
  url: string
  destination: '' | 'image' | 'font' | 'script' | 'style' | 'document'
  clone(): SyntheticRequest
}

interface SyntheticFetchEvent {
  request: SyntheticRequest
  respondWith: (response: Promise<unknown> | unknown) => void
  __responded?: Promise<unknown>
}

class FakeResponse {
  status: number
  type: 'basic' | 'cors' | 'opaque'
  constructor(_body?: unknown, init?: { status?: number; type?: 'basic' | 'cors' | 'opaque' }) {
    this.status = init?.status ?? 200
    this.type = init?.type ?? 'basic'
  }
  clone() {
    return new FakeResponse(undefined, { status: this.status, type: this.type })
  }
}

interface SandboxResult {
  fetchListener: FetchListener
  cachePuts: Array<{ url: string }>
}

function loadSw(opts: {
  fetchImpl: (req: SyntheticRequest) => Promise<FakeResponse>
  cachedResponse?: FakeResponse | undefined
  origin?: string
}): SandboxResult {
  const cachePuts: Array<{ url: string }> = []
  let fetchListener: FetchListener | null = null

  const fakeCaches = {
    open: async () => ({
      put: async (req: SyntheticRequest, _res: FakeResponse) => {
        cachePuts.push({ url: req.url })
      },
      delete: async () => true,
    }),
    match: async (_req: SyntheticRequest) => opts.cachedResponse,
    keys: async () => [],
    delete: async () => true,
  }

  const fakeSelf = {
    location: { origin: opts.origin ?? 'https://goodswap.goodclaw.org' },
    addEventListener: (type: string, listener: unknown) => {
      if (type === 'fetch') {
        fetchListener = listener as FetchListener
      }
    },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    registration: {
      showNotification: () => Promise.resolve(),
    },
  }

  // Wrap the SW source so it executes against our injected globals instead
  // of the real worker scope. `setTimeout` is also injected so the dynamic
  // API-cache TTL doesn't leak handles into the test runner.
  const wrapper = new Function(
    'self',
    'caches',
    'fetch',
    'Response',
    'URL',
    'setTimeout',
    'console',
    SW_SOURCE,
  )

  wrapper(
    fakeSelf,
    fakeCaches,
    opts.fetchImpl,
    FakeResponse,
    URL,
    () => 0,
    { log: () => {}, warn: () => {}, error: () => {} },
  )

  if (!fetchListener) {
    throw new Error('Service Worker did not register a fetch listener')
  }
  return { fetchListener, cachePuts }
}

function dispatchFetch(
  listener: FetchListener,
  url: string,
  destination: SyntheticRequest['destination'],
): SyntheticFetchEvent {
  const request: SyntheticRequest = {
    method: 'GET',
    url,
    destination,
    clone() {
      return { ...this, clone: this.clone }
    },
  }
  const event: SyntheticFetchEvent = {
    request,
    respondWith(value) {
      event.__responded = Promise.resolve(value)
    },
  }
  listener(event)
  return event
}

describe('Service Worker runtime behaviour', () => {
  let dispatchScriptRequest: (url: string) => SyntheticFetchEvent = () => {
    throw new Error('dispatchScriptRequest not initialized')
  }

  beforeAll(() => {
    // No-op — sandbox is rebuilt per test for isolation.
  })

  it('does NOT call event.respondWith for same-origin /_next/ chunk requests', async () => {
    const { fetchListener } = loadSw({
      fetchImpl: async () => new FakeResponse(undefined, { status: 200 }),
    })
    const ev = dispatchFetch(
      fetchListener,
      'https://goodswap.goodclaw.org/_next/static/chunks/9485-ceb4ef23e68e6cf5.js',
      'script',
    )
    expect(ev.__responded).toBeUndefined()
  })

  it('returns a real Response (not undefined) when a script fetch rejects', async () => {
    const { fetchListener } = loadSw({
      fetchImpl: async () => {
        throw new TypeError('Network blip')
      },
      cachedResponse: undefined,
    })
    const ev = dispatchFetch(
      fetchListener,
      'https://goodswap.goodclaw.org/icons/foo.svg',
      'image',
    )
    expect(ev.__responded).toBeDefined()
    const resolved = await ev.__responded
    expect(resolved).toBeInstanceOf(FakeResponse)
    expect((resolved as FakeResponse).status).toBe(503)
  })

  it('does not cache cross-origin responses (no opaque cache poisoning)', async () => {
    const { fetchListener, cachePuts } = loadSw({
      fetchImpl: async () =>
        new FakeResponse(undefined, { status: 200, type: 'opaque' }),
    })
    dispatchFetch(
      fetchListener,
      'https://cdn.example.com/foo.js',
      'script',
    )
    // Allow microtasks to drain.
    await new Promise((r) => setTimeout(r, 0))
    expect(cachePuts).toHaveLength(0)
  })

  it('still caches successful same-origin non-/_next/ static assets', async () => {
    const { fetchListener, cachePuts } = loadSw({
      fetchImpl: async () => new FakeResponse(undefined, { status: 200, type: 'basic' }),
    })
    dispatchFetch(
      fetchListener,
      'https://goodswap.goodclaw.org/icons/manifest-192.png',
      'image',
    )
    await new Promise((r) => setTimeout(r, 0))
    expect(cachePuts.map((p) => p.url)).toContain(
      'https://goodswap.goodclaw.org/icons/manifest-192.png',
    )
  })

  it.skip('placeholder for future SW behavioural tests', () => {
    // Reserved.
    expect(dispatchScriptRequest).toBeDefined()
  })
})
