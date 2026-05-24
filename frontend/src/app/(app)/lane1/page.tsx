'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  usePriceServiceStatus,
  type QuoteStatus,
} from '@/lib/usePriceServiceStatus'
import { useLane1AggregatorStatus, type LaneServiceStatus } from '@/lib/useLane1AggregatorStatus'
import { LANE1_RUNBOOK_HREF } from '@/lib/lane1Links'

/**
 * Lane-1 proof page (`/lane1`).
 *
 * Single human-readable surface that answers "are eToro demo prices flowing
 * on testnet right now?" — the proof/status UI named by
 * `.autobuilder/initiatives/0007a-etoro-connectivity/spec.md` URGENT OVERRIDE.
 *
 * Reuses internal proxies only: `/api/status` (status-aggregator rollup) and
 * `/api/status/quotes` (price-service rollup) — no new backend endpoints, no
 * direct eToro reach. When the quotes proxy fails, the page surfaces a
 * failure-mode card with the runbook link instead of collapsing to "Oracle
 * offline".
 *
 * Architecture (task 0062 planner notes):
 *
 *   usePriceServiceStatus()        → /api/status/quotes  (10s singleton)
 *   useLane1AggregatorStatus()     → /api/status         (10s inline)
 *
 * Three cards stack vertically: Pipeline, Per-symbol freshness, Diagnostics.
 * Real-trading fence and source-mode badge read build-time env mirrors
 * (`NEXT_PUBLIC_ETORO_MODE`, `NEXT_PUBLIC_REAL_TRADING_ENABLED`) and fall
 * back to "FENCED" whenever the mode is not `demo-trading`.
 */

// Spec.md §43 — the lane-1 canonical default symbol list.
const LANE1_DEFAULT_SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'AAPL',
  'TSLA',
  'NVDA',
  'META',
  'SPY',
] as const

const KNOWN_MODES = new Set(['mock', 'demo-readonly', 'demo-trading', 'real-disabled'])
const APPROX_BLOCK_MS = 12_000
const STALE_THRESHOLD_MS = 60_000

const STOCK_ORACLE_V2_ADDRESS =
  process.env.NEXT_PUBLIC_STOCK_ORACLE_V2_ADDRESS ?? ''
const ETORO_MODE_BUILD = process.env.NEXT_PUBLIC_ETORO_MODE ?? ''
const REAL_TRADING_ENABLED_BUILD =
  (process.env.NEXT_PUBLIC_REAL_TRADING_ENABLED ?? 'false').toLowerCase() === 'true'

