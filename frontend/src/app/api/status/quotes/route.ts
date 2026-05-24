import { NextResponse, type NextRequest } from 'next/server'

import { resolvePriceServiceStatusUrl } from '@/lib/priceServiceStatusUrl'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const QUOTE_STATUS_URL = resolvePriceServiceStatusUrl(process.env.PRICE_SERVICE_URL)
const TIMEOUT_MS = 5000
const APPROX_BLOCK_MS = 12_000

type SyncProduct = 'amm' | 'perps' | 'prediction' | 'lend' | 'yield'

interface UpstreamQuote {
  symbol?: string
  lastUpdateMs?: number
  sessionState?: string
  confidence?: number
  oracleBlock?: number
  divergenceBps?: number
  productSync?: Partial<Record<SyncProduct, { lastSyncedBlock?: number; value?: number }>>
}

interface UpstreamQuoteStatus {
  healthy?: boolean
  freshCount?: number
  totalCount?: number
  quotes?: UpstreamQuote[]
  timestamp?: number
}

function normalizeQuoteStatus(data: UpstreamQuoteStatus, now = Date.now()) {
  const timestamp = Number.isFinite(data.timestamp) ? Number(data.timestamp) : now
  const oracleBlock = Math.max(1, Math.floor(timestamp / APPROX_BLOCK_MS))
  const quotes = Array.isArray(data.quotes) ? data.quotes : []

  const normalizedQuotes = quotes
    .filter((q): q is UpstreamQuote & { symbol: string } => typeof q.symbol === 'string' && q.symbol.length > 0)
    .map((q) => {
      const productSync: Record<SyncProduct, { lastSyncedBlock: number; value?: number }> = {
        amm: { lastSyncedBlock: oracleBlock },
        perps: { lastSyncedBlock: oracleBlock },
        prediction: { lastSyncedBlock: oracleBlock },
        lend: { lastSyncedBlock: oracleBlock },
        yield: { lastSyncedBlock: oracleBlock },
      }
      for (const product of Object.keys(productSync) as SyncProduct[]) {
        const lastSyncedBlock = q.productSync?.[product]?.lastSyncedBlock
        if (Number.isFinite(lastSyncedBlock) && Number(lastSyncedBlock) > 0) {
          productSync[product].lastSyncedBlock = Math.floor(Number(lastSyncedBlock))
        }
        const value = q.productSync?.[product]?.value
        if (Number.isFinite(value)) {
          productSync[product].value = Number(value)
        }
      }

      return {
        symbol: q.symbol.toUpperCase(),
        lastUpdateMs: Number.isFinite(q.lastUpdateMs) ? Number(q.lastUpdateMs) : 0,
        sessionState: typeof q.sessionState === 'string' ? q.sessionState : 'unknown',
        confidence: Number.isFinite(q.confidence) ? Number(q.confidence) : 0,
        oracleBlock: Number.isFinite(q.oracleBlock) ? Math.floor(Number(q.oracleBlock)) : oracleBlock,
        divergenceBps: Number.isFinite(q.divergenceBps) ? Number(q.divergenceBps) : 0,
        productSync,
      }
    })

  return {
    healthy: Boolean(data.healthy),
    freshCount: Number.isFinite(data.freshCount) ? Number(data.freshCount) : 0,
    totalCount: Number.isFinite(data.totalCount) ? Number(data.totalCount) : normalizedQuotes.length,
    timestamp,
    currentOracleBlock: oracleBlock,
    quotes: normalizedQuotes,
  }
}

async function handleGet(_req: NextRequest) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(QUOTE_STATUS_URL, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Quote status endpoint returned an error', httpStatus: res.status },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(normalizeQuoteStatus(data))
  } catch {
    const fallback = normalizeQuoteStatus({
      healthy: false,
      freshCount: 0,
      totalCount: 0,
      quotes: [],
      timestamp: Date.now(),
    })
    return NextResponse.json(
      { error: 'Quote status unavailable', ...fallback },
      { status: 503 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
