import { NextResponse, type NextRequest } from 'next/server'

import { resolvePriceServiceStatusUrl } from '@/lib/priceServiceStatusUrl'
import { getOrFetchOracleStatus } from '@/lib/oracleStatusCache'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

export const runtime = 'nodejs'

const PRICE_SERVICE_STATUS_URL = resolvePriceServiceStatusUrl(
  process.env.PRICE_SERVICE_URL ?? process.env.NEXT_PUBLIC_PRICE_SERVICE_URL,
)
const TIMEOUT_MS = 5000
const CACHE_KEY = 'oracle-status:default'

function resolveOracleProofUrl(): string {
  const explicit = process.env.ORACLE_SIGNER_PROOF_URL?.trim()
  if (explicit) return explicit

  const raw = (process.env.ORACLE_SIGNER_URL ?? 'http://localhost:9107').trim().replace(/\/+$/, '')
  if (raw.endsWith('/proof')) return raw
  if (raw.endsWith('/health')) return raw.slice(0, -'/health'.length) + '/proof'
  return `${raw}/proof`
}

const ORACLE_SIGNER_PROOF_URL = resolveOracleProofUrl()

const EMPTY_PROOF = { stocks: [], crypto: [] }
const EMPTY_INGEST = {
  accepted: 0,
  droppedJsonParse: 0,
  droppedShape: 0,
  droppedInvalidMid: 0,
  droppedMissingSymbol: 0,
}
const EMPTY_FAILURES = { stocks: [], crypto: [] }
const EMPTY_COUNTS = { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } }
const EMPTY_RAIL = {
  enabled: false,
  lastSuccessAtMs: null,
  lastSuccessAgeMs: null,
  lastFailureAtMs: null,
  lastFailureAgeMs: null,
}
const EMPTY_RAILS = { stocks: EMPTY_RAIL, crypto: EMPTY_RAIL }
const EMPTY_SERVICE = { status: 'unknown' }
const EMPTY_CHAIN = {
  chainId: null,
  signerAddress: null,
  oracleAddresses: { stocks: null, crypto: null },
}

type UpstreamResult =
  | { ok: true; data: any; degradedHttp?: boolean }
  | { ok: false; reason: string }

class BothUpstreamsDown extends Error {
  constructor(public readonly result: OracleStatusResult) {
    super('both oracle-status upstreams down')
  }
}

interface OracleStatusResult {
  statusCode: number
  body: Record<string, any>
}

export function redactUpstreamReason(err: unknown): string {
  const causeCode = (err as { cause?: { code?: string } } | null)?.cause?.code
  const base = err instanceof Error ? err.message : String(err)
  const withCode = causeCode ? `${causeCode}: ${base}` : base
  return withCode
    .replace(/\s+/g, ' ')
    .replace(/0x[a-fA-F0-9]{40,}/g, '<redacted-hex>')
    .slice(0, 200)
}

async function fetchJson(url: string, allow503Json = false): Promise<UpstreamResult> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok && !(allow503Json && res.status === 503)) {
      return { ok: false, reason: `returned ${res.status}` }
    }

    try {
      return { ok: true, data: await res.json(), degradedHttp: res.status === 503 }
    } catch (err) {
      return { ok: false, reason: redactUpstreamReason(err) }
    }
  } catch (err) {
    return { ok: false, reason: redactUpstreamReason(err) }
  }
}

function isRecord(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : []
}

function sanitizeQuotes(data: any): any[] {
  return asArray(data?.quotes).map((q) => {
    if (!isRecord(q)) return q
    if (q.sessionState === 'closed' && typeof q.sessionAsOfMs !== 'number') {
      return { ...q, sessionAsOfMs: Date.now() }
    }
    return q
  })
}

function sanitizeIngest(v: unknown) {
  if (!isRecord(v)) return { ...EMPTY_INGEST }
  return {
    ...EMPTY_INGEST,
    ...Object.fromEntries(Object.entries(v).filter(([, val]) => typeof val === 'number' || typeof val === 'string')),
  }
}

function sanitizeFailures(v: unknown) {
  if (!isRecord(v)) return { ...EMPTY_FAILURES }
  return { stocks: asArray(v.stocks), crypto: asArray(v.crypto) }
}

function countRail(v: unknown) {
  if (!isRecord(v)) return { ok: 0, failed: 0 }
  return {
    ok: typeof v.ok === 'number' ? v.ok : 0,
    failed: typeof v.failed === 'number' ? v.failed : 0,
  }
}

function sanitizeCounts(v: unknown) {
  if (!isRecord(v)) return { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } }
  return { stocks: countRail(v.stocks), crypto: countRail(v.crypto) }
}

function sanitizeRail(v: unknown) {
  if (!isRecord(v) || typeof v.enabled !== 'boolean') return { ...EMPTY_RAIL }
  return {
    enabled: v.enabled,
    lastSuccessAtMs: typeof v.lastSuccessAtMs === 'number' ? v.lastSuccessAtMs : null,
    lastSuccessAgeMs: typeof v.lastSuccessAgeMs === 'number' ? v.lastSuccessAgeMs : null,
    lastFailureAtMs: typeof v.lastFailureAtMs === 'number' ? v.lastFailureAtMs : null,
    lastFailureAgeMs: typeof v.lastFailureAgeMs === 'number' ? v.lastFailureAgeMs : null,
  }
}

