import { NextResponse, type NextRequest } from 'next/server'

import {
  evaluateRebalanceInvariant,
  toInvariantInputFromStatus,
  type RebalanceInvariantResult,
} from '@/lib/stocksRebalanceInvariant'
import { methodNotAllowed } from '@/lib/api-error'
import { getOrFetchUpstreamStatus } from '@/lib/rebalanceStatusCache'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const STATUS_URL = process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json'
const TIMEOUT_MS = 5000
const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'JPM', 'V', 'DIS', 'NFLX', 'AMD']

const DEFAULT_CACHE_MS = 1000

// Read once at module load. `0` (or any non-numeric value) disables the
// server-side cache so every request hits upstream — useful for operators
// who need to debug aggregator behavior directly.
function readCacheMs(): number {
  const raw = process.env.STATUS_AGGREGATOR_CACHE_MS
  if (raw === undefined || raw === '') return DEFAULT_CACHE_MS
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_CACHE_MS
}

class UpstreamHttpError extends Error {
  constructor(public readonly httpStatus: number) {
    super(`upstream-not-ok-${httpStatus}`)
    this.name = 'UpstreamHttpError'
  }
}

interface StatusRebalancePayload {
  blockNumber?: number
  chain?: { blockNumber?: number }
  stocksRebalance?: {
    currentBlock?: number
    symbols?: Record<string, unknown>
  }
}

function parseRequestedSymbols(req: NextRequest): string[] {
  const querySymbols = req.nextUrl.searchParams.get('symbols')
  const singleSymbol = req.nextUrl.searchParams.get('symbol')
  const raw = querySymbols ?? singleSymbol ?? ''
  if (!raw.trim()) return DEFAULT_SYMBOLS
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9]{1,16}$/.test(s))

  return parsed.length > 0 ? parsed : DEFAULT_SYMBOLS
}

function getCurrentBlock(payload: StatusRebalancePayload): number {
  return Number(
    payload.stocksRebalance?.currentBlock
    ?? payload.chain?.blockNumber
    ?? payload.blockNumber
    ?? 0,
  )
}

function buildSymbolResults(
  symbols: string[],
  currentBlock: number,
  payload: StatusRebalancePayload,
): RebalanceInvariantResult[] {
  const symbolData = payload.stocksRebalance?.symbols ?? {}
  return symbols.map((symbol) => {
    const input = toInvariantInputFromStatus(symbol, currentBlock, symbolData[symbol])
    return evaluateRebalanceInvariant(input)
  })
}

async function fetchUpstreamPayload(): Promise<StatusRebalancePayload> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) throw new UpstreamHttpError(res.status)
    return await res.json() as StatusRebalancePayload
  } finally {
    clearTimeout(timer)
  }
}

async function handleGet(req: NextRequest) {
  const symbols = parseRequestedSymbols(req)
  // Cache key collapses tab-storms and many-tabs into one upstream fetch per
  // unique symbol set per TTL window. Already sorted/deduped by the parser.
  const cacheKey = symbols.slice().sort().join(',')

  try {
    const payload = await getOrFetchUpstreamStatus(cacheKey, fetchUpstreamPayload, readCacheMs())
    const currentBlock = getCurrentBlock(payload)
    const results = buildSymbolResults(symbols, currentBlock, payload)

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      currentBlock,
      symbols: results,
      stopActive: results.some((s) => !s.riskIncreaseAllowed),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    if (err instanceof UpstreamHttpError) {
      return NextResponse.json(
        { error: 'Status aggregator returned an error', httpStatus: err.httpStatus },
        { status: 502 },
      )
    }
    return NextResponse.json(
      {
        error: 'Status aggregator unreachable',
        currentBlock: 0,
        symbols: symbols.map((symbol) =>
          evaluateRebalanceInvariant({
            symbol,
            currentBlock: 0,
            oracleBlock: 0,
            products: { amm: 0, perps: 0, prediction: 0, lend: 0, yield: 0 },
            stalePropagation: true,
          }),
        ),
        stopActive: true,
      },
      { status: 503 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)

const ALLOWED = ['GET'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const POST = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
