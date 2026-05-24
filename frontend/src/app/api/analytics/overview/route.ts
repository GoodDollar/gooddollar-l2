import { promises as fs } from 'fs'
import path from 'path'

import { NextResponse, type NextRequest } from 'next/server'

import { methodNotAllowed } from '@/lib/api-error'
import { DEVNET_RPC_URL } from '@/lib/devnet'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

/**
 * Iter 27 — `/api/analytics/overview`.
 *
 * Read-only join of six already-public data surfaces, served as a single
 * JSON document so the `/analytics` page can render every panel from one
 * round-trip. Each sub-source carries its own `ok: boolean` so a failure in
 * one upstream (typically the indexer or RPC) never blanks the page.
 *
 * Inputs:
 *   - `analytics/address-book.json` (committed by iter 26, read from disk).
 *   - `STATUS_AGGREGATOR_URL`        (default `http://localhost:9200/status.json`).
 *   - `INDEXER_API_URL`              (default `http://127.0.0.1:4200`).
 *   - `DEVNET_RPC_URL`               (already used by `/api/rpc`).
 *   - `PRICE_SERVICE_REST_URL`       (default `http://localhost:9300`)
 *       — task 0063, lane-1 price-feed pillar. Reads `/health` and
 *       `/status/quotes` in parallel and joins them into one envelope.
 *   - `ORACLE_SIGNER_HEALTH_URL`     (default `http://localhost:9107/health`)
 *       — task 0063, lane-1 oracle submitter health.
 *
 * Output: see `AnalyticsOverview` below.
 *
 * See:
 *   - `.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *      0038-iter27-internal-analytics-dashboard.md`
 *   - `.autobuilder/initiatives/0007a-etoro-connectivity/tasks/
 *      0063-analytics-dashboard-omits-lane1-price-feed-panel.md`
 *   - `docs/TESTNET-READINESS-50-ITERATIONS.md` (row 27)
 */

export const runtime = 'nodejs'
// Cache for 10 s on the edge / Next data cache, allow a 30 s grace window
// so the page is cheap to refresh and the upstreams are not hammered.
export const revalidate = 10

const STATUS_URL =
  process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json'
const INDEXER_URL = process.env.INDEXER_API_URL ?? 'http://127.0.0.1:4200'
const PRICE_SERVICE_REST_URL =
  process.env.PRICE_SERVICE_REST_URL ?? 'http://localhost:9300'
const ORACLE_SIGNER_HEALTH_URL =
  process.env.ORACLE_SIGNER_HEALTH_URL ?? 'http://localhost:9107/health'
const TIMEOUT_MS = 4_000

// ─── Address book (committed by iter 26) ─────────────────────────────────────

interface AddressBookContract {
  address: string
  name: string
}
interface AddressBookProtocol {
  label: string
  contracts: AddressBookContract[]
}
interface AddressBookFeeRoute {
  id: number
  protocol: string
  label: string
  kind: string
  source_contract: string
  source_address: string
  source_address_pending_deploy: boolean
  sink_contract: string
  sink_address: string
  sink_method: string
  event_contract: string
  event_contract_deployed: boolean
  event_signature: string
  event_topic0: string
  fee_token: string
}
interface AddressBookNotes {
  fee_split_bps: { protocol: number; ubi: number }
  specialised_splitters_pending: string[]
  ubi_breakdown_doc?: {
    g_dollar_treasury_bps: number
    human_ubi_pool_bps: number
    validator_rewards_bps: number
  }
  ubi_split_doc?: string
}
interface AddressBook {
  version: string
  generated_at: string
  protocols: Record<string, AddressBookProtocol>
  fee_routes: AddressBookFeeRoute[]
  notes: AddressBookNotes
}

let addressBookCache:
  | { data: AddressBook; loadedAt: number; path: string }
  | null = null

