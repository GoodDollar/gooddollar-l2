const STATUS_QUOTES_PATH = '/status/quotes'
const HEALTH_PATH = '/health'

export function resolvePriceServiceStatusUrl(rawUrl: string | undefined, fallbackBaseUrl = 'http://localhost:9300'): string {
  const base = (rawUrl ?? fallbackBaseUrl).trim().replace(/\/+$/, '')
  if (!base) return `${fallbackBaseUrl}${STATUS_QUOTES_PATH}`
  if (base.endsWith(HEALTH_PATH)) return `${base.slice(0, -HEALTH_PATH.length)}${STATUS_QUOTES_PATH}`
  return base.endsWith(STATUS_QUOTES_PATH) ? base : `${base}${STATUS_QUOTES_PATH}`
}
