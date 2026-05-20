import { NextRequest, NextResponse } from 'next/server'

import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'
const CACHE_TTL_MS = 60_000

// Bound the in-memory cache so unique queries can't grow it without limit
// (LRU-ish eviction via Map insertion order).
const MAX_CACHE_ENTRIES = 16

// Reject pathological requests early. The COINGECKO_IDS table has ~18 entries;
// any sane caller will be well below this cap. This is a DoS guard.
const MAX_SYMBOLS_PER_REQUEST = 50

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

interface CacheEntry {
  data: Record<string, unknown>
  timestamp: number
}

// Keyed cache: each distinct ID-basket gets its own slot. Prevents thrashing
// between widget baskets (e.g. one component asking for ETH, another for USDC)
// and prevents cross-key STALE leakage on upstream failures.
const priceCache = new Map<string, CacheEntry>()

function buildCacheKey(ids: string[]): string {
  return ids.slice().sort().join(',')
}

function rememberInCache(key: string, data: Record<string, unknown>, now: number) {
  // Refresh insertion order so this key becomes the most-recent.
  priceCache.delete(key)
  priceCache.set(key, { data, timestamp: now })

  // Evict oldest entries while we're over capacity.
  while (priceCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = priceCache.keys().next().value
    if (oldestKey === undefined) break
    priceCache.delete(oldestKey)
  }
}

async function handleGet(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get('symbols')
  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing "symbols" query parameter' },
      { status: 400 },
    )
  }

  const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean)

  if (symbols.length > MAX_SYMBOLS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `Too many symbols (${symbols.length}); max ${MAX_SYMBOLS_PER_REQUEST} per request`,
      },
      { status: 400 },
    )
  }

  const ids = Array.from(new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean)))

  if (ids.length === 0) {
    return NextResponse.json({}, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  const cacheKey = buildCacheKey(ids)
  const now = Date.now()
  const cached = priceCache.get(cacheKey)
  const isFresh = cached && now - cached.timestamp < CACHE_TTL_MS

  if (cached && isFresh) {
    return NextResponse.json(cached.data, {
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

    const data = (await upstream.json()) as Record<string, unknown>

    rememberInCache(cacheKey, data, now)

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60', 'X-Cache': 'MISS' },
    })
  } catch (err) {
    // Only serve STALE for the *same* cache key — never cross-key.
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { 'Cache-Control': 'public, max-age=60', 'X-Cache': 'STALE' },
      })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Coingecko request failed' },
      { status: 502 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