async function loadAddressBook(): Promise<AddressBook> {
  if (addressBookCache && Date.now() - addressBookCache.loadedAt < 60_000) {
    return addressBookCache.data
  }
  // The file is in the repo root at `<repo>/analytics/address-book.json`.
  // In dev (`next dev`) and in prod (`next start`), `process.cwd()` is the
  // `frontend/` directory, so the repo root is `..`.
  const repoRoot = path.resolve(process.cwd(), '..')
  const filePath = path.join(repoRoot, 'analytics', 'address-book.json')
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as AddressBook
  addressBookCache = { data: parsed, loadedAt: Date.now(), path: filePath }
  return parsed
}

// ─── Sub-source fetchers ─────────────────────────────────────────────────────

interface StatusSource {
  ok: boolean
  overall?: 'healthy' | 'degraded' | 'down' | 'unknown'
  healthy?: number
  total?: number
  aggregatorUptime?: number
  chainBlock?: number
  lastChecked?: number
  error?: string
}

async function fetchStatus(): Promise<StatusSource> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(STATUS_URL, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    const data = await res.json()
    const services: unknown[] = Array.isArray(data.services) ? data.services : []
    const healthy =
      typeof data.healthy === 'number'
        ? data.healthy
        : services.filter(
            (s: unknown) =>
              s != null &&
              typeof s === 'object' &&
              (s as { status?: string }).status === 'healthy',
          ).length
    const total = typeof data.total === 'number' ? data.total : services.length
    return {
      ok: true,
      overall: data.overall ?? 'unknown',
      healthy,
      total,
      aggregatorUptime: data.aggregatorUptime,
      chainBlock: typeof data.chainBlock === 'number' ? data.chainBlock : undefined,
      lastChecked: data.lastChecked,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    }
  } finally {
    clearTimeout(timer)
  }
}

interface IndexerProtocolRow {
  protocol: string
  total_events: number
  last_event_block: number
  last_updated: number
}
interface IndexerTopEvent {
  event_name: string
  cnt: number
}
interface IndexerSource {
  ok: boolean
  lastBlock?: number
  totalEvents?: number
  protocols?: IndexerProtocolRow[]
  topEvents?: IndexerTopEvent[]
  error?: string
}

