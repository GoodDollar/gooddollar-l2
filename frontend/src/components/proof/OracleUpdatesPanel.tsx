'use client'

import { useCallback, useState } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { MonoSourceAtom, PanelHeaderMeta } from './PanelHeaderMeta'
import { RetryButton } from './PanelHeaderControls'
import { usePanelRetry } from './ProofPanelActionsProvider'
import { shortAddress } from './panelHeaderMetaUtils'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'
import { DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS } from './useProofPipelineAxes'
import type { AxisHealth } from './proofAxes'

interface UpdateEntry {
  txHash: string
  blockNumber: bigint
  symbol: string
  price8: bigint
  capturedAt: number
}

const MAX_EVENTS = 10
const SESSION_LABEL: Record<number, string> = {
  0: 'Open',
  1: 'PreMarket',
  2: 'AfterHours',
  3: 'Closed',
  4: 'Halted',
}

function formatRelative(ts: number): string {
  const ageMs = Math.max(0, Date.now() - ts)
  if (ageMs < 1000) return 'just now'
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s ago`
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`
  return `${Math.floor(ageMs / 3_600_000)}h ago`
}

function formatUsd8(price8: bigint): string {
  const v = Number(price8) / 1e8
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

function shortHash(hash: string): string {
  if (!hash || hash.length < 12) return hash
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

export function OracleUpdatesPanel() {
  const oracleAddress = CONTRACTS.StocksPriceOracle
  const explorer =
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER ??
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ??
    ''
  const { axes } = useProofPipelineAxesContext()
  // Gate the watcher on the on-chain axis: when the axis is degraded
  // or unknown, no keeper writes can reach the chain anyway, so
  // polling the empty filter is pure waste — see task lane6-watch-
  // contract-event-block-poll-rate-uncapped (0064). The yellow
  // "subscription degraded" notice stays reserved for real wagmi
  // `onError` callbacks; an axis-paused state is communicated by the
  // header cadence caption only.
  const subscriptionEnabled = Boolean(oracleAddress) && axes.onChain === 'healthy'
  const [events, setEvents] = useState<UpdateEntry[]>([])
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionEpoch, setSubscriptionEpoch] = useState(0)

  const onLogs = useCallback((logs: readonly unknown[]) => {
    setSubscriptionError(null)
    setEvents((prev) => {
      const next: UpdateEntry[] = [...prev]
      for (const log of logs) {
        const l = log as {
          transactionHash?: string
          blockNumber?: bigint
          args?: { symbol?: string; price8?: bigint; session?: number }
        }
        if (!l.transactionHash) continue
        next.unshift({
          txHash: l.transactionHash,
          blockNumber: l.blockNumber ?? 0n,
          symbol: l.args?.symbol ?? '?',
          price8: l.args?.price8 ?? 0n,
          capturedAt: Date.now(),
        })
      }
      return next.slice(0, MAX_EVENTS)
    })
  }, [])

  const onError = useCallback((err: Error) => {
    setSubscriptionError(sanitiseClientError('oracle-subscription', err))
  }, [])

  const retry = useCallback(async () => {
    setSubscriptionError(null)
    setSubscriptionEpoch((e) => e + 1)
  }, [])

  const { busy, fire: handleRetry } = usePanelRetry('oracleEvents', retry)

  return (
    <section
      id="panel-oracle-updates"
      aria-labelledby="oracle-updates-heading"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <OracleEventSubscription
        key={subscriptionEpoch}
        oracleAddress={oracleAddress}
        enabled={subscriptionEnabled}
        pollingInterval={DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS}
        onLogs={onLogs}
        onError={onError}
      />
      <header className="mb-3 flex flex-wrap items-center justify-between gap-y-1">
        <h2 id="oracle-updates-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Recent Oracle Updates
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <PanelHeaderMeta
            source={
              oracleAddress ? (
                <MonoSourceAtom value={shortAddress(oracleAddress)} title={oracleAddress} />
              ) : undefined
            }
            cadence={
              <span data-testid="oracle-updates-status">
                {cadenceCaption({
                  subscriptionError,
                  subscriptionEnabled,
                  onChainAxis: axes.onChain,
                })}
              </span>
            }
          />
          <RetryButton
            onRetry={handleRetry}
            busy={busy}
            testId="oracle-updates-retry"
            ariaLabel="Re-subscribe to PriceUpdated events"
          />
        </div>
      </header>

      <div className="flex-1">
      {subscriptionError && (
        <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">Oracle event subscription degraded</div>
          <div className="mt-1 text-yellow-300/80">{subscriptionError}</div>
          {oracleAddress && explorer && (
            <a
              href={`${explorer.replace(/\/$/, '')}/address/${oracleAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="oracle-updates-explorer-link"
              className="mt-2 inline-flex items-center gap-1 text-yellow-100 underline-offset-2 hover:underline"
            >
              View events on block explorer <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      )}

      {events.length === 0 ? (
        subscriptionError ? null : (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-gray-500">
            Listening for <code className="text-gray-400">PriceUpdated</code> events. None observed yet;
            this populates as the oracle-signer keeper writes to the chain.
            {SESSION_LABEL[0] /* keep tree-shaker honest */ ? null : null}
          </div>
        )
      ) : (
        <ul className="divide-y divide-white/5">
          {events.map((e) => {
            const link = explorer ? `${explorer.replace(/\/$/, '')}/tx/${e.txHash}` : undefined
            return (
              <li key={`${e.txHash}-${e.symbol}`} className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{e.symbol}</span>
                  <span className="font-mono text-xs text-gray-400">{formatUsd8(e.price8)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">block #{String(e.blockNumber)}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-400">{formatRelative(e.capturedAt)}</span>
                  <span className="text-gray-500">·</span>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-accent hover:text-white transition-colors"
                    >
                      {shortHash(e.txHash)} ↗
                    </a>
                  ) : (
                    <span className="font-mono text-gray-300">{shortHash(e.txHash)}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      </div>
    </section>
  )
}

/**
 * Renders nothing — exists purely to host a `useWatchContractEvent`
 * subscription whose lifetime can be reset via React's `key` prop.
 * The parent re-mounts this component (by bumping
 * `subscriptionEpoch`) when the user clicks `Retry now`, so a stale
 * filter/RPC connection is fully torn down and a fresh subscription
 * is opened — no manual `enabled: false → true` toggle required.
 */
/**
 * Map the watcher's resolved state into the cadence-slot caption.
 * Four mutually-exclusive branches in priority order:
 *  1. `subscriptionError` — wagmi raised `onError`. Reserved for real
 *     subscription failures; communicated by the yellow banner too.
 *  2. `subscriptionEnabled` — watcher is armed and polling.
 *  3. `onChainAxis === 'unknown'` — first paint, axis not resolved.
 *  4. Otherwise — axis is `'degraded'`; no keeper writes can land.
 */
function cadenceCaption({
  subscriptionError,
  subscriptionEnabled,
  onChainAxis,
}: {
  subscriptionError: string | null
  subscriptionEnabled: boolean
  onChainAxis: AxisHealth
}): string {
  if (subscriptionError) return 'subscription degraded'
  if (subscriptionEnabled) return `live · last ${MAX_EVENTS} PriceUpdated events`
  if (onChainAxis === 'unknown') return 'subscription paused · awaiting on-chain axis'
  return 'subscription paused · on-chain axis degraded'
}

function OracleEventSubscription({
  oracleAddress,
  enabled,
  pollingInterval,
  onLogs,
  onError,
}: {
  oracleAddress: `0x${string}` | undefined
  enabled: boolean
  pollingInterval: number
  onLogs: (logs: readonly unknown[]) => void
  onError: (err: Error) => void
}) {
  useWatchContractEvent({
    address: oracleAddress,
    abi: PriceOracleABI,
    eventName: 'PriceUpdated',
    onLogs,
    onError,
    enabled,
    pollingInterval,
  })
  return null
}
