'use client'

/**
 * /status page sections — each subcomponent reads a slice of the shared
 * `OracleStatusPayload` snapshot and renders one card. Split out of the
 * top-level page so the page file stays under ~250 LOC and each card is
 * locally readable.
 */

import { formatAge } from '@/lib/formatAge'
import { buildOracleTxLink, buildOracleAddressLink } from '@/lib/oracleExplorer'
import type {
  OracleStatusPayload,
  OracleRailStatus,
  OracleUpstreamStatus,
  OracleProofRow,
  OracleIngestStats,
  OracleProofFailure,
} from '@/lib/useOracleStatusSnapshot'

import { CopyableAddress } from './CopyableAddress'

const CARD = 'bg-dark-100 rounded-2xl border border-gray-700/20 p-4'
const LINK = 'text-goodgreen hover:text-goodgreen/80 transition-colors underline underline-offset-2'

type Rail = 'stocks' | 'crypto'

function railOfflineCopy(rail: OracleRailStatus): string {
  if (!rail.enabled) return 'Rail disabled — no proofs are being submitted.'
  if (rail.lastFailureAgeMs !== null && rail.lastFailureAgeMs >= 0) {
    return `Rail has been failing for ${formatAge(rail.lastFailureAgeMs)} — no proofs submitted.`
  }
  return 'No proofs published yet.'
}

interface SectionProps {
  payload: OracleStatusPayload
}

