/**
 * Tiny TTL + single-flight cache for the merged `/api/oracle/status`
 * upstream payload (price-service `/status/quotes` + oracle-signer `/proof`).
 *
 * Forked from `rebalanceStatusCache` so each route has its own
 * `settled` / `inflight` maps, its own env knob, and an independent
 * `__resetOracleStatusCacheForTests` handle — see task 0048 plan.
 *
 * Semantics:
 *
 * - Single-flight: concurrent callers for the same key await the same
 *   promise, so a tab storm or many tabs only result in one upstream
 *   fetch in flight.
 * - TTL: a successfully resolved payload is reused for `ttlMs` after
 *   resolution.
 * - Errors are never cached — the next call always retries upstream.
 *   The route handler relies on this by throwing a sentinel when both
 *   upstreams fail (the 503 path) so the next poll re-fans-out.
 * - TTL <= 0 disables both single-flight and TTL (preserves raw
 *   fan-out behavior for operators who need every request to hit
 *   upstream).
 *
 * The cache key is a single global string for this route today
 * (`oracle-status:default`) because the route accepts no request-shape
 * input that would change the upstream calls. Any future change that
 * adds per-request input MUST update the cache key shape; otherwise
 * stale data leaks across distinct request shapes.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const settled = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export async function getOrFetchOracleStatus<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): Promise<T> {
  if (ttlMs <= 0) return fetcher()

  const now = Date.now()
  const hit = settled.get(key) as CacheEntry<T> | undefined
  if (hit && hit.expiresAt > now) return hit.value

  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = (async () => {
    try {
      const value = await fetcher()
      settled.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, promise)
  return promise
}

export function __resetOracleStatusCacheForTests(): void {
  settled.clear()
  inflight.clear()
}
