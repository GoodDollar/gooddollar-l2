const STOCKS_FALLBACK_TICKER = 'UNKNOWN'
const MAX_DECODE_PASSES = 3

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
    return url
  } catch {
    if (path.startsWith('/stocks/')) {
      return `/stocks/${STOCKS_FALLBACK_TICKER}${query}`
    }
    return url
  }
}
