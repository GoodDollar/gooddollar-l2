/**
 * GET /api/oracle/status
 *
 * Merges two upstream feeds into a single status payload for the frontend:
 *
 *   - `price-service` `/status/quotes` — per-symbol off-chain freshness data
 *   - `oracle-signer`  `/proof`        — most-recent on-chain submissions
 *
 * Resilience: both fetches use `Promise.allSettled` so a single rail outage
 * never blocks the other. When at least one upstream succeeds the route
 * returns 200 with a `degraded: true` flag and the missing sections present
 * but empty. Only when both upstreams fail do we 503.
 */

import { NextResponse, type NextRequest } from 'next/server'

import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL ?? process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? 'http://localhost:9300'
const ORACLE_SIGNER_URL = process.env.ORACLE_SIGNER_URL ?? 'http://localhost:9107'
const TIMEOUT_MS = 5000

type QuoteRow = { symbol: string; lastUpdateMs: number; sessionState: string; confidence: number }
type ProofTail = {
  rail: 'stocks' | 'crypto'
  txHash: string
  blockNumber: number
  gasUsed: string
  symbols: string[]
  roundTripMs: number
  submittedAtMs: number
  mids: Record<string, number>
}
export type IngestStatsPayload = {
  accepted: number
  droppedJsonParse: number
  droppedShape: number
  droppedInvalidMid: number
  droppedMissingSymbol: number
  lastDroppedAtMs?: number
  lastDroppedReason?: string
  lastDroppedSnippet?: string
}
export type ProofFailurePayload = {
  rail: 'stocks' | 'crypto'
  reason: string
  errorClass?: string
  symbols: string[]
  attemptedAtMs: number
}
export type RailCountsPayload = { ok: number; failed: number }
type ProofPayload = {
  generatedAt: number
  stocks: ProofTail[]
  crypto: ProofTail[]
  ingest?: IngestStatsPayload
  failures?: { stocks?: ProofFailurePayload[]; crypto?: ProofFailurePayload[] }
  counts?: { stocks?: RailCountsPayload; crypto?: RailCountsPayload }
}

export const DEFAULT_INGEST: IngestStatsPayload = {
  accepted: 0,
  droppedJsonParse: 0,
  droppedShape: 0,
  droppedInvalidMid: 0,
  droppedMissingSymbol: 0,
}

function pickFailures(p: ProofPayload | undefined): { stocks: ProofFailurePayload[]; crypto: ProofFailurePayload[] } {
  const f = p?.failures
  return {
    stocks: Array.isArray(f?.stocks) ? f!.stocks as ProofFailurePayload[] : [],
    crypto: Array.isArray(f?.crypto) ? f!.crypto as ProofFailurePayload[] : [],
  }
}

function pickCounts(p: ProofPayload | undefined): { stocks: RailCountsPayload; crypto: RailCountsPayload } {
  const c = p?.counts
  const safe = (raw: unknown): RailCountsPayload => {
    if (!raw || typeof raw !== 'object') return { ok: 0, failed: 0 }
    const r = raw as Record<string, unknown>
    const num = (k: string): number => (typeof r[k] === 'number' && Number.isFinite(r[k] as number) ? (r[k] as number) : 0)
    return { ok: num('ok'), failed: num('failed') }
  }
  return { stocks: safe(c?.stocks), crypto: safe(c?.crypto) }
}

function pickIngest(p: { ingest?: unknown } | undefined): IngestStatsPayload {
  const raw = p?.ingest
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_INGEST }
  const r = raw as Record<string, unknown>
  const num = (k: string): number => (typeof r[k] === 'number' && Number.isFinite(r[k] as number) ? (r[k] as number) : 0)
  const optStr = (k: string): string | undefined => (typeof r[k] === 'string' ? (r[k] as string) : undefined)
  const optNum = (k: string): number | undefined => (typeof r[k] === 'number' && Number.isFinite(r[k] as number) ? (r[k] as number) : undefined)
  return {
    accepted: num('accepted'),
    droppedJsonParse: num('droppedJsonParse'),
    droppedShape: num('droppedShape'),
    droppedInvalidMid: num('droppedInvalidMid'),
    droppedMissingSymbol: num('droppedMissingSymbol'),
    lastDroppedAtMs: optNum('lastDroppedAtMs'),
    lastDroppedReason: optStr('lastDroppedReason'),
    lastDroppedSnippet: optStr('lastDroppedSnippet'),
  }
}

