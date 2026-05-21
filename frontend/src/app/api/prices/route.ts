import { NextRequest, NextResponse } from 'next/server'

import { apiError, methodNotAllowed } from '@/lib/api-error'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

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

const SUPPORTED_SYMBOLS = Object.keys(COINGECKO_IDS)

let cachedData: Record<string, unknown> | null = null
let cacheTimestamp = 0

function buildCacheKey(ids: string[]): string {
  return ids.slice().sort().join(',')
}

let lastCacheKey = ''

async function handleGet(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get('symbols')
  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing "symbols" query parameter' },
      { status: 400 },
    )
  }

  // Preserve original order + de-duplicate while remembering which requested
  // symbols are not mapped to a Coingecko id.
  const requested: string[] = []
  const seen = new Set<string>()
  for (const raw of symbolsParam.split(',')) {
    const s = raw.trim()
    if (!s || seen.has(s)) continue
    seen.add(s)
    requested.push(s)
  }
  const unknownSymbols = requested.filter((s) => !COINGECKO_IDS[s])
  const knownSymbols = requested.filter((s) => COINGECKO_IDS[s])
  const ids = Array.from(new Set(knownSymbols.map((s) => COINGECKO_IDS[s])))

  // All requested symbols are unmapped → reject loudly so callers don't
  // silently render undefined prices. (Task 0027 contract.)
  if (ids.length === 0) {
    return apiError(
      400,
      'no_supported_symbols',
      `No supported symbols in request. Requested: ${requested.join(', ')}`,
      {
        path: req.nextUrl.pathname,
        method: req.method,
        requested,
        unknownSymbols,
        supported_sample: SUPPORTED_SYMBOLS.slice(0, 12),
      },
    )
  }

  const cacheKey = buildCacheKey(ids)
  const now = Date.now()
  const cacheHit =
    cachedData && cacheKey === lastCacheKey && now - cacheTimestamp < CACHE_TTL_MS

  // Build the legacy-shape envelope (keeps `body[id]` available for existing
  // callers) plus the new diagnostic fields.
  const envelope = (
    prices: Record<string, unknown>,
    extraHeaders: Record<string, string>,
  ) => {
    const body: Record<string, unknown> = {
      ...prices,
      prices,
      requested,
      unknownSymbols,
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, max-age=60', ...extraHeaders },
    })
  }

  if (cacheHit) {
    return envelope(cachedData as Record<string, unknown>, { 'X-Cache': 'HIT' })
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

    cachedData = data
    cacheTimestamp = now
    lastCacheKey = cacheKey

    return envelope(data, { 'X-Cache': 'MISS' })
  } catch (err) {
    if (cachedData) {
      return envelope(cachedData as Record<string, unknown>, { 'X-Cache': 'STALE' })
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Coingecko request failed' },
      { status: 502 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)

// Reject unsupported methods with a structured JSON envelope (405).
const ALLOWED = ['GET'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const POST = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
