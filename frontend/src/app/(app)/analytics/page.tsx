'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnalyticsPriceStrip } from '@/components/AnalyticsPriceStrip'
import { OracleStatusBadge } from '@/components/OracleStatusBadge'

import { LANE1_RUNBOOK_HREF, LANE1_STATUS_HREF } from '@/lib/lane1Links'

/**
 * Iter 27 — Internal analytics dashboard.
 *
 * Renders the four panels (service health, chain/indexer activity, UBI fee
 * landscape, protocols) from a single round-trip to
 * `/api/analytics/overview`. Polls every 30 s.
 *
 * Failure mode: per-panel `ok: false` is surfaced honestly (Non-Negotiable
 * #8 — do not hide degraded services). The page never blank-fails on a
 * single upstream outage.
 *
 * See:
 *   - .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *       0038-iter27-internal-analytics-dashboard.md
 *   - docs/TESTNET-READINESS-50-ITERATIONS.md (row 27)
 */

// ─── API shape (mirrors src/app/api/analytics/overview/route.ts) ─────────────

type LagStatus =
  | 'fresh'
  | 'stale'
  | 'far_behind'
  | 'db_ahead_of_chain'
  | 'unknown'

interface StatusBlock {
  ok: boolean
  overall?: 'healthy' | 'degraded' | 'down' | 'unknown'
  healthy?: number
  total?: number
  aggregatorUptime?: number
  chainBlock?: number
  lastChecked?: number
  error?: string
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
interface IndexerBlock {
  ok: boolean
  lastBlock?: number
  totalEvents?: number
  protocols?: IndexerProtocolRow[]
  topEvents?: IndexerTopEvent[]
  lagBlocks: number | null
  lagStatus: LagStatus
  error?: string
}
interface ChainBlock {
  ok: boolean
  blockNumber?: number
  error?: string
}
interface FeeRoute {
  id: number
  protocol: string
  label: string
  kind: string
  source_contract: string
  sink_contract: string
  sink_method: string
  event_contract: string
  event_contract_deployed: boolean
  source_address_pending_deploy: boolean
  fee_token: string
}
interface UbiBlock {
  totalRoutes: number
  routes: FeeRoute[]
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
interface ProtocolSummary {
  key: string
  label: string
  count: number
  sampleContracts: { address: string; name: string }[]
}
interface PriceFeedBlock {
  ok: boolean
  mode?: string
  freshQuotes?: number
  totalSymbols?: number
  medianDivergenceBps?: number | null
  lastUpdateMs?: number
  status?: string
  error?: string
}
interface OracleSubmitterBlock {
  ok: boolean
  status: 'ok' | 'degraded' | 'unreachable'
  mode?: string
  reason?: string
  lastUpdateMs?: number
  configuredSymbols?: number
  error?: string
}
interface OverviewResponse {
  ok: true
  summary: {
    totalProtocols: number
    totalContracts: number
    addressBookVersion: string
    addressBookGeneratedAt: string
    generatedAt: string
  }
  status: StatusBlock
  indexer: IndexerBlock
  chain: ChainBlock
  priceFeed?: PriceFeedBlock
  oracleSubmitter?: OracleSubmitterBlock
  ubi: UbiBlock
  protocols: ProtocolSummary[]
}

// ─── Small UI helpers ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-dark-50 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

function shortAddr(addr: string): string {
  if (!addr) return '—'
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

function timeAgo(ms: number | undefined): string {
  if (!ms) return '—'
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function PanelError({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
      <span className="font-medium">Source unavailable:</span> {message}
    </div>
  )
}

// ─── Lane-1 price-feed panel (task 0063) ────────────────────────────────────

function lane1ChipClasses(status: 'ok' | 'degraded' | 'unreachable' | 'unknown'): string {
  switch (status) {
    case 'ok':
      return 'bg-green-500/15 text-green-300 border-green-500/30'
    case 'degraded':
      return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
    case 'unreachable':
      return 'bg-red-500/15 text-red-300 border-red-500/30'
    case 'unknown':
      return 'bg-gray-500/15 text-gray-300 border-gray-500/30'
  }
}

function Lane1FenceChip({ mode }: { mode: string | undefined }) {
  const fenced = mode !== 'demo-trading'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        fenced
          ? 'bg-green-500/15 text-green-300 border-green-500/30'
          : 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
      }`}
      data-testid="lane1-fence-chip"
    >
      Real trading: {fenced ? 'FENCED ✓' : 'demo-trading'}
    </span>
  )
}

function Lane1PriceFeedPanel({
  priceFeed,
  oracleSubmitter,
  chain,
}: {
  priceFeed: PriceFeedBlock | undefined
  oracleSubmitter: OracleSubmitterBlock | undefined
  chain: ChainBlock
}) {
  const producerStatus: 'ok' | 'degraded' | 'unreachable' | 'unknown' = priceFeed
    ? priceFeed.ok
      ? 'ok'
      : 'unreachable'
    : 'unknown'
  const submitterStatus = oracleSubmitter?.status ?? 'unknown'

  return (
    <section
      className="mb-6 bg-dark-100/50 rounded-xl p-5"
      data-testid="lane1-price-feed-panel"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white">
          Lane 1 — eToro live prices
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Lane1FenceChip mode={priceFeed?.mode} />
          <a
            href={LANE1_STATUS_HREF}
            className="text-xs text-goodgreen hover:underline"
            data-testid="lane1-deep-link"
          >
            See pipeline status →
          </a>
        </div>
      </div>

      {priceFeed && !priceFeed.ok ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200 mb-3">
          <span aria-hidden>⚠ </span>
          <span className="font-medium">price-service unavailable:</span>{' '}
          <span className="font-mono">{priceFeed.error ?? priceFeed.status ?? 'unknown'}</span>
          <span className="ml-2">
            <a
              href={LANE1_RUNBOOK_HREF}
              className="underline hover:text-yellow-100"
              target="_blank"
              rel="noreferrer"
            >
              Runbook →
            </a>
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Producer */}
        <div
          className={`bg-dark-50 rounded-lg p-4 border ${lane1ChipClasses(producerStatus)}`}
          data-testid="lane1-producer-card"
        >
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
            Producer · price-service
          </div>
          <div className="text-sm text-white font-mono">
            {priceFeed?.freshQuotes ?? '—'}/{priceFeed?.totalSymbols ?? '—'} fresh
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Mode: <span className="font-mono text-gray-200">{priceFeed?.mode ?? '—'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">:9300 · {producerStatus}</div>
        </div>

        {/* Submitter */}
        <div
          className={`bg-dark-50 rounded-lg p-4 border ${lane1ChipClasses(submitterStatus)}`}
          data-testid="lane1-submitter-card"
        >
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
            Submitter · oracle-signer
          </div>
          <div className="text-sm text-white">{submitterStatus}</div>
          {oracleSubmitter?.reason ? (
            <div className="text-xs text-gray-400 mt-1 break-words">
              {oracleSubmitter.reason}
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-1">
              mode: <span className="font-mono text-gray-300">{oracleSubmitter?.mode ?? '—'}</span>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-0.5">:9107</div>
        </div>

        {/* Chain */}
        <div
          className={`bg-dark-50 rounded-lg p-4 border ${lane1ChipClasses(chain.ok ? 'ok' : 'unreachable')}`}
          data-testid="lane1-chain-card"
        >
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
            Chain · StockOracleV2
          </div>
          <div className="text-sm text-white">
            {chain.ok && typeof chain.blockNumber === 'number'
              ? `block ${chain.blockNumber.toLocaleString()}`
              : 'unreachable'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Median div:{' '}
            <span className="font-mono text-gray-200">
              {priceFeed?.medianDivergenceBps == null ? '—' : `${priceFeed.medianDivergenceBps} bps`}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function FreshnessBadge({
  status,
  lagBlocks,
}: {
  status: LagStatus
  lagBlocks: number | null
}) {
  const config: Record<LagStatus, { label: string; cls: string }> = {
    fresh: { label: 'Fresh', cls: 'bg-goodgreen/20 text-goodgreen border-goodgreen/40' },
    stale: { label: 'Stale', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
    far_behind: { label: 'Far behind', cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
    db_ahead_of_chain: {
      label: 'DB ahead of chain — reset',
      cls: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    unknown: { label: 'Unknown', cls: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
  }
  const c = config[status]
  const detail =
    typeof lagBlocks === 'number' ? ` (${lagBlocks.toLocaleString()} blocks)` : ''
  return (
    <span
      data-testid="indexer-freshness-badge"
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`}
    >
      {c.label}
      {detail}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000

export default function AnalyticsPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<number | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchOverview = useCallback(async (signal?: AbortSignal) => {
    setIsRefetching(true)
    try {
      const res = await fetch('/api/analytics/overview', {
        cache: 'no-store',
        signal,
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const body = (await res.json()) as OverviewResponse
      if (!body.ok) {
        throw new Error('API returned ok=false')
      }
      setData(body)
      setLastFetched(Date.now())
      setLoadError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setLoadError(err instanceof Error ? err.message : 'unknown')
    } finally {
      setIsRefetching(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    void fetchOverview(ctrl.signal)
    const interval = setInterval(() => {
      void fetchOverview()
    }, POLL_INTERVAL_MS)
    return () => {
      clearInterval(interval)
      ctrl.abort()
    }
  }, [fetchOverview])

  const isInitialLoad = data === null && loadError === null

  const summary = data?.summary
  const status = data?.status
  const indexer = data?.indexer
  const chain = data?.chain
  const priceFeed = data?.priceFeed
  const oracleSubmitter = data?.oracleSubmitter
  const ubi = data?.ubi
  const protocols = data?.protocols ?? []

  const ubiBps = ubi?.feeSplitBps
  const ubiPct = useMemo(() => {
    if (!ubiBps) return '—'
    return `${ubiBps.protocol / 100}% / ${ubiBps.ubi / 100}%`
  }, [ubiBps])

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Lane 4: live-price source strip + aggregate oracle health */}
      <div className="mb-5 flex flex-col gap-3">
        <AnalyticsPriceStrip />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Internal view of chain activity, UBI fee routing, and service health.{' '}
            <a href="/api/analytics/overview" className="text-goodgreen hover:underline">
              /api/analytics/overview
            </a>{' '}
            ·{' '}
            <a href="/api/status" className="text-goodgreen hover:underline">
              /api/status
            </a>
          </p>
          <div className="mt-2">
            <OracleStatusBadge />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {lastFetched
              ? `Updated ${timeAgo(lastFetched)} · auto-refresh 30s`
              : 'Loading…'}
          </span>
          <button
            type="button"
            onClick={() => void fetchOverview()}
            disabled={isRefetching}
            className="text-xs px-3 py-1 rounded-md border border-dark-50 text-gray-300 hover:bg-dark-50 disabled:opacity-50"
          >
            {isRefetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4">
          <PanelError message={loadError} />
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Protocols"
          value={summary?.totalProtocols ?? (isInitialLoad ? '…' : 0)}
          sub={summary ? `${summary.totalContracts} contracts` : 'address book'}
        />
        <StatCard
          label="Indexed events"
          value={
            indexer?.ok && typeof indexer.totalEvents === 'number'
              ? indexer.totalEvents.toLocaleString()
              : '—'
          }
          sub={
            indexer?.ok && typeof indexer.lastBlock === 'number'
              ? `block ${indexer.lastBlock.toLocaleString()}`
              : 'indexer offline'
          }
          color={indexer?.ok ? 'text-white' : 'text-red-400'}
        />
        <StatCard
          label="Chain tip"
          value={
            chain?.ok && typeof chain.blockNumber === 'number'
              ? chain.blockNumber.toLocaleString()
              : '—'
          }
          sub={chain?.ok ? 'eth_blockNumber' : 'rpc offline'}
          color={chain?.ok ? 'text-white' : 'text-red-400'}
        />
        <StatCard
          label="Service health"
          value={
            status?.ok && typeof status.healthy === 'number'
              ? `${status.healthy}/${status.total}`
              : '—'
          }
          sub={`${status?.overall ?? 'aggregator offline'} · → Lane 1`}
          color={
            status?.overall === 'healthy'
              ? 'text-goodgreen'
              : status?.overall === 'degraded'
                ? 'text-yellow-400'
                : status?.overall === 'down'
                  ? 'text-red-400'
                  : 'text-white'
          }
        />
        <StatCard
          label="Price feed"
          value={
            priceFeed?.ok && typeof priceFeed.freshQuotes === 'number'
              ? `${priceFeed.freshQuotes}/${priceFeed.totalSymbols ?? '?'}`
              : '—'
          }
          sub={priceFeed?.ok ? priceFeed.mode ?? 'unknown mode' : 'price-service offline'}
          color={
            priceFeed?.ok
              ? 'text-goodgreen'
              : priceFeed
                ? 'text-red-400'
                : 'text-white'
          }
        />
      </div>

      {/* ── Service Health panel ─────────────────────────────────────────── */}
      <section className="mb-6 bg-dark-100/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Service Health</h2>
        {!data && isInitialLoad ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : status?.ok ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-300">
              Aggregator says <span className="font-semibold text-white">{status.overall}</span> —{' '}
              {status.healthy} / {status.total} services healthy.
            </span>
            {typeof status.aggregatorUptime === 'number' && (
              <span className="text-gray-500">
                · uptime {Math.round(status.aggregatorUptime)}s
              </span>
            )}
            <a
              href="/api/status"
              className="text-xs px-2 py-0.5 rounded border border-dark-50 text-gray-400 hover:bg-dark-50"
            >
              raw JSON →
            </a>
          </div>
        ) : (
          <PanelError message={status?.error ?? 'status aggregator unreachable'} />
        )}
      </section>

      {/* ── Lane 1 — eToro live prices panel (task 0063) ──────────────────── */}
      {chain && (
        <Lane1PriceFeedPanel
          priceFeed={priceFeed}
          oracleSubmitter={oracleSubmitter}
          chain={chain}
        />
      )}

      {/* ── Chain & Indexer Activity panel ───────────────────────────────── */}
      <section className="mb-6 bg-dark-100/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-white">Chain &amp; Indexer Activity</h2>
          {indexer && (
            <FreshnessBadge status={indexer.lagStatus} lagBlocks={indexer.lagBlocks} />
          )}
        </div>

        {indexer && indexer.lagStatus === 'db_ahead_of_chain' && (
          <p className="text-xs text-red-300 mb-3">
            Indexer database holds blocks newer than the live chain. This usually
            indicates a chain reset since the last index. The dashboard surfaces
            this rather than hiding it (Non-Negotiable #8); track recovery in iter
            28 (indexer reset playbook).
          </p>
        )}

        {!indexer && isInitialLoad && (
          <p className="text-sm text-gray-500">Loading indexer overview…</p>
        )}

        {indexer?.ok && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Per-protocol events</h3>
              {indexer.protocols && indexer.protocols.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="text-left py-1">Protocol</th>
                      <th className="text-right py-1">Events</th>
                      <th className="text-right py-1">Last block</th>
                      <th className="text-right py-1">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexer.protocols.map((p) => (
                      <tr key={p.protocol} className="border-t border-dark-100">
                        <td className="py-1.5 text-white capitalize">{p.protocol}</td>
                        <td className="py-1.5 text-right text-gray-300">
                          {p.total_events.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right text-gray-400 font-mono text-xs">
                          {p.last_event_block.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right text-gray-500 text-xs">
                          {timeAgo(p.last_updated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-gray-500">No protocol activity yet.</p>
              )}
            </div>

            <div className="bg-dark-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Top events</h3>
              {indexer.topEvents && indexer.topEvents.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {indexer.topEvents.map((ev) => (
                    <li
                      key={ev.event_name}
                      className="flex items-center justify-between text-gray-300"
                    >
                      <span className="font-mono text-xs text-white">{ev.event_name}</span>
                      <span className="text-gray-400">{ev.cnt.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">No events recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {indexer && !indexer.ok && (
          <PanelError message={indexer.error ?? 'indexer unreachable'} />
        )}
      </section>

      {/* ── UBI Fee Landscape panel ──────────────────────────────────────── */}
      <section className="mb-6 bg-dark-100/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">UBI Fee Landscape</h2>

        {!ubi && isInitialLoad && <p className="text-sm text-gray-500">Loading…</p>}

        {ubi && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard label="Fee routes" value={ubi.totalRoutes} sub="from address book" />
              <StatCard
                label="Splitters pending"
                value={ubi.pendingCount}
                sub={ubi.pendingCount > 0 ? 'needs deploy' : 'all live'}
                color={ubi.pendingCount > 0 ? 'text-yellow-400' : 'text-goodgreen'}
              />
              <StatCard
                label="Protocol / UBI split"
                value={ubiPct}
                sub="canonical bps"
              />
              <StatCard
                label="Address book"
                value={data?.summary.addressBookVersion ?? '—'}
                sub="iter 26 artefact"
              />
            </div>

            {ubi.pendingSplitters.length > 0 && (
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-300 mb-1">Pending splitters</h3>
                <div className="flex flex-wrap gap-1.5">
                  {ubi.pendingSplitters.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 text-xs rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-dark-50 rounded-lg p-4 overflow-x-auto">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Fee route map</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left py-1 pr-3">Protocol</th>
                    <th className="text-left py-1 pr-3">Route</th>
                    <th className="text-left py-1 pr-3">Source</th>
                    <th className="text-left py-1 pr-3">Sink</th>
                    <th className="text-left py-1 pr-3">Method</th>
                    <th className="text-right py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ubi.routes.map((r) => (
                    <tr key={r.id} className="border-t border-dark-100">
                      <td className="py-1.5 pr-3 text-white capitalize">{r.protocol}</td>
                      <td className="py-1.5 pr-3 text-gray-300">{r.label}</td>
                      <td className="py-1.5 pr-3 text-gray-400 font-mono text-xs">
                        {r.source_contract}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-400 font-mono text-xs">
                        {r.sink_contract}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-500 font-mono text-xs">
                        {r.sink_method}
                      </td>
                      <td className="py-1.5 text-right text-xs">
                        {r.source_address_pending_deploy ? (
                          <span className="text-yellow-400">pending</span>
                        ) : r.event_contract_deployed ? (
                          <span className="text-goodgreen">deployed</span>
                        ) : (
                          <span className="text-gray-400">unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ubi.splitDoc && (
              <p className="text-xs text-gray-500 mt-3">
                Split policy: <span className="text-gray-300">{ubi.splitDoc}</span>
              </p>
            )}
          </>
        )}
      </section>

      {/* ── Protocols panel ──────────────────────────────────────────────── */}
      <section className="mb-6 bg-dark-100/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Protocols</h2>
        {protocols.length === 0 ? (
          <p className="text-sm text-gray-500">No protocols loaded.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {protocols.map((p) => (
              <div key={p.key} className="bg-dark-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{p.label}</h3>
                  <span className="text-xs text-gray-500">{p.count} contracts</span>
                </div>
                <ul className="space-y-1">
                  {p.sampleContracts.map((c) => (
                    <li key={c.address} className="flex justify-between text-xs">
                      <span className="text-gray-300">{c.name}</span>
                      <span className="font-mono text-gray-500">{shortAddr(c.address)}</span>
                    </li>
                  ))}
                  {p.count > p.sampleContracts.length && (
                    <li className="text-xs text-gray-500 pt-1">
                      … and {p.count - p.sampleContracts.length} more
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500 mt-6">
        Sources: <code>analytics/address-book.json</code> (committed by iter 26),
        the status aggregator on <code>:9200</code>, the indexer on{' '}
        <code>:4200</code>, and <code>eth_blockNumber</code> via{' '}
        <a href="/api/rpc" className="text-goodgreen hover:underline">
          /api/rpc
        </a>
        .
      </p>
    </div>
  )
}