export type UpstreamStatus = { status: 'ok' } | { status: 'down'; reason: string }

const REASON_MAX_LEN = 200

/**
 * Reduce an upstream rejection to a short, operator-readable string suitable
 * for inclusion in a public HTTP body. Strips long hex sequences (signer keys,
 * addresses), collapses newlines, and clamps length so a stack trace or an
 * accidentally-leaked credential never escapes.
 */
export function redactUpstreamReason(err: unknown): string {
  let raw: string
  if (err instanceof Error) {
    const cause = (err as { cause?: { code?: unknown } }).cause
    const code = cause && typeof cause.code === 'string' ? cause.code : null
    raw = code ? `${code}: ${err.message}` : err.message
  } else {
    raw = String(err)
  }
  const oneLine = raw.replace(/\r?\n/g, ' ')
  const redactedHex = oneLine.replace(/0x[0-9a-fA-F]{40,}/g, '<redacted-hex>')
  return redactedHex.length > REASON_MAX_LEN ? redactedHex.slice(0, REASON_MAX_LEN) : redactedHex
}

function buildUpstream(settled: PromiseSettledResult<unknown>): UpstreamStatus {
  if (settled.status === 'fulfilled') {
    return { status: 'ok' }
  }
  return { status: 'down', reason: redactUpstreamReason(settled.reason) }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`upstream ${url} returned ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

type QuotesPayload = {
  healthy?: boolean
  freshCount?: number
  totalCount?: number
  quotes?: QuoteRow[]
  timestamp?: number
}

const EMPTY_PROOF: ProofPayload = { generatedAt: 0, stocks: [], crypto: [] }

async function handleGet(_req?: NextRequest) {
  const [quotesRes, proofRes] = await Promise.allSettled([
    fetchJson<QuotesPayload>(`${PRICE_SERVICE_URL}/status/quotes`),
    fetchJson<ProofPayload>(`${ORACLE_SIGNER_URL}/proof`),
  ])

  const upstreams = {
    priceService: buildUpstream(quotesRes),
    oracleSigner: buildUpstream(proofRes),
  }

  const quotesOk = quotesRes.status === 'fulfilled'
  const proofOk = proofRes.status === 'fulfilled'

  if (!quotesOk && !proofOk) {
    return NextResponse.json(
      {
        error: 'Oracle status unavailable',
        healthy: false,
        degraded: true,
        quotes: [],
        proof: EMPTY_PROOF,
        ingest: { ...DEFAULT_INGEST },
        failures: { stocks: [], crypto: [] },
        counts: { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } },
        freshCount: 0,
        totalCount: 0,
        upstreams,
        timestamp: Date.now(),
      },
      { status: 503 },
    )
  }

  const quotes = quotesOk ? (quotesRes.value.quotes ?? []) : []
  const proof = proofOk
    ? {
        generatedAt: proofRes.value.generatedAt ?? Date.now(),
        stocks: Array.isArray(proofRes.value.stocks) ? proofRes.value.stocks : [],
        crypto: Array.isArray(proofRes.value.crypto) ? proofRes.value.crypto : [],
      }
    : EMPTY_PROOF
  const ingest = proofOk ? pickIngest(proofRes.value) : { ...DEFAULT_INGEST }
  const failures = proofOk ? pickFailures(proofRes.value) : { stocks: [], crypto: [] }
  const counts = proofOk ? pickCounts(proofRes.value) : { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } }

  const healthy = quotesOk && proofOk && (quotesRes.value.healthy ?? true)
  const freshCount = quotesOk ? (quotesRes.value.freshCount ?? quotes.length) : 0
  const totalCount = quotesOk ? (quotesRes.value.totalCount ?? quotes.length) : 0

  return NextResponse.json({
    healthy,
    degraded: !healthy,
    generatedAt: Date.now(),
    quotes,
    proof,
    ingest,
    failures,
    counts,
    freshCount,
    totalCount,
    timestamp: quotesOk ? (quotesRes.value.timestamp ?? Date.now()) : Date.now(),
    upstreams,
  })
}

export const GET = withApiRateLimit(handleGet)
