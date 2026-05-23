const STOCKS_FALLBACK_TICKER = 'UNKNOWN'
const MAX_DECODE_PASSES = 3
const STOCKS_ROUTE_PREFIX = '/stocks/'
const HEDGE_PROOF_ROUTE_PREFIX = '/analytics/hedge/proof/'
const HEDGE_PROOF_INVALID_PATH = `${HEDGE_PROOF_ROUTE_PREFIX}invalid`
const REPLACEMENT_CHAR_PATTERN = /\uFFFD/

function splitUrl(rawUrl) {
  const url = rawUrl || '/'
  const queryIndex = url.indexOf('?')
  return {
    url,
    path: queryIndex >= 0 ? url.slice(0, queryIndex) : url,
    query: queryIndex >= 0 ? url.slice(queryIndex) : '',
  }
}

function tryFullyDecode(path) {
  let decoded = path
  for (let i = 0; i < MAX_DECODE_PASSES; i += 1) {
    const next = decodeURIComponent(decoded)
    if (next === decoded) break
    decoded = next
  }
  return decoded
}

function toStocksFallback(query = '') {
  return `${STOCKS_ROUTE_PREFIX}${STOCKS_FALLBACK_TICKER}${query}`
}

function toHedgeProofInvalid(query = '') {
  return `${HEDGE_PROOF_INVALID_PATH}${query}`
}

function hasReplacementCharInStocksSegment(path) {
  if (!path.startsWith(STOCKS_ROUTE_PREFIX)) return false
  const rest = path.slice(STOCKS_ROUTE_PREFIX.length)
  const tickerSegment = rest.split('/')[0] ?? ''
  if (!tickerSegment) return false
  return REPLACEMENT_CHAR_PATTERN.test(tickerSegment)
}

export function normalizeMalformedStocksPath(rawUrl = '/') {
  const { url, path, query } = splitUrl(rawUrl)
  try {
    const decoded = tryFullyDecode(path)
    if (hasReplacementCharInStocksSegment(decoded)) {
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

// Mirrors `normalizeMalformedStocksPath` for the hedge-proof viewer:
// a copy-pasted receipt-id URL whose percent-encoding got truncated
// (e.g. `/analytics/hedge/proof/foo%E0%80`) would otherwise be killed
// by Next.js's framework-level pathname decoder before any of our
// pages or routes run, dropping the operator on a chrome-less default
// "400 Bad Request" page. Rewriting to the branded fallback page
// keeps them inside the dashboard shell with a clear recovery path.
// The address bar is unchanged because this rewrite happens before
// Next.js sees the URL.
export function normalizeMalformedHedgeProofPath(rawUrl = '/') {
  const { url, path, query } = splitUrl(rawUrl)
  if (!path.startsWith(HEDGE_PROOF_ROUTE_PREFIX)) return url
  try {
    decodeURIComponent(path)
    return url
  } catch {
    return toHedgeProofInvalid(query)
  }
}
