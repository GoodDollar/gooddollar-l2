export type StocksOracleHealth = 'live' | 'degraded' | 'offline'

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

export function deriveStocksOracleHealth(payload: unknown, now = Date.now()): StocksOracleHealth {
  const data = payload as StatusPayload | null
  if (!data || !Array.isArray(data.services)) return 'offline'

  const service = data.services.find((s) => s?.name === 'stocks-keeper')
  if (!service) return 'offline'
  if (service.status !== 'ok') return 'degraded'

  if (!service.lastChecked) return 'live'
  const ts = Date.parse(service.lastChecked)
  if (!Number.isFinite(ts)) return 'degraded'
  if ((now - ts) > STALE_MS) return 'degraded'
  return 'live'
}

