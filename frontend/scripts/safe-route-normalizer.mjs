const STOCKS_FALLBACK_TICKER = 'UNKNOWN'
const MAX_DECODE_PASSES = 3
const STOCKS_ROUTE_PREFIX = '/stocks/'
const REPLACEMENT_CHAR_PATTERN = /\uFFFD/

function toStocksFallback(query = '') {
  return `${STOCKS_ROUTE_PREFIX}${STOCKS_FALLBACK_TICKER}${query}`
}

function hasReplacementCharInStocksSegment(path) {
  if (!path.startsWith(STOCKS_ROUTE_PREFIX)) return false
  const rest = path.slice(STOCKS_ROUTE_PREFIX.length)
  const tickerSegment = rest.split('/')[0] ?? ''
  if (!tickerSegment) return false
  return REPLACEMENT_CHAR_PATTERN.test(tickerSegment)
}

export function normalizeMalformedStocksPath(rawUrl = '/') {
  const url = rawUrl || '/'
  const queryIndex = url.indexOf('?')
  const path = queryIndex >= 0 ? url.slice(0, queryIndex) : url
  const query = queryIndex >= 0 ? url.slice(queryIndex) : ''

  try {
    let decodedPath = path
    for (let i = 0; i < MAX_DECODE_PASSES; i += 1) {
      const nextPath = decodeURIComponent(decodedPath)
      if (nextPath === decodedPath) {
        break
      }
      decodedPath = nextPath
    }
    if (hasReplacementCharInStocksSegment(decodedPath)) {
      return toStocksFallback(query)
    }
    return url
  } catch {
    if (path.startsWith(STOCKS_ROUTE_PREFIX)) {
      return toStocksFallback(query)
    }
    return url
  }
}
