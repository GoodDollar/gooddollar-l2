/**
 * Tiny TTL + single-flight cache for the upstream rebalance status payload.
 *
 * - Single-flight: concurrent callers for the same key await the same promise,
 *   so a tab storm or many tabs only result in one upstream fetch in flight.
 * - TTL: a successfully resolved payload is reused for `ttlMs` after resolution.
 * - Errors are never cached — the next call always retries upstream.
 * - TTL <= 0 disables both single-flight and TTL (preserves current behavior
 *   for operators who need every request to hit upstream).
 *
 * Module-scoped state is per Next.js worker process; that's the right granularity
 * because the upstream payload is global, not per-tab.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const settled = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export async function getOrFetchUpstreamStatus<T>(
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

export function __resetRebalanceStatusCacheForTests(): void {
  settled.clear()
  inflight.clear()
}