export function StatusHeader({
  payload,
  lastFetchedAtMs,
  onRefresh,
  isRefreshing,
}: SectionProps & {
  lastFetchedAtMs: number | null
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const status = payload.service.status
  const pillCls = status === 'ok'
    ? 'bg-goodgreen/15 text-goodgreen border-goodgreen/30'
    : status === 'degraded'
      ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
      : 'bg-gray-700/30 text-gray-300 border-gray-600/40'
  const pillLabel = status === 'ok' ? 'Live' : status === 'degraded' ? 'Degraded' : 'Unknown'
  const ageMs = lastFetchedAtMs ? Date.now() - lastFetchedAtMs : null

  return (
    <header className={CARD} data-testid="status-header">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Oracle status</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Live snapshot from <code className="text-gray-300">/api/oracle/status</code>.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${pillCls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-goodgreen animate-pulse' : status === 'degraded' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
          {pillLabel}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-gray-500 uppercase tracking-wide text-[10px] mb-1">Chain</dt>
          <dd className="text-gray-200">
            {payload.chain.chainId !== null ? `ID ${payload.chain.chainId}` : 'Unknown chain'}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 uppercase tracking-wide text-[10px] mb-1">Signer</dt>
          <dd>
            <CopyableAddress address={payload.chain.signerAddress} label="signer" />
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 uppercase tracking-wide text-[10px] mb-1">Last refreshed</dt>
          <dd className="flex items-center gap-2 text-gray-200">
            <span>{ageMs !== null ? formatAge(Math.max(0, ageMs)) : 'pending'}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-[11px] text-goodgreen hover:text-goodgreen/80 underline underline-offset-2 disabled:text-gray-500 disabled:no-underline"
              data-testid="status-refresh"
            >
              {isRefreshing ? 'refreshing…' : 'Refresh'}
            </button>
          </dd>
        </div>
      </dl>
    </header>
  )
}

function railFreshness(rail: OracleRailStatus): { label: string; cls: string } {
  if (!rail.enabled) return { label: 'Disabled', cls: 'bg-gray-700/30 text-gray-300 border-gray-600/40' }
  if (rail.lastSuccessAgeMs === null) return { label: 'No heartbeat', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' }
  if (rail.lastSuccessAgeMs > 60_000) return { label: 'Degraded', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' }
  return { label: 'Live', cls: 'bg-goodgreen/15 text-goodgreen border-goodgreen/30' }
}

function RailCard({ name, rail, address, chainId }: {
  name: string
  rail: OracleRailStatus
  address: string | null
  chainId: number | null
}) {
  const fresh = railFreshness(rail)
  const link = buildOracleAddressLink(chainId, address)

  return (
    <div className={CARD} data-testid={`rail-card-${name.toLowerCase()}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">{name} rail</h2>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border ${fresh.cls}`}>
          {fresh.label}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
        <dt className="text-gray-500">Enabled</dt>
        <dd className="text-gray-200">{rail.enabled ? 'yes' : 'no'}</dd>
        <dt className="text-gray-500">Last success</dt>
        <dd className="text-gray-200">{rail.lastSuccessAgeMs !== null ? `${formatAge(rail.lastSuccessAgeMs)}` : '—'}</dd>
        <dt className="text-gray-500">Last failure</dt>
        <dd className="text-gray-200">{rail.lastFailureAgeMs !== null ? `${formatAge(rail.lastFailureAgeMs)}` : '—'}</dd>
        <dt className="text-gray-500">Oracle</dt>
        <dd>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className={LINK}>
              <CopyableAddress address={address} label={`${name.toLowerCase()}-oracle`} />
            </a>
          ) : (
            <CopyableAddress address={address} label={`${name.toLowerCase()}-oracle`} />
          )}
        </dd>
      </dl>
    </div>
  )
}

export function StatusRails({ payload }: SectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="status-rails">
      <RailCard name="Stocks" rail={payload.rails.stocks} address={payload.chain.oracleAddresses.stocks} chainId={payload.chain.chainId} />
      <RailCard name="Crypto" rail={payload.rails.crypto} address={payload.chain.oracleAddresses.crypto} chainId={payload.chain.chainId} />
    </section>
  )
}

function midPreview(row: OracleProofRow): string {
  if (!row.mids) return '—'
  const entries = Object.entries(row.mids)
  if (entries.length === 0) return '—'
  const [sym, val] = entries[0]!
  const formatted = val >= 1000 ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val.toFixed(4)
  return `${sym} ${formatted}`
}

function ProofTable({ rail, rows, chainId, railStatus, name }: {
  rail: Rail
  rows: OracleProofRow[]
  chainId: number | null
  railStatus: OracleRailStatus
  name: string
}) {
  if (rows.length === 0) {
    return (
      <div className={CARD} data-testid={`proof-table-${rail}`}>
        <h2 className="text-sm font-semibold text-white mb-2">{name} proofs</h2>
        <p className="text-xs text-gray-400">{railOfflineCopy(railStatus)}</p>
      </div>
    )
  }

  return (
    <div className={CARD} data-testid={`proof-table-${rail}`}>
      <h2 className="text-sm font-semibold text-white mb-2">{name} proofs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-700/20">
              <th className="pb-2 pr-3 font-normal">Symbols</th>
              <th className="pb-2 pr-3 font-normal">Mid</th>
              <th className="pb-2 pr-3 font-normal">Tx</th>
              <th className="pb-2 font-normal">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const link = buildOracleTxLink(chainId, row.txHash)
              const ageMs = row.submittedAtMs > 0 ? Date.now() - row.submittedAtMs : null
              return (
                <tr key={row.txHash} className="border-b border-gray-700/10 last:border-b-0">
                  <td className="py-2 pr-3 text-gray-200">{row.symbols.join(', ') || '—'}</td>
                  <td className="py-2 pr-3 text-gray-200">{midPreview(row)}</td>
                  <td className="py-2 pr-3">
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className={LINK}>
                        block {row.blockNumber} ↗
                      </a>
                    ) : (
                      <span className="text-gray-300">block {row.blockNumber}</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-400">{ageMs !== null ? formatAge(ageMs) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StatusProofs({ payload }: SectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-3" data-testid="status-proofs">
      <ProofTable rail="stocks" rows={payload.proof.stocks} chainId={payload.chain.chainId} railStatus={payload.rails.stocks} name="Stocks" />
      <ProofTable rail="crypto" rows={payload.proof.crypto} chainId={payload.chain.chainId} railStatus={payload.rails.crypto} name="Crypto" />
    </section>
  )
}

function upstreamPill(status: OracleUpstreamStatus['status']): string {
  if (status === 'ok') return 'bg-goodgreen/15 text-goodgreen border-goodgreen/30'
  if (status === 'down') return 'bg-red-500/15 text-red-300 border-red-500/30'
  return 'bg-gray-700/30 text-gray-300 border-gray-600/40'
}

function UpstreamRow({ name, status }: { name: string; status: OracleUpstreamStatus }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs" data-testid={`upstream-${name}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${upstreamPill(status.status)}`}>
          {status.status}
        </span>
        <span className="text-gray-200 font-mono">{name}</span>
        {status.label && <span className="text-gray-500">· {status.label}</span>}
      </div>
      {status.reason && status.status === 'down' && (
        <span className="text-yellow-300/80 truncate max-w-[40ch]" title={status.reason}>
          {status.reason}
        </span>
      )}
    </div>
  )
}

export function StatusUpstreams({ payload }: SectionProps) {
  return (
    <section className={CARD} data-testid="status-upstreams">
      <h2 className="text-sm font-semibold text-white mb-3">Upstream health</h2>
      <div className="space-y-2">
        <UpstreamRow name="price-service" status={payload.upstreams.priceService} />
        <UpstreamRow name="oracle-signer" status={payload.upstreams.oracleSigner} />
      </div>
    </section>
  )
}

function IngestCounters({ ingest }: { ingest: OracleIngestStats }) {
  const rows: Array<[string, number]> = [
    ['accepted', ingest.accepted],
    ['dropped (json parse)', ingest.droppedJsonParse],
    ['dropped (shape)', ingest.droppedShape],
    ['dropped (invalid mid)', ingest.droppedInvalidMid],
    ['dropped (missing symbol)', ingest.droppedMissingSymbol],
  ]
  return (
    <div>
      <h2 className="text-sm font-semibold text-white mb-2">Ingest counters</h2>
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-500">{label}</dt>
            <dd className={`text-right font-mono ${value > 0 && label.startsWith('dropped') ? 'text-yellow-300' : 'text-gray-200'}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function RecentFailures({ failures }: { failures: OracleProofFailure[] }) {
  if (failures.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-white mb-2">Recent failures</h2>
        <p className="text-xs text-gray-400">No recent failures.</p>
      </div>
    )
  }
  const sorted = [...failures].sort((a, b) => b.attemptedAtMs - a.attemptedAtMs).slice(0, 10)
  return (
    <details className="" data-testid="recent-failures">
      <summary className="cursor-pointer text-sm font-semibold text-white mb-2">
        Recent failures ({failures.length})
      </summary>
      <ul className="mt-2 space-y-1.5 text-xs">
        {sorted.map((f, idx) => {
          const ageMs = f.attemptedAtMs > 0 ? Date.now() - f.attemptedAtMs : null
          return (
            <li key={`${f.attemptedAtMs}-${idx}`} className="border-l-2 border-yellow-500/40 pl-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-yellow-300/90">{f.rail}</span>
                <span className="text-gray-500 text-[10px]">{ageMs !== null ? formatAge(ageMs) : '—'}</span>
              </div>
              <div className="text-gray-300 truncate" title={f.reason}>{f.reason}</div>
              {f.symbols.length > 0 && (
                <div className="text-gray-500 text-[10px]">{f.symbols.join(', ')}</div>
              )}
            </li>
          )
        })}
      </ul>
    </details>
  )
}

export function StatusIngest({ payload }: SectionProps) {
  const allFailures = [...payload.failures.stocks, ...payload.failures.crypto]
  return (
    <section className={`${CARD} grid grid-cols-1 md:grid-cols-2 gap-6`} data-testid="status-ingest">
      <IngestCounters ingest={payload.ingest} />
      <RecentFailures failures={allFailures} />
    </section>
  )
}