async function fetchIndexer(): Promise<IndexerSource> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${INDEXER_URL}/api/overview`, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    const body = (await res.json()) as {
      ok?: boolean
      data?: {
        lastBlock?: number
        totalEvents?: number
        protocols?: IndexerProtocolRow[]
        topEvents?: IndexerTopEvent[]
      }
      error?: string
    }
    if (!body.ok || !body.data) {
      return { ok: false, error: body.error ?? 'indexer returned ok=false' }
    }
    return {
      ok: true,
      lastBlock: body.data.lastBlock,
      totalEvents: body.data.totalEvents,
      protocols: body.data.protocols ?? [],
      topEvents: body.data.topEvents ?? [],
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    }
  } finally {
    clearTimeout(timer)
  }
}

interface ChainSource {
  ok: boolean
  blockNumber?: number
  error?: string
}

async function fetchChain(): Promise<ChainSource> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(DEVNET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    const body = (await res.json()) as { result?: string; error?: { message?: string } }
    if (body.error) {
      return { ok: false, error: body.error.message ?? 'rpc error' }
    }
    if (typeof body.result !== 'string') {
      return { ok: false, error: 'malformed rpc response' }
    }
    return { ok: true, blockNumber: parseInt(body.result, 16) }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Lane-1 price feed (task 0063) ───────────────────────────────────────────

interface PriceFeedSource {
  ok: boolean
  mode?: string
  freshQuotes?: number
  totalSymbols?: number
  medianDivergenceBps?: number | null
  lastUpdateMs?: number
  healthyFlag?: boolean
  status?: string
  error?: string
}

interface PriceServiceHealthBody {
  status?: string
  mode?: string
  freshQuotes?: number
  totalCached?: number
  configuredSymbols?: number
  timestamp?: number
  reason?: string
}

interface PriceServiceQuotesBody {
  healthy?: boolean
  freshCount?: number
  totalCount?: number
  status?: string
  timestamp?: number
  quotes?: Array<{ symbol?: string; divergenceBps?: number }>
}

function median(values: number[]): number | null {
  const sorted = values
    .filter((n) => Number.isFinite(n))
    .slice()
    .sort((a, b) => a - b)
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

async function fetchPriceFeed(): Promise<PriceFeedSource> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const [healthRes, quotesRes] = await Promise.all([
      fetch(`${PRICE_SERVICE_REST_URL}/health`, {
        signal: ctrl.signal,
        cache: 'no-store',
      }),
      fetch(`${PRICE_SERVICE_REST_URL}/status/quotes`, {
        signal: ctrl.signal,
        cache: 'no-store',
      }),
    ])

    // Per task 0052, price-service returns 503 with body
    // `{status:"degraded"}` or `{status:"starting"}` — surface those as
    // `ok:false` but with the producer's reason intact.
    const healthBody =
      (await healthRes.json().catch(() => ({}))) as PriceServiceHealthBody
    const quotesBody =
      (await quotesRes.json().catch(() => ({}))) as PriceServiceQuotesBody

    const status = healthBody.status ?? (healthRes.ok ? 'ok' : 'error')
    const ok = healthRes.ok && status === 'ok'

    const divs =
      Array.isArray(quotesBody.quotes)
        ? quotesBody.quotes
            .map((q) => (typeof q.divergenceBps === 'number' ? q.divergenceBps : NaN))
            .filter((n) => Number.isFinite(n))
        : []

    return {
      ok,
      mode: typeof healthBody.mode === 'string' ? healthBody.mode : undefined,
      freshQuotes:
        typeof quotesBody.freshCount === 'number'
          ? quotesBody.freshCount
          : healthBody.freshQuotes,
      totalSymbols:
        typeof quotesBody.totalCount === 'number'
          ? quotesBody.totalCount
          : healthBody.configuredSymbols ?? healthBody.totalCached,
      medianDivergenceBps: median(divs),
      lastUpdateMs:
        typeof quotesBody.timestamp === 'number'
          ? quotesBody.timestamp
          : healthBody.timestamp,
      healthyFlag: Boolean(quotesBody.healthy),
      status,
      error: ok ? undefined : (healthBody.reason ?? `HTTP ${healthRes.status}`),
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    }
  } finally {
    clearTimeout(timer)
  }
}

interface OracleSubmitterSource {
  ok: boolean
  status: 'ok' | 'degraded' | 'unreachable'
  mode?: string
  reason?: string
  lastUpdateMs?: number
  configuredSymbols?: number
  error?: string
}

interface SignerHealthBody {
  ok?: boolean
  status?: string
  mode?: string
  reason?: string
  lastUpdateMs?: number
  configuredSymbols?: number
}

async function fetchOracleSubmitter(): Promise<OracleSubmitterSource> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ORACLE_SIGNER_HEALTH_URL, {
      signal: ctrl.signal,
      cache: 'no-store',
    })
    const body = (await res.json().catch(() => ({}))) as SignerHealthBody
    const status = body.status ?? (res.ok ? 'ok' : 'error')
    if (res.ok && (status === 'ok' || body.ok === true)) {
      return {
        ok: true,
        status: 'ok',
        mode: body.mode,
        lastUpdateMs: body.lastUpdateMs,
        configuredSymbols: body.configuredSymbols,
      }
    }
    return {
      ok: false,
      status: 'degraded',
      mode: body.mode,
      reason: body.reason,
      lastUpdateMs: body.lastUpdateMs,
      configuredSymbols: body.configuredSymbols,
      error: body.reason ?? `HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      ok: false,
      status: 'unreachable',
      error: err instanceof Error ? err.message : 'unknown',
    }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Derived computations ────────────────────────────────────────────────────

type LagStatus =
  | 'fresh'
  | 'stale'
  | 'far_behind'
  | 'db_ahead_of_chain'
  | 'unknown'

function computeLag(
  chain: ChainSource,
  indexer: IndexerSource,
): { lagBlocks: number | null; lagStatus: LagStatus } {
  if (
    !chain.ok ||
    !indexer.ok ||
    typeof chain.blockNumber !== 'number' ||
    typeof indexer.lastBlock !== 'number'
  ) {
    return { lagBlocks: null, lagStatus: 'unknown' }
  }
  const lag = chain.blockNumber - indexer.lastBlock
  if (lag < 0) return { lagBlocks: lag, lagStatus: 'db_ahead_of_chain' }
  if (lag < 1_000) return { lagBlocks: lag, lagStatus: 'fresh' }
  if (lag < 10_000) return { lagBlocks: lag, lagStatus: 'stale' }
  return { lagBlocks: lag, lagStatus: 'far_behind' }
}

