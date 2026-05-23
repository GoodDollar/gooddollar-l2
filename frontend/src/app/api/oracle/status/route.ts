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
import { lastSessionAnchorMs } from '@/lib/sessionAnchor'

export const runtime = 'nodejs'

const PRICE_SERVICE_URL = process.env.PRICE_SERVICE_URL ?? process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? 'http://localhost:9300'
const ORACLE_SIGNER_URL = process.env.ORACLE_SIGNER_URL ?? 'http://localhost:9107'
const TIMEOUT_MS = 5000

type QuoteRow = {
  symbol: string
  lastUpdateMs: number
  sessionState: string
  confidence: number
  sessionAsOfMs?: number
}
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
export type RailStatusPayload = {
  enabled: boolean
  lastSuccessAtMs: number | null
  lastSuccessAgeMs: number | null
  lastFailureAtMs: number | null
  lastFailureAgeMs: number | null
}
export type ServicePayload = { status: 'ok' | 'degraded' | 'unknown'; reason?: string }
export type ChainPayload = {
  chainId: number | null
  rpcEndpoint?: string
  signerAddress: string | null
  oracleAddresses: { stocks: string | null; crypto: string | null }
}
type ProofPayload = {
  generatedAt: number
  stocks: ProofTail[]
  crypto: ProofTail[]
  ingest?: IngestStatsPayload
  failures?: { stocks?: ProofFailurePayload[]; crypto?: ProofFailurePayload[] }
  counts?: { stocks?: RailCountsPayload; crypto?: RailCountsPayload }
  rails?: { stocks?: unknown; crypto?: unknown }
  service?: unknown
  chain?: unknown
}

export const DEFAULT_SERVICE: ServicePayload = { status: 'unknown' }
export const DEFAULT_CHAIN: ChainPayload = {
  chainId: null,
  signerAddress: null,
  oracleAddresses: { stocks: null, crypto: null },
}

const DEFAULT_RAIL_STATUS: RailStatusPayload = {
  enabled: false,
  lastSuccessAtMs: null,
  lastSuccessAgeMs: null,
  lastFailureAtMs: null,
  lastFailureAgeMs: null,
}

export const DEFAULT_RAILS: { stocks: RailStatusPayload; crypto: RailStatusPayload } = {
  stocks: { ...DEFAULT_RAIL_STATUS },
  crypto: { ...DEFAULT_RAIL_STATUS },
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

function pickRailStatus(raw: unknown): RailStatusPayload {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_RAIL_STATUS }
  const r = raw as Record<string, unknown>
  const num = (k: string): number | null => {
    const v = r[k]
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  }
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : false,
    lastSuccessAtMs: num('lastSuccessAtMs'),
    lastSuccessAgeMs: num('lastSuccessAgeMs'),
    lastFailureAtMs: num('lastFailureAtMs'),
    lastFailureAgeMs: num('lastFailureAgeMs'),
  }
}

function pickRails(p: ProofPayload | undefined): { stocks: RailStatusPayload; crypto: RailStatusPayload } {
  const r = p?.rails
  return {
    stocks: pickRailStatus(r?.stocks),
    crypto: pickRailStatus(r?.crypto),
  }
}

function pickService(p: ProofPayload | undefined): ServicePayload {
  const raw = p?.service
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SERVICE }
  const r = raw as Record<string, unknown>
  const status = r.status === 'ok' || r.status === 'degraded' ? r.status : 'unknown'
  const reason = typeof r.reason === 'string' ? r.reason : undefined
  return reason ? { status, reason } : { status }
}

function pickChain(p: ProofPayload | undefined): ChainPayload {
  const raw = p?.chain
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CHAIN, oracleAddresses: { stocks: null, crypto: null } }
  const r = raw as Record<string, unknown>
  const numOrNull = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null
  const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null)
  const addrs = r.oracleAddresses && typeof r.oracleAddresses === 'object'
    ? r.oracleAddresses as Record<string, unknown>
    : {}
  const out: ChainPayload = {
    chainId: numOrNull(r.chainId),
    signerAddress: strOrNull(r.signerAddress),
    oracleAddresses: {
      stocks: strOrNull(addrs.stocks),
      crypto: strOrNull(addrs.crypto),
    },
  }
  if (typeof r.rpcEndpoint === 'string') out.rpcEndpoint = r.rpcEndpoint
  return out
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