function formatAgeMs(age: number | null | undefined): string {
  if (age == null || !Number.isFinite(age) || age < 0) return '—'
  if (age < 1000) return `${age}ms ago`
  if (age < 60_000) return `${Math.floor(age / 1000)}s ago`
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m ago`
  return `${Math.floor(age / 3_600_000)}h ago`
}

function shortAddr(addr: string): string {
  if (!addr) return '—'
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

function statusChipClasses(status: LaneServiceStatus): string {
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

function statusDotClasses(status: LaneServiceStatus): string {
  switch (status) {
    case 'ok':
      return 'bg-green-400'
    case 'degraded':
      return 'bg-yellow-400'
    case 'unreachable':
      return 'bg-red-400'
    case 'unknown':
      return 'bg-gray-400'
  }
}

function statusLabel(status: LaneServiceStatus): string {
  switch (status) {
    case 'ok':
      return 'ok'
    case 'degraded':
      return 'degraded'
    case 'unreachable':
      return 'unreachable'
    case 'unknown':
      return 'unknown'
  }
}

function freshnessChip(ageMs: number): { label: string; cls: string } {
  if (ageMs >= STALE_THRESHOLD_MS) {
    return { label: 'STL', cls: 'bg-red-500/15 text-red-300 border-red-500/30' }
  }
  if (ageMs >= 15_000) {
    return { label: 'OK', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' }
  }
  return { label: 'OK', cls: 'bg-green-500/15 text-green-300 border-green-500/30' }
}

// ─── Header strip ───────────────────────────────────────────────────────────

function modeFromBuild(): { value: string; recognised: boolean } {
  const raw = ETORO_MODE_BUILD || 'unknown'
  return { value: raw, recognised: KNOWN_MODES.has(raw) }
}

function fenceLabel(mode: string): { text: string; cls: string } {
  if (REAL_TRADING_ENABLED_BUILD || mode === 'demo-trading') {
    return { text: 'demo-trading', cls: 'text-yellow-300' }
  }
  return { text: 'FENCED', cls: 'text-green-400' }
}

function HeaderStrip({ pollAgeMs }: { pollAgeMs: number | null }) {
  const mode = modeFromBuild()
  const fence = fenceLabel(mode.value)
  return (
    <section
      className="bg-dark-50 rounded-xl p-5 mb-6 border border-dark-100"
      data-testid="lane1-header"
    >
      <h1 className="text-2xl font-bold text-white">
        Lane 1 — eToro live prices on testnet
      </h1>
      <p className="text-sm text-gray-400 mt-2">
        Source: <span className="font-mono text-white">{mode.value}</span>
        {' · '}
        Real trading:{' '}
        <span className={`font-semibold ${fence.cls}`}>{fence.text}</span>
        {' '}<span className="text-green-400">✓</span>
        {' · '}
        Polled {formatAgeMs(pollAgeMs)}
      </p>
      {!mode.recognised && (
        <p
          className="text-xs text-yellow-300 mt-2"
          data-testid="lane1-unrecognised-mode"
        >
          ⚠ Unrecognised mode &quot;{mode.value}&quot; — expected one of mock,
          demo-readonly, demo-trading, real-disabled.
        </p>
      )}
    </section>
  )
}

// ─── Pipeline card ───────────────────────────────────────────────────────────

interface PipelineNodeProps {
  title: string
  port: string
  status: LaneServiceStatus
  lines: string[]
}

function PipelineNode({ title, port, status, lines }: PipelineNodeProps) {
  return (
    <div
      className={`flex-1 min-w-[180px] bg-dark-100 rounded-lg p-4 border ${statusChipClasses(status)}`}
      data-testid={`pipeline-node-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${statusDotClasses(status)}`} />
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="ml-auto text-xs text-gray-400 font-mono">{port}</span>
      </div>
      <div className="text-xs text-gray-300 space-y-1">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  )
}

function PipelineCard({
  priceService,
  oracleSigner,
  freshCount,
  totalCount,
  currentOracleBlock,
}: {
  priceService: LaneServiceStatus
  oracleSigner: LaneServiceStatus
  freshCount: number
  totalCount: number
  currentOracleBlock: number | null
}) {
  return (
    <section className="bg-dark-50/40 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-semibold text-white mb-3">Pipeline</h2>
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        <PipelineNode
          title="price-service"
          port=":9300"
          status={priceService}
          lines={[
            `freshQuotes ${freshCount}/${totalCount}`,
            `${statusLabel(priceService)}`,
          ]}
        />
        <div className="hidden md:flex items-center text-gray-500 text-xl px-1" aria-hidden>
          →
        </div>
        <PipelineNode
          title="oracle-signer"
          port=":9107"
          status={oracleSigner}
          lines={[statusLabel(oracleSigner), 'submits setPrice batches']}
        />
        <div className="hidden md:flex items-center text-gray-500 text-xl px-1" aria-hidden>
          →
        </div>
        <PipelineNode
          title="StockOracleV2"
          port={STOCK_ORACLE_V2_ADDRESS ? shortAddr(STOCK_ORACLE_V2_ADDRESS) : 'on L2'}
          status={currentOracleBlock != null ? 'ok' : 'unknown'}
          lines={[
            currentOracleBlock != null
              ? `last block ${currentOracleBlock.toLocaleString()}`
              : 'no block observed yet',
            STOCK_ORACLE_V2_ADDRESS
              ? `addr ${shortAddr(STOCK_ORACLE_V2_ADDRESS)}`
              : 'NEXT_PUBLIC_STOCK_ORACLE_V2_ADDRESS unset',
          ]}
        />
      </div>
    </section>
  )
}

// ─── Per-symbol freshness table ─────────────────────────────────────────────

interface SymbolRow {
  symbol: string
  quote: QuoteStatus | null
}

function buildSymbolRows(quotes: QuoteStatus[]): SymbolRow[] {
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]))
  const lanes = LANE1_DEFAULT_SYMBOLS.map(
    (sym) => ({ symbol: sym, quote: bySymbol.get(sym) ?? null }),
  )
  const extras = quotes
    .filter((q) => !LANE1_DEFAULT_SYMBOLS.includes(q.symbol as typeof LANE1_DEFAULT_SYMBOLS[number]))
    .map((q) => ({ symbol: q.symbol, quote: q }))
  return [...lanes, ...extras]
}

function PerSymbolTable({ quotes }: { quotes: QuoteStatus[] }) {
  const rows = buildSymbolRows(quotes)
  return (
    <section className="bg-dark-50/40 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-semibold text-white mb-3">Per-symbol freshness</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="lane1-symbol-table">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-dark-100">
              <th className="text-left py-2 pr-3">Symbol</th>
              <th className="text-right py-2 px-2">Source mid</th>
              <th className="text-right py-2 px-2">Oracle block</th>
              <th className="text-right py-2 px-2">Age</th>
              <th className="text-left py-2 px-2">Session</th>
              <th className="text-right py-2 px-2">Div (bps)</th>
              <th className="text-right py-2 pl-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const q = row.quote
              const chip = q ? freshnessChip(q.lastUpdateMs) : null
              return (
                <tr
                  key={row.symbol}
                  className="border-b border-dark-100/40"
                  data-testid={`lane1-symbol-row-${row.symbol}`}
                >
                  <td className="py-2 pr-3 font-semibold text-white">{row.symbol}</td>
                  <td className="py-2 px-2 text-right text-gray-300 font-mono">
                    {q?.confidence ? `${q.confidence}% conf` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-300 font-mono">
                    {q?.oracleBlock ? q.oracleBlock.toLocaleString() : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-300">
                    {q ? formatAgeMs(q.lastUpdateMs) : '—'}
                  </td>
                  <td className="py-2 px-2 text-gray-400">
                    {q?.sessionState ?? '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-300">
                    {q?.divergenceBps != null ? q.divergenceBps : '—'}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    {chip ? (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded border ${chip.cls}`}
                      >
                        ●{chip.label}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded border bg-gray-500/15 text-gray-300 border-gray-500/30">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Diagnostics card ───────────────────────────────────────────────────────

