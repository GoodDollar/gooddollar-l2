export type StocksOracleHealth = 'live' | 'degraded' | 'offline' | 'fallback' | 'auth'

interface StatusService {
  name?: string
  status?: string
  lastChecked?: string
}

interface StatusPayload {
  overall?: string
  services?: StatusService[]
}

const STALE_MS = 60_000

export function deriveStocksOracleHealth(
  payload: unknown,
  now = Date.now(),
  onChainReachable?: boolean,
): StocksOracleHealth {
  const data = payload as StatusPayload | null
  if (!data || !Array.isArray(data.services)) return 'offline'

  const service = data.services.find((s) => s?.name === 'stocks-keeper')
  if (!service) return 'offline'
  if (service.status === 'auth' || service.status === 'unauthorized') return 'auth'
  if (service.status !== 'ok') return 'degraded'

  if (!service.lastChecked) return liveOrFallback(onChainReachable)
  const ts = Date.parse(service.lastChecked)
  if (!Number.isFinite(ts)) return 'degraded'
  if ((now - ts) > STALE_MS) return 'degraded'
  return liveOrFallback(onChainReachable)
}

// Keeper is healthy: distinguish live (on-chain oracle reachable) vs fallback
// (keeper green, but on-chain oracle is unreachable so UI is showing demo data).
// Undefined = unknown reachability → preserve legacy "live" behaviour.
function liveOrFallback(onChainReachable?: boolean): StocksOracleHealth {
  return onChainReachable === false ? 'fallback' : 'live'
}

/**
 * Derive the age (in ms) of the most recent stocks-keeper heartbeat from the
 * `/api/status` payload. Returns `null` when the payload is missing, the
 * service is absent, or `lastChecked` is unparseable. Used by the badge's
 * compact-fallback render to print `Updated <age>` next to the live label.
 */
export function getStocksKeeperAgeMs(payload: unknown, now = Date.now()): number | null {
  const data = payload as StatusPayload | null
  if (!data || !Array.isArray(data.services)) return null
  const service = data.services.find((s) => s?.name === 'stocks-keeper')
  if (!service?.lastChecked) return null
  const ts = Date.parse(service.lastChecked)
  if (!Number.isFinite(ts)) return null
  const ageMs = now - ts
  return ageMs >= 0 ? ageMs : 0
}
