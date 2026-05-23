'use client'

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { getAllTickers } from '@/lib/stockData'
import { formatProofUsd } from '@/lib/proofFormat'
import { sessionPillClass } from './sessionPill'

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

interface DecodedPriceData {
  symbol: string
  price8: bigint
  timestamp: bigint
  session: number
  confidence: number
  signerCount: number
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

  const contracts = useMemo(() => {
    if (!oracleAddress) return []
    return tickers.map((ticker) => ({
      address: oracleAddress,
      abi: PriceOracleABI,
      functionName: 'getPriceData' as const,
      args: [ticker] as const,
    }))
  }, [oracleAddress, tickers])

  const { data, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      refetchInterval: 30_000,
      staleTime: 30_000,
    },
  })

  const sanitisedErrorMessage = useMemo(
    () => (error ? sanitiseClientError('oracle-multicall', error) : null),
    [error],
  )

  const rows = useMemo<DecodedPriceData[]>(() => {
    if (!data) return []
    const out: DecodedPriceData[] = []
    for (let i = 0; i < tickers.length; i++) {
      const r = data[i]
      if (r?.status !== 'success' || !r.result) continue
      const tuple = r.result as {
        price8: bigint
        timestamp: bigint
        session: number
        confidence: number
        signerCount: number
      }
      out.push({
        symbol: tickers[i],
        price8: tuple.price8 ?? 0n,
        timestamp: tuple.timestamp ?? 0n,
        session: tuple.session ?? 3,
        confidence: tuple.confidence ?? 0,
        signerCount: tuple.signerCount ?? 0,
      })
    }
    return out
  }, [data, tickers])

  return (
    <section
      id="panel-onchain-oracle"
      aria-labelledby="onchain-oracle-heading"
      className="rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 id="onchain-oracle-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          On-chain Oracle (getPriceData)
        </h2>
        {oracleAddress && explorer ? (
          <a
            href={`${explorer.replace(/\/$/, '')}/address/${oracleAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 truncate max-w-[40%] font-mono text-xs text-accent hover:text-white transition-colors"
            data-testid="oracle-address-link"
            aria-label={`Open ${oracleAddress} on block explorer`}
            title={oracleAddress}
          >
            {oracleAddress} ↗
          </a>
        ) : (
          <span
            className="ml-2 truncate max-w-[40%] font-mono text-xs text-gray-500"
            title={oracleAddress || undefined}
            data-testid="oracle-address-text"
          >
            {oracleAddress || '—'}
          </span>
        )}
      </header>

      {isLoading && (
        <div className="space-y-2" role="status" aria-label="Loading on-chain oracle data">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      )}

      {sanitisedErrorMessage && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">Oracle multicall failed</div>
          <div className="mt-1 text-yellow-300/80">{sanitisedErrorMessage}</div>
        </div>
      )}

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

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                {COLUMNS.map((col) => (
                  <OracleHeaderCell key={col.key} col={col} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <>
                  <tr>
                    <td
                      colSpan={6}
                      data-testid="onchain-oracle-empty-banner"
                      className="border-b border-white/5 py-2 pr-3 text-xs text-gray-500"
                    >
                      Waiting for on-chain prices · {tickers.length} symbol{tickers.length === 1 ? '' : 's'} expected from oracle-signer keeper
                    </td>
                  </tr>
                  {tickers.map((symbol) => (
                    <tr
                      key={symbol}
                      data-testid={`onchain-oracle-placeholder-${symbol}`}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2 pr-3 font-medium text-white">{symbol}</td>
                      <td className="py-2 pr-3 text-right font-mono text-gray-500">—</td>
                      <td className="py-2 pr-3 text-gray-500">—</td>
                      <td className="py-2 pr-3 text-right font-mono text-gray-500">—</td>
                      <td className="py-2 pr-3 text-right font-mono text-gray-500">—</td>
                      <td className="py-2 pr-3 text-right text-xs text-gray-500">—</td>
                    </tr>
                  ))}
                </>
              ) : (
                rows.map((row) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