function DiagnosticsCard({
  freshCount,
  totalCount,
  timestamp,
  currentOracleBlock,
}: {
  freshCount: number
  totalCount: number
  timestamp: number
  currentOracleBlock: number | null
}) {
  return (
    <section className="bg-dark-50/40 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-semibold text-white mb-3">Diagnostics</h2>
      <div className="bg-dark-100 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Producer rollup:</span>
          <span className="font-mono text-white">
            {freshCount}/{totalCount} fresh
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Timestamp:</span>
          <span className="font-mono text-white">
            {new Date(timestamp).toISOString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Current oracle block:</span>
          <span className="font-mono text-white">
            {currentOracleBlock != null ? currentOracleBlock.toLocaleString() : '—'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-3" data-testid="lane1-no-submissions-hint">
          No recent submissions panel — signer health envelope does not expose
          per-tx history yet (tracked as a follow-up). The oracle block above
          is derived from <code>/api/status/quotes</code> and advances every
          {' '}~{APPROX_BLOCK_MS / 1000}s while the pipeline is live.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-sm">
        <a
          href={LANE1_RUNBOOK_HREF}
          className="text-goodgreen hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Runbook →
        </a>
        <a href="/api/status" className="text-goodgreen hover:underline">
          /api/status →
        </a>
        <a href="/api/status/quotes" className="text-goodgreen hover:underline">
          /api/status/quotes →
        </a>
      </div>
    </section>
  )
}

// ─── Failure-mode card ──────────────────────────────────────────────────────

function FailureCard({ error }: { error: string }) {
  return (
    <section
      className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-6"
      data-testid="lane1-failure-card"
      role="alert"
    >
      <h2 className="text-lg font-semibold text-yellow-300 mb-2">
        Lane 1 — pipeline unreachable
      </h2>
      <p className="text-sm text-yellow-200">
        <span aria-hidden>⚠ </span>
        <code className="bg-dark-100 px-1 rounded">/api/status/quotes</code>{' '}
        failed:{' '}
        <span className="font-mono text-yellow-100">{error}</span>
      </p>
      <p className="text-sm text-yellow-200 mt-3">
        The price-service may not be running on{' '}
        <code className="bg-dark-100 px-1 rounded">:9300</code>. Next steps
        (from the runbook):
      </p>
      <ol className="text-sm text-yellow-200 mt-2 ml-5 list-decimal space-y-1">
        <li>
          Install the lane: <code className="bg-dark-100 px-1 rounded">npm run install:lane1</code>
        </li>
        <li>
          Boot in mock mode:{' '}
          <code className="bg-dark-100 px-1 rounded">
            ETORO_MODE=mock npm start
          </code>{' '}
          (in <code className="bg-dark-100 px-1 rounded">backend/price-service/</code>)
        </li>
        <li>Reload this page in ~10s.</li>
      </ol>
      <p className="text-sm mt-4">
        <a
          href={LANE1_RUNBOOK_HREF}
          className="text-yellow-300 underline hover:text-yellow-200"
          target="_blank"
          rel="noreferrer"
        >
          Runbook →
        </a>
      </p>
    </section>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

function usePollAgeMs(timestamp: number | undefined): number | null {
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!timestamp) return null
  return Math.max(0, now - timestamp)
}

export default function Lane1Page() {
  const quoteState = usePriceServiceStatus()
  const agg = useLane1AggregatorStatus()
  const pollAgeMs = usePollAgeMs(quoteState.status?.timestamp)

  const hasError = Boolean(quoteState.error) && !quoteState.status
  const status = quoteState.status

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <HeaderStrip pollAgeMs={pollAgeMs} />

      {hasError ? (
        <FailureCard error={quoteState.error ?? 'Quote status unavailable'} />
      ) : (
        <>
          <PipelineCard
            priceService={agg.priceService.status}
            oracleSigner={agg.oracleSigner.status}
            freshCount={status?.freshCount ?? 0}
            totalCount={status?.totalCount ?? 0}
            currentOracleBlock={
              status?.quotes?.[0]?.oracleBlock ??
              status?.quotes?.[0]?.productSync?.amm?.lastSyncedBlock ??
              null
            }
          />

          <PerSymbolTable quotes={status?.quotes ?? []} />

          <DiagnosticsCard
            freshCount={status?.freshCount ?? 0}
            totalCount={status?.totalCount ?? 0}
            timestamp={status?.timestamp ?? Date.now()}
            currentOracleBlock={
              status?.quotes?.[0]?.oracleBlock ??
              status?.quotes?.[0]?.productSync?.amm?.lastSyncedBlock ??
              null
            }
          />
        </>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Sources: <Link href="/api/status" className="text-goodgreen hover:underline">/api/status</Link>{' '}·{' '}
        <Link href="/api/status/quotes" className="text-goodgreen hover:underline">/api/status/quotes</Link>.
        Polls every 10s.
      </p>
    </div>
  )
}
