import { NextResponse, type NextRequest } from 'next/server'

import {
  evaluateRebalanceInvariant,
  toInvariantInputFromStatus,
  type RebalanceInvariantResult,
} from '@/lib/stocksRebalanceInvariant'
import { methodNotAllowed } from '@/lib/api-error'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const STATUS_URL = process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json'
const TIMEOUT_MS = 5000
const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'JPM', 'V', 'DIS', 'NFLX', 'AMD']

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

async function handleGet(req: NextRequest) {
  const symbols = parseRequestedSymbols(req)

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Status aggregator returned an error', httpStatus: res.status },
        { status: 502 },
      )
    }

    const payload = await res.json() as StatusRebalancePayload
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
  } catch {
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
