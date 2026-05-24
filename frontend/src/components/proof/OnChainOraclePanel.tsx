'use client'

import { useMemo } from 'react'
import { CONTRACTS } from '@/lib/chain'
import { getAllTickers } from '@/lib/stockData'
import { formatProofUsd } from '@/lib/proofFormat'
import { sessionPillClass } from './sessionPill'
import { MonoLinkAtom, MonoSourceAtom, PanelHeaderMeta } from './PanelHeaderMeta'
import { NextPollCountdown, RetryButton } from './PanelHeaderControls'
import { usePanelRetry } from './ProofPanelActionsProvider'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'

/**
 * User-facing copy for a failed on-chain multicall. The underlying
 * error is already sanitised + logged at the data boundary inside
 * `useProofPipelineAxes` (#0063) so the panel only needs a stable
 * customer-readable string here; this keeps the panel a pure renderer
 * with no second sanitise pair.
 */
const ORACLE_MULTICALL_DEGRADED_COPY =
  'The on-chain oracle is temporarily unreachable. The next scheduled poll will retry automatically.'

const SESSION_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'PreMarket',
  2: 'AfterHours',
  3: 'Closed',
  4: 'Halted',
}

interface ColumnSpec {
  key: 'symbol' | 'price' | 'session' | 'conf' | 'signers' | 'updated'
  label: string
  shortDescription: string
  align: 'left' | 'right'
}

/**
 * Source-of-truth for the On-Chain Oracle table layout. Both the header
 * row and the screen-reader `<dl>` consume this array, so adding or
 * renaming a column is a one-line change. The descriptions are written
 * for a fresh non-engineer reviewer; they surface via the native `title=`
 * tooltip on hover and via `aria-describedby` for screen readers (see
 * task lane6-onchain-oracle-column-headers-unexplained-jargon).
 */
const COLUMNS: readonly ColumnSpec[] = [
  {
    key: 'symbol',
    label: 'Symbol',
    shortDescription:
      'Ticker the oracle is publishing for. One row per ticker the keeper expects to write.',
    align: 'left',
  },
  {
    key: 'price',
    label: 'Price (8-dec → USD)',
    shortDescription:
      'On-chain price stored as an unsigned integer with 8 decimals of precision, divided by 1e8 to render as USD.',
    align: 'right',
  },
  {
    key: 'session',
    label: 'Session',
    shortDescription:
      'Market session enum reported by the keeper: Open, PreMarket, AfterHours, Closed, or Halted.',
    align: 'left',
  },
  {
    key: 'conf',
    label: 'Conf',
    shortDescription:
      'Confidence score (0-100) reported by the keeper for this round: how strongly the upstream feeds agreed on the price.',
    align: 'right',
  },
  {
    key: 'signers',
    label: 'Signers',
    shortDescription:
      'Number of distinct authorised keeper keys that signed this price round (k-of-n multisig).',
    align: 'right',
  },
  {
    key: 'updated',
    label: 'Updated',
    shortDescription:
      'How long ago this row was last written on-chain, derived from the row\u2019s on-chain timestamp.',
    align: 'right',
  },
]

function descIdFor(key: ColumnSpec['key']): string {
  return `onchain-oracle-col-desc-${key}`
}

function formatUsd8(symbol: string, price8: bigint): string {
  const v = Number(price8) / 1e8
  if (!Number.isFinite(v) || v === 0) return '—'
  return formatProofUsd(symbol, v)
}