function sanitizeRails(v: unknown) {
  if (!isRecord(v)) return { stocks: { ...EMPTY_RAIL }, crypto: { ...EMPTY_RAIL } }
  return { stocks: sanitizeRail(v.stocks), crypto: sanitizeRail(v.crypto) }
}

function sanitizeService(v: unknown) {
  if (!isRecord(v) || (v.status !== 'ok' && v.status !== 'degraded' && v.status !== 'health-only')) {
    return { ...EMPTY_SERVICE }
  }
  const out: { status: 'ok' | 'degraded' | 'health-only'; reason?: string } = { status: v.status }
  if (v.status !== 'ok' && typeof v.reason === 'string') out.reason = redactUpstreamReason(v.reason)
  return out
}

function sanitizeChain(v: unknown) {
  if (!isRecord(v)) return { ...EMPTY_CHAIN, oracleAddresses: { ...EMPTY_CHAIN.oracleAddresses } }
  const oracleAddresses = isRecord(v.oracleAddresses) ? v.oracleAddresses : {}
  return {
    chainId: typeof v.chainId === 'number' ? v.chainId : null,
    ...(typeof v.rpcEndpoint === 'string' ? { rpcEndpoint: v.rpcEndpoint } : {}),
    signerAddress: typeof v.signerAddress === 'string' ? v.signerAddress : null,
    oracleAddresses: {
      stocks: typeof oracleAddresses.stocks === 'string' ? oracleAddresses.stocks : null,
      crypto: typeof oracleAddresses.crypto === 'string' ? oracleAddresses.crypto : null,
    },
  }
}

async function buildOracleStatus(): Promise<OracleStatusResult> {
  const [price, proof] = await Promise.all([
    fetchJson(PRICE_SERVICE_STATUS_URL),
    fetchJson(ORACLE_SIGNER_PROOF_URL, true),
  ])

  const priceOk = price.ok
  const proofOk = proof.ok
  const proofData = proofOk ? proof.data : {}
  const service = sanitizeService(proofData?.service)
  const bothDown = !priceOk && !proofOk

  const body = {
    healthy: priceOk && proofOk && (service.status === 'ok' || service.status === 'unknown'),
    degraded: bothDown || !priceOk || !proofOk || service.status === 'degraded' || service.status === 'health-only',
    quotes: priceOk ? sanitizeQuotes(price.data) : [],
    freshCount: priceOk && typeof price.data?.freshCount === 'number' ? price.data.freshCount : 0,
    totalCount: priceOk && typeof price.data?.totalCount === 'number' ? price.data.totalCount : 0,
    timestamp: Date.now(),
    proof: proofOk ? { stocks: asArray(proofData?.stocks), crypto: asArray(proofData?.crypto) } : { ...EMPTY_PROOF },
    ingest: proofOk ? sanitizeIngest(proofData?.ingest) : { ...EMPTY_INGEST },
    failures: proofOk ? sanitizeFailures(proofData?.failures) : { ...EMPTY_FAILURES },
    counts: proofOk ? sanitizeCounts(proofData?.counts) : { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } },
    rails: proofOk ? sanitizeRails(proofData?.rails) : { stocks: { ...EMPTY_RAIL }, crypto: { ...EMPTY_RAIL } },
    service,
    chain: proofOk ? sanitizeChain(proofData?.chain) : { ...EMPTY_CHAIN, oracleAddresses: { ...EMPTY_CHAIN.oracleAddresses } },
    upstreams: {
      priceService: priceOk
        ? { status: 'ok', label: process.env.NEXT_PUBLIC_PRICE_SOURCE_LABEL ?? 'mock' }
        : { status: 'down', label: process.env.NEXT_PUBLIC_PRICE_SOURCE_LABEL ?? 'mock', reason: price.reason },
      oracleSigner: proofOk ? { status: 'ok' } : { status: 'down', reason: proof.reason },
    },
  }

  const result = { statusCode: bothDown ? 503 : 200, body }
  if (bothDown) throw new BothUpstreamsDown(result)
  return result
}

async function handleGet(_req: NextRequest) {
  const ttlMs = Number(process.env.ORACLE_STATUS_CACHE_MS ?? '0') || 0
  try {
    const result = await getOrFetchOracleStatus(CACHE_KEY, buildOracleStatus, ttlMs)
    return NextResponse.json(result.body, { status: result.statusCode })
  } catch (err) {
    if (err instanceof BothUpstreamsDown) {
      return NextResponse.json(err.result.body, { status: err.result.statusCode })
    }
    return NextResponse.json(
      {
        healthy: false,
        degraded: true,
        quotes: [],
        proof: { ...EMPTY_PROOF },
        ingest: { ...EMPTY_INGEST },
        failures: { ...EMPTY_FAILURES },
        counts: { stocks: { ok: 0, failed: 0 }, crypto: { ok: 0, failed: 0 } },
        rails: { stocks: { ...EMPTY_RAIL }, crypto: { ...EMPTY_RAIL } },
        service: { ...EMPTY_SERVICE },
        chain: { ...EMPTY_CHAIN, oracleAddresses: { ...EMPTY_CHAIN.oracleAddresses } },
        upstreams: {
          priceService: { status: 'down', label: process.env.NEXT_PUBLIC_PRICE_SOURCE_LABEL ?? 'mock', reason: redactUpstreamReason(err) },
          oracleSigner: { status: 'down', reason: redactUpstreamReason(err) },
        },
        timestamp: Date.now(),
      },
      { status: 503 },
    )
  }
}

export const GET = withApiRateLimit(handleGet)
