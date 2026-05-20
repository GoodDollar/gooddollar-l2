const STOCKS_FALLBACK_TICKER = 'UNKNOWN'

export function normalizeMalformedStocksPath(rawUrl = '/') {
  const url = rawUrl || '/'
  const queryIndex = url.indexOf('?')
  const path = queryIndex >= 0 ? url.slice(0, queryIndex) : url
  const query = queryIndex >= 0 ? url.slice(queryIndex) : ''

  try {
    decodeURIComponent(path)
    return url
  } catch {
    if (path.startsWith('/stocks/')) {
      return `/stocks/${STOCKS_FALLBACK_TICKER}${query}`
    }
    return url
  }
}