function formatAgo(unixSec: bigint): string {
  const ts = Number(unixSec)
  if (!Number.isFinite(ts) || ts === 0) return 'never'
  const ageSec = Math.max(0, Math.floor(Date.now() / 1000 - ts))
  if (ageSec < 60) return `${ageSec}s ago`
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`
  return `${Math.floor(ageSec / 3600)}h ago`
}

export function OnChainOraclePanel() {
  const oracleAddress = CONTRACTS.StocksPriceOracle
  const explorer =
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER ??
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ??
    ''
  const tickers = useMemo(() => getAllTickers(), [])

  const {
    onChainRows: rows,
    onChainStatus,
    onChainAt,
    onChainCadenceMs,
    retryOnChain,
  } = useProofPipelineAxesContext()

  const { busy, fire: handleRetry } = usePanelRetry('onChain', retryOnChain)

  // `rows.length === 0` and `onChainStatus === 'loading'` only line up
  // before the first multicall settles; afterwards the loading flag
  // drops even on subsequent refetches (wagmi sets `isLoading=true`
  // only on the initial fetch), so the empty branch must key off the
  // resolved status, not row count alone.
  const isInitialLoad = onChainStatus === 'loading' && rows.length === 0
  const isErrored = onChainStatus === 'error'
  const isEmptyResolved = onChainStatus === 'ok' && rows.length === 0
  const hasRows = rows.length > 0

  return (
    <section
      id="panel-onchain-oracle"
      aria-labelledby="onchain-oracle-heading"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-y-1">
        <h2 id="onchain-oracle-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          On-chain Oracle (getPriceData)
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <PanelHeaderMeta
            source={<OracleAddressAtom oracleAddress={oracleAddress} explorer={explorer} />}
            cadence={
              <NextPollCountdown
                lastPollAt={onChainAt}
                intervalMs={onChainCadenceMs}
                busy={busy}
                testId="onchain-oracle-countdown"
              />
            }
          />
          <RetryButton
            onRetry={handleRetry}
            busy={busy}
            testId="onchain-oracle-retry"
            ariaLabel="Re-run on-chain oracle multicall"
          />
        </div>
      </header>

      <div className="flex-1">
      {isInitialLoad && (
        <div className="space-y-2" role="status" aria-label="Loading on-chain oracle data">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      )}

      {isErrored && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">Oracle multicall failed</div>
          <div className="mt-1 text-yellow-300/80">{ORACLE_MULTICALL_DEGRADED_COPY}</div>
        </div>
      )}

      {isEmptyResolved && (
        <div
          data-testid="onchain-oracle-awaiting"
          className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200"
        >
          <div className="font-semibold">Awaiting first on-chain write</div>
          <p className="mt-1 text-yellow-300/80">
            The oracle contract exists at the address above but no symbol has a
            non-zero price yet. The oracle-signer keeper writes prices on a fixed
            cadence — this panel will populate as soon as the first round lands.
          </p>
          {oracleAddress && explorer && (
            <a
              href={`${explorer.replace(/\/$/, '')}/address/${oracleAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="onchain-oracle-explorer-link"
              className="mt-2 inline-flex items-center gap-1 text-yellow-100 underline-offset-2 hover:underline"
              aria-label={`Open ${oracleAddress} on the block explorer`}
            >
              Open on block explorer <span aria-hidden>↗</span>
            </a>
          )}
          <ExpectedSymbolsList tickers={tickers} />
        </div>
      )}

      {hasRows && (
        <div className="overflow-x-auto">
          <div className="sr-only">
            <dl>
              {COLUMNS.map((col) => (
                <div key={col.key}>
                  <dt>{col.label}</dt>
                  <dd id={descIdFor(col.key)}>{col.shortDescription}</dd>
                </div>
              ))}
            </dl>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                {COLUMNS.map((col) => (
                  <OracleHeaderCell key={col.key} col={col} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const sessionLabel = SESSION_LABELS[row.session] ?? `enum(${row.session})`
                return (
                  <tr key={row.symbol} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-3 font-medium text-white">{row.symbol}</td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-100">{formatUsd8(row.symbol, row.price8)}</td>
                    <td className="py-2 pr-3">
                      <span
                        data-testid={`session-pill-${row.symbol}`}
                        className={`rounded-md px-2 py-0.5 text-xs ${sessionPillClass(sessionLabel)}`}
                      >
                        {sessionLabel}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-300">{row.confidence}%</td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-300">{row.signerCount}</td>
                    <td className="py-2 pr-3 text-right text-xs text-gray-400">{formatAgo(row.timestamp)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </section>
  )
}

/**
 * Pick the right header source atom for the on-chain oracle address.
 * Renders the explorer link when both pieces are configured, the plain
 * mono span when only the address is configured, or nothing when no
 * address is known so the panel-header rail collapses to empty.
 */
function OracleAddressAtom({
  oracleAddress,
  explorer,
}: {
  oracleAddress: string | undefined
  explorer: string
}) {
  if (!oracleAddress) return null
  if (explorer) {
    return (
      <MonoLinkAtom
        value={oracleAddress}
        href={`${explorer.replace(/\/$/, '')}/address/${oracleAddress}`}
        data-testid="oracle-address-link"
        aria-label={`Open ${oracleAddress} on block explorer`}
        title={oracleAddress}
      />
    )
  }
  return (
    <MonoSourceAtom
      value={oracleAddress}
      data-testid="oracle-address-text"
      title={oracleAddress}
    />
  )
}

/**
 * Awaiting-state expected-symbols list. Renders the configured ticker
 * set as a tidy grid of small mono pills, one chip per ticker, under a
 * labelled `EXPECTED SYMBOLS (N)` heading. Replaces the previous inline
 * comma-joined mono string so prose stays prose and the symbol set
 * reads as a list of equal atoms — see #0046.
 */
function ExpectedSymbolsList({ tickers }: { tickers: readonly string[] }) {
  if (tickers.length === 0) return null
  return (
    <div className="mt-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-yellow-300/70">
        Expected symbols ({tickers.length})
      </div>
      <ul
        data-testid="onchain-oracle-expected-symbols"
        className="mt-1 flex flex-wrap gap-1.5"
      >
        {tickers.map((t) => (
          <li
            key={t}
            className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-[10px] text-yellow-100/90"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function OracleHeaderCell({ col }: { col: ColumnSpec }) {
  const alignClass = col.align === 'right' ? 'py-2 pr-3 font-medium text-right' : 'py-2 pr-3 font-medium'
  return (
    <th
      scope="col"
      className={alignClass}
      title={col.shortDescription}
      aria-describedby={descIdFor(col.key)}
      data-testid={`onchain-oracle-header-${col.key}`}
    >
      <span className="inline-flex items-center gap-1">
        <span>{col.label}</span>
        <span
          aria-hidden
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[9px] font-bold text-gray-400"
        >
          ?
        </span>
      </span>
    </th>
  )
}