export type UpstreamStatus =
  | { status: 'ok'; label?: string }
  | { status: 'down'; reason: string; label?: string }

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

/**
 * Operator-readable label for the price-service upstream so the
 * OracleStatusBadge can render `Source: eToro demo → …` instead of
 * `Source: mock → …`. Read at request time so a `.env.local` change is
 * picked up without restarting Next.js.
 */
function readPriceSourceLabel(): string {
  const raw = process.env.NEXT_PUBLIC_PRICE_SOURCE_LABEL
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  return 'mock'
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

/**
 * Like `fetchJson`, but tolerates an HTTP 503 with a JSON body (the
 * oracle-signer's documented degraded contract). Returns `{ data, ok: true }`
 * for 200 and `{ data, ok: false }` for 503 — every other status throws.
 * Only used for `/proof` so a degraded-but-reachable signer can still forward
 * its `service` reason instead of being treated as totally down.
 */
async function fetchJsonAllowDegraded<T>(url: string): Promise<{ data: T; ok: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    if (res.status === 200 || res.status === 503) {
      const data = (await res.json()) as T
      return { data, ok: res.status === 200 }
    }
    throw new Error(`upstream ${url} returned ${res.status}`)
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
    fetchJsonAllowDegraded<ProofPayload>(`${ORACLE_SIGNER_URL}/proof`),
  ])

  const priceSourceLabel = readPriceSourceLabel()
  const upstreams = {
    priceService: { ...buildUpstream(quotesRes), label: priceSourceLabel },
    oracleSigner: buildUpstream(proofRes),
  }

  const quotesOk = quotesRes.status === 'fulfilled'
  // `proofReachable` is whether the signer responded at all (200 OR 503-with-body).
  // The signer is "down" only when the helper threw (network error / non-200/503).
  // `proofServiceOk` is whether the signer itself is healthy (200) — different axis.
  const proofReachable = proofRes.status === 'fulfilled'
  const proofData: ProofPayload | undefined = proofReachable ? proofRes.value.data : undefined
  const proofServiceOk = proofReachable && proofRes.value.ok

  if (!quotesOk && !proofReachable) {
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
        rails: { stocks: { ...DEFAULT_RAIL_STATUS }, crypto: { ...DEFAULT_RAIL_STATUS } },
        service: { ...DEFAULT_SERVICE },
        chain: { ...DEFAULT_CHAIN, oracleAddresses: { stocks: null, crypto: null } },
        freshCount: 0,
        totalCount: 0,
        upstreams,
        timestamp: Date.now(),
      },
      { status: 503 },
    )
  }

  const quotes = quotesOk ? (quotesRes.value.quotes ?? []) : []
  const proof = proofData
    ? {
        generatedAt: proofData.generatedAt ?? Date.now(),
        stocks: Array.isArray(proofData.stocks) ? proofData.stocks : [],
        crypto: Array.isArray(proofData.crypto) ? proofData.crypto : [],
      }
    : EMPTY_PROOF
  const ingest = proofData ? pickIngest(proofData) : { ...DEFAULT_INGEST }
  const failures = proofData ? pickFailures(proofData) : { stocks: [], crypto: [] }
  const counts = proofData ? pickCounts(proofData) : { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } }
  const rails = proofData
    ? pickRails(proofData)
    : { stocks: { ...DEFAULT_RAIL_STATUS }, crypto: { ...DEFAULT_RAIL_STATUS } }
  const service = proofData ? pickService(proofData) : { ...DEFAULT_SERVICE }
  const chain = proofData ? pickChain(proofData) : { ...DEFAULT_CHAIN, oracleAddresses: { stocks: null, crypto: null } }

  const healthy = quotesOk && proofServiceOk && (quotesRes.value.healthy ?? true)
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
    rails,
    service,
    chain,
    freshCount,
    totalCount,
    timestamp: quotesOk ? (quotesRes.value.timestamp ?? Date.now()) : Date.now(),
    upstreams,
  })
}

export const GET = withApiRateLimit(handleGet)
