import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const CACHE_TTL_MS = 60_000

const COINGECKO_IDS: Record<string, string> = {
  ETH:   'ethereum',
  WETH:  'ethereum',
  WBTC:  'wrapped-bitcoin',
  USDC:  'usd-coin',
  USDT:  'tether',
  DAI:   'dai',
  'G$':  'good-dollar',
  LINK:  'chainlink',
  UNI:   'uniswap',
  AAVE:  'aave',
  ARB:   'arbitrum',
  OP:    'optimism',
  MKR:   'maker',
  COMP:  'compound-governance-token',
  SNX:   'havven',
  CRV:   'curve-dao-token',
  LDO:   'lido-dao',
  MATIC: 'matic-network',
}

let cachedData: Record<string, unknown> | null = null
let cacheTimestamp = 0

function buildCacheKey(ids: string[]): string {
  return ids.slice().sort().join(',')
}

let lastCacheKey = ''

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get('symbols')
  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing "symbols" query parameter' },
      { status: 400 },
    )
  }

  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean)
  const ids = Array.from(new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean)))

  if (ids.length === 0) {
    return NextResponse.json({}, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  const cacheKey = buildCacheKey(ids)
  const now = Date.now()
  const cacheHit = cachedData && cacheKey === lastCacheKey && now - cacheTimestamp < CACHE_TTL_MS

  if (cacheHit) {
    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, max-age=60', 'X-Cache': 'HIT' },
    })
  }

  try {
    const url =
      `${COINGECKO_BASE}/simple/price` +
      `?ids=${ids.join(',')}` +
      `&vs_currencies=usd` +
      `&include_24hr_change=true` +
      `&include_24hr_vol=true` +
      `&include_market_cap=true`

    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Coingecko returned ${upstream.status}` },
        { status: 502 },
      )
    }

    const data = await upstream.json()

    cachedData = data
    cacheTimestamp = now
    lastCacheKey = cacheKey

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60', 'X-Cache': 'MISS' },
    })
  } catch (err) {
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'Cache-Control': 'public, max-age=60', 'X-Cache': 'STALE' },
      })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Coingecko request failed' },
      { status: 502 },
    )
  }
}
