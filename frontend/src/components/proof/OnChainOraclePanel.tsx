'use client'

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { getAllTickers } from '@/lib/stockData'

const SESSION_LABELS: Record<number, string> = {
  0: 'Open',
  1: 'PreMarket',
  2: 'AfterHours',
  3: 'Closed',
  4: 'Halted',
}

interface DecodedPriceData {
  symbol: string
  price8: bigint
  timestamp: bigint
  session: number
  confidence: number
  signerCount: number
}

function formatUsd8(price8: bigint): string {
  const v = Number(price8) / 1e8
  if (!Number.isFinite(v) || v === 0) return '—'
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
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
      aria-labelledby="onchain-oracle-heading"
      className="rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 id="onchain-oracle-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          On-chain Oracle (getPriceData)
        </h2>
        <span className="text-xs text-gray-500 truncate ml-2 max-w-[40%] font-mono">{oracleAddress}</span>
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

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-3 font-medium">Symbol</th>
                <th className="py-2 pr-3 font-medium text-right">Price (8-dec → USD)</th>
                <th className="py-2 pr-3 font-medium">Session</th>
                <th className="py-2 pr-3 font-medium text-right">Conf</th>
                <th className="py-2 pr-3 font-medium text-right">Signers</th>
                <th className="py-2 pr-3 font-medium text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-gray-500">
                    No on-chain price data available. The oracle may be unset or unreachable.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.symbol} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-3 font-medium text-white">{row.symbol}</td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-100">{formatUsd8(row.price8)}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                        {SESSION_LABELS[row.session] ?? `enum(${row.session})`}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-300">{row.confidence}%</td>
                    <td className="py-2 pr-3 text-right font-mono text-gray-300">{row.signerCount}</td>
                    <td className="py-2 pr-3 text-right text-xs text-gray-400">{formatAgo(row.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
