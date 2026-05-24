/**
 * Client-side exponential-backoff wrapper for `POST /api/rpc`.
 *
 * Every wagmi/viem read funnels through `fetch('/api/rpc', { method:
 * 'POST', body: <JSON-RPC batch> })`. When devnet is unreachable, the
 * proxy returns HTTP 502 with the JSON envelope
 * `{ jsonrpc: '2.0', error: { code: -32000, message: 'Upstream RPC unreachable' }, id: null }`
 * — and without this wrapper, React Query keeps firing the configured
 * `refetchInterval` (15/30/60 s) waves of 8–12 batches forever,
 * burning sockets and battery for zero data.
 *
 * Wraps `globalThis.fetch` once at first install to intercept only
 * `POST /api/rpc`. All other URLs pass through unchanged. On a 502
 * with the `-32000` envelope the wrapper escalates an exponential
 * cooldown (15 s → 30 s → 60 s → 120 s cap). During the cooldown,
 * further `POST /api/rpc` calls short-circuit client-side with a
 * synthetic 502 (same envelope + `(cooldown)` suffix) so wagmi's
 * existing error path handles them identically to a real 502 — but
 * the proxy is never hit. On any non-502 response, both counters
 * reset, so devnet recovery snaps back to live polling within ≤TTL.
 *
 * Visibility-resume clears the cooldown (but keeps `failureCount` so
 * escalation continues on refocus into a still-dead state) — so a
 * user re-focusing the tab after devnet recovers detects it in one
 * round-trip.
 *
 * Borrowed shape from `usePriceServiceStatus`'s in-place backoff
 * (FAILURE_BACKOFF_BASE_MS = 15s, MAX = 120s) so operator intuition
 * stays consistent across rails. See task 0050.
 */

import { subscribePageVisibility } from './usePageVisibility'

const RPC_PATH = '/api/rpc'
const BACKOFF_BASE_MS = 15_000
const BACKOFF_MAX_MS = 120_000
const UPSTREAM_UNREACHABLE_CODE = -32000

let failureCount = 0
let cooldownUntil = 0
let originalFetch: typeof fetch | null = null
let installed = false
let unsubscribeVisibility: (() => void) | null = null

function normalizeFetchTarget(input: RequestInfo | URL, init?: RequestInit): { url: string; method: string } {
  if (typeof input === 'string') {
    return { url: input, method: (init?.method ?? 'GET').toUpperCase() }
  }
  if (input instanceof URL) {
    return { url: input.href, method: (init?.method ?? 'GET').toUpperCase() }
  }
  // Request instance — its method wins over init.
  return { url: input.url, method: input.method.toUpperCase() }
}

function isRpcPost(input: RequestInfo | URL, init?: RequestInit): boolean {
  const { url, method } = normalizeFetchTarget(input, init)
  if (method !== 'POST') return false
  // Accept both absolute (`https://host/api/rpc`) and relative
  // (`/api/rpc`) forms. viem fetches the relative form so it expands
  // to the page origin at request time.
  return url.endsWith(RPC_PATH) || url.includes(`${RPC_PATH}?`)
}

async function shouldEnterCooldown(res: Response): Promise<boolean> {
  if (res.status !== 502) return false
  try {
    const body = await res.clone().json() as { error?: { code?: unknown } }
    return body?.error?.code === UPSTREAM_UNREACHABLE_CODE
  } catch {
    // Non-JSON 502 (e.g. load-balancer HTML) is treated as a non-cooldown
    // error — different failure mode, different remediation.
    return false
  }
}

function syntheticCooldownResponse(): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: UPSTREAM_UNREACHABLE_CODE,
        message: 'Upstream RPC unreachable (cooldown)',
      },
      id: null,
    }),
    {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

function escalate(): void {
  failureCount += 1
  const backoff = Math.min(
    BACKOFF_MAX_MS,
    BACKOFF_BASE_MS * (2 ** Math.max(0, failureCount - 1)),
  )
  cooldownUntil = Date.now() + backoff
}

function reset(): void {
  failureCount = 0
  cooldownUntil = 0
}

async function wrappedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const original = originalFetch ?? fetch
  if (!isRpcPost(input, init)) {
    return original.call(globalThis, input, init)
  }

  if (Date.now() < cooldownUntil) {
    return syntheticCooldownResponse()
  }

  const res = await original.call(globalThis, input, init)
  if (await shouldEnterCooldown(res)) {
    escalate()
  } else {
    // Any other outcome — 200, 4xx, non-cooldown 502 — means the proxy
    // is reachable; reset both counters so the next tick polls at
    // normal cadence.
    reset()
  }
  return res
}

/**
 * Install the RPC backoff wrapper exactly once per page lifetime.
 * Idempotent — repeated calls are no-ops. SSR-safe via a `window`
 * guard so the module can be imported from a server component
 * without side effects.
 */
export function installRpcBackoff(): void {
  if (installed) return
  if (typeof window === 'undefined') return

  installed = true
  originalFetch = globalThis.fetch
  globalThis.fetch = wrappedFetch as typeof fetch

  unsubscribeVisibility = subscribePageVisibility((hidden) => {
    if (!hidden) {
      // Refocus → clear the cooldown so the next tick retries upstream
      // immediately. failureCount is preserved so the backoff escalates
      // monotonically if the tab refocuses into a still-dead state.
      cooldownUntil = 0
    }
  })
}

export function __resetRpcBackoffForTests(): void {
  if (installed && originalFetch) {
    globalThis.fetch = originalFetch
  }
  if (unsubscribeVisibility) {
    unsubscribeVisibility()
    unsubscribeVisibility = null
  }
  reset()
  originalFetch = null
  installed = false
}