interface UbiBlock {
  totalRoutes: number
  routes: AddressBookFeeRoute[]
  pendingCount: number
  pendingSplitters: string[]
  feeSplitBps: { protocol: number; ubi: number }
  ubiBreakdownBps?: {
    g_dollar_treasury_bps: number
    human_ubi_pool_bps: number
    validator_rewards_bps: number
  }
  splitDoc?: string
}

function buildUbiBlock(book: AddressBook): UbiBlock {
  const pendingFromRoutes = book.fee_routes.filter(
    (r) => r.source_address_pending_deploy,
  ).length
  const pendingFromNotes = book.notes.specialised_splitters_pending?.length ?? 0
  return {
    totalRoutes: book.fee_routes.length,
    routes: book.fee_routes,
    // Use the larger of the two so we don't under-report. The notes list
    // (5 splitters today) is the authoritative source per iter 26.
    pendingCount: Math.max(pendingFromRoutes, pendingFromNotes),
    pendingSplitters: book.notes.specialised_splitters_pending ?? [],
    feeSplitBps: book.notes.fee_split_bps,
    ubiBreakdownBps: book.notes.ubi_breakdown_doc,
    splitDoc: book.notes.ubi_split_doc,
  }
}

interface ProtocolSummary {
  key: string
  label: string
  count: number
  sampleContracts: AddressBookContract[]
}

function buildProtocols(book: AddressBook): ProtocolSummary[] {
  return Object.entries(book.protocols)
    .map(([key, proto]) => ({
      key,
      label: proto.label,
      count: proto.contracts.length,
      sampleContracts: proto.contracts.slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)
}

// ─── Handler ─────────────────────────────────────────────────────────────────

async function handleGet(_req: NextRequest) {
  let book: AddressBook
  try {
    book = await loadAddressBook()
  } catch (err) {
    // The address book is the ONE source the dashboard cannot live without,
    // since the protocols/ubi panels are derived from it. Return 500 here so
    // the page can show a clear "address book missing" error.
    return NextResponse.json(
      {
        ok: false,
        error: 'address_book_unavailable',
        message: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 },
    )
  }

  // Fetch the five live sub-sources in parallel so a slow one doesn't
  // serialise the others. The two lane-1 fetchers were added by task 0063;
  // they read price-service `/health` + `/status/quotes` and the oracle-
  // signer `/health` envelope directly so the panel surfaces quote-shape
  // signals that the lossy status-aggregator rollup discards.
  const [status, indexer, chain, priceFeed, oracleSubmitter] = await Promise.all([
    fetchStatus(),
    fetchIndexer(),
    fetchChain(),
    fetchPriceFeed(),
    fetchOracleSubmitter(),
  ])

  const { lagBlocks, lagStatus } = computeLag(chain, indexer)
  const ubi = buildUbiBlock(book)
  const protocols = buildProtocols(book)

  const totalContracts = protocols.reduce((acc, p) => acc + p.count, 0)

  const body = {
    ok: true,
    summary: {
      totalProtocols: protocols.length,
      totalContracts,
      addressBookVersion: book.version,
      addressBookGeneratedAt: book.generated_at,
      generatedAt: new Date().toISOString(),
    },
    status,
    indexer: {
      ...indexer,
      lagBlocks,
      lagStatus,
    },
    chain,
    priceFeed,
    oracleSubmitter,
    ubi,
    protocols,
  }

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 's-maxage=10, stale-while-revalidate=30',
    },
  })
}

export const GET = withApiRateLimit(handleGet)

// Reject unsupported methods with a structured JSON envelope (405).
const ALLOWED = ['GET'] as const
const reject = (req: NextRequest) => methodNotAllowed(req, [...ALLOWED])
export const POST = reject
export const PUT = reject
export const DELETE = reject
export const PATCH = reject
