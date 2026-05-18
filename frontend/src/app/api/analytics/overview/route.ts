import { promises as fs } from 'fs'
import path from 'path'

import { NextResponse, type NextRequest } from 'next/server'

import { DEVNET_RPC_URL } from '@/lib/devnet'
import { withApiRateLimit } from '@/lib/withApiRateLimit'

/**
 * Iter 27 — `/api/analytics/overview`.
 *
 * Read-only join of four already-public data surfaces, served as a single
 * JSON document so the `/analytics` page can render every panel from one
 * round-trip. Each sub-source carries its own `ok: boolean` so a failure in
 * one upstream (typically the indexer or RPC) never blanks the page.
 *
 * Inputs:
 *   - `analytics/address-book.json` (committed by iter 26, read from disk).
 *   - `STATUS_AGGREGATOR_URL`        (default `http://localhost:9200/status.json`).
 *   - `INDEXER_API_URL`              (default `http://127.0.0.1:4200`).
 *   - `DEVNET_RPC_URL`               (already used by `/api/rpc`).
 *
 * Output: see `AnalyticsOverview` below.
 *
 * See:
 *   - `.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *      0038-iter27-internal-analytics-dashboard.md`
 *   - `docs/TESTNET-READINESS-50-ITERATIONS.md` (row 27)
 */

export const runtime = 'nodejs'
// Cache for 10 s on the edge / Next data cache, allow a 30 s grace window
// so the page is cheap to refresh and the upstreams are not hammered.
export const revalidate = 10

const STATUS_URL =
  process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json'
const INDEXER_URL = process.env.INDEXER_API_URL ?? 'http://127.0.0.1:4200'
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

  // Fetch the three live sub-sources in parallel so a slow one doesn't
  // serialise the others.
  const [status, indexer, chain] = await Promise.all([
    fetchStatus(),
    fetchIndexer(),
    fetchChain(),
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
