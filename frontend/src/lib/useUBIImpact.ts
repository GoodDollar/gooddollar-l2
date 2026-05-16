'use client'

/**
 * useUBIImpact — wagmi hooks for UBIRevenueTracker on-chain reads.
 *
 * Provides:
 *   - useDashboardData(): aggregate stats (total fees, UBI, txs, protocol count)
 *   - useAllProtocols(): per-protocol breakdown array
 *   - useSnapshots(count): historical daily snapshots for charting
 *
 * All data is read directly from the UBIRevenueTracker contract (GOO-226).
 */

import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { UBIRevenueTrackerABI } from './abi'
import { CONTRACTS } from './chain'

const TRACKER = CONTRACTS.UBIRevenueTracker

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardData {
  totalFees: bigint
  totalUBI: bigint
  totalTx: bigint
  protocolCount: bigint
  activeProtocols: bigint
  splitterFees: bigint
  splitterUBI: bigint
  snapshotCount: bigint
  // Formatted
  totalFeesFormatted: string
  totalUBIFormatted: string
  splitterFeesFormatted: string
  splitterUBIFormatted: string
  ubiPercentage: number
}

export interface ProtocolStats {
  name: string
  category: string
  feeSource: string
  totalFees: bigint
  ubiContribution: bigint
  txCount: bigint
  lastUpdateBlock: bigint
  active: boolean
  // Formatted
  totalFeesFormatted: string
  ubiFormatted: string
  feeShare: number   // percentage of total fees
  ubiShare: number   // percentage of total UBI
}

export interface Snapshot {
  timestamp: bigint
  totalUBI: bigint
  totalFees: bigint
  protocolCount: bigint
  date: string
  totalUBIFormatted: string
  totalFeesFormatted: string
}

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  swap:    '#3b82f6', // blue
  perps:   '#f59e0b', // amber
  predict: '#8b5cf6', // purple
  lend:    '#10b981', // emerald
  stable:  '#06b6d4', // cyan
  stocks:  '#ef4444', // red
  bridge:  '#f97316', // orange
}

export const CATEGORY_ICONS: Record<string, string> = {
  swap:    '🔄',
  perps:   '📈',
  predict: '🔮',
  lend:    '🏦',
  stable:  '💵',
  stocks:  '📊',
  bridge:  '🌉',
}

// ─── Pure helpers (exported for unit testing) ─────────────────────────────────

/**
 * Wagmi `useReadContracts` returns an array of per-contract results, each
 * shaped as a discriminated union of `{ status: 'success', result }` and
 * `{ status: 'failure', error }`. We re-export this shape so the parser is
 * testable without pulling in the full wagmi types graph.
 */
export type AggregateContractResult =
  | { status: 'success'; result: unknown; error?: undefined }
  | { status: 'failure'; result?: unknown; error: Error }

/**
 * Result of mapping a Multicall3 aggregate response into the dashboard's
 * typed view model. The three reads (dashboard, protocols, snapshots)
 * degrade independently:
 *
 *   - dashboard failure → `isError = true`, everything suppressed
 *     (the page cannot render without headline totals).
 *   - protocols failure → `protocolsError` set, list rendered as empty
 *     with a small per-section warning, but the hero stats still display.
 *   - snapshots failure → `snapshotsError` set, history chart suppressed.
 *   - all-zero values  → `isEmpty = true`, page renders an explicit
 *     "no fees recorded yet" state instead of skeleton-forever.
 */
export interface AggregateState {
  dashboard: DashboardData | null
  protocols: ProtocolStats[]
  snapshots: Snapshot[]
  isError: boolean
  isEmpty: boolean
  dashboardError: Error | null
  protocolsError: Error | null
  snapshotsError: Error | null
}

/**
 * Decode a `useReadContracts` response for the UBI Impact dashboard into a
 * typed state object. Pure and exported so unit tests can cover all decode
 * branches without exercising wagmi internals.
 *
 * Expects exactly 3 entries, in this order:
 *   [0] getDashboardData() → tuple of 8 uint256
 *   [1] getAllProtocols()  → array of ProtocolStats structs
 *   [2] getSnapshots(N)    → array of Snapshot structs
 *
 * Any deviation from that shape (undefined, wrong length) is treated as
 * an error because viem's Multicall3 wrapper is contractually obliged to
 * preserve length — a violation indicates an RPC-layer corruption.
 */
export function parseAggregateResult(
  data: readonly AggregateContractResult[] | undefined,
): AggregateState {
  // Initial pending state — no error, no data yet.
  if (data === undefined) {
    return {
      dashboard: null,
      protocols: [],
      snapshots: [],
      isError: false,
      isEmpty: false,
      dashboardError: null,
      protocolsError: null,
      snapshotsError: null,
    }
  }

  // Malformed response — surface as hard error.
  if (data.length < 3) {
    return {
      dashboard: null,
      protocols: [],
      snapshots: [],
      isError: true,
      isEmpty: false,
      dashboardError: new Error(
        `Malformed multicall response: expected 3 results, got ${data.length}`,
      ),
      protocolsError: null,
      snapshotsError: null,
    }
  }

  const [dashRes, protRes, snapRes] = data
  const dashboardError = dashRes.status === 'failure' ? dashRes.error : null
  const protocolsError = protRes.status === 'failure' ? protRes.error : null
  const snapshotsError = snapRes.status === 'failure' ? snapRes.error : null

  // Dashboard is mandatory: without it the page has no totals to render.
  if (dashboardError !== null) {
    return {
      dashboard: null,
      protocols: [],
      snapshots: [],
      isError: true,
      isEmpty: false,
      dashboardError,
      protocolsError,
      snapshotsError,
    }
  }

  // Decode dashboard tuple.
  const tuple = dashRes.result as readonly bigint[] | undefined
  if (!tuple || tuple.length < 8) {
    return {
      dashboard: null,
      protocols: [],
      snapshots: [],
      isError: true,
      isEmpty: false,
      dashboardError: new Error('Dashboard tuple malformed (expected 8 uint256)'),
      protocolsError,
      snapshotsError,
    }
  }
  const [totalFees, totalUBI, totalTx, protocolCount, activeProtocols, splitterFees, splitterUBI, snapshotCount] = tuple
  const ubiPct = computeUbiPercentage({ totalUBI, totalFees, splitterUBI, splitterFees })
  const dashboard: DashboardData = {
    totalFees,
    totalUBI,
    totalTx,
    protocolCount,
    activeProtocols,
    splitterFees,
    splitterUBI,
    snapshotCount,
    totalFeesFormatted: formatGD(totalFees),
    totalUBIFormatted: formatGD(totalUBI),
    splitterFeesFormatted: formatGD(splitterFees),
    splitterUBIFormatted: formatGD(splitterUBI),
    ubiPercentage: ubiPct,
  }

  // Decode protocols (best-effort — only suppress on explicit failure).
  type RawProtocol = {
    name: string
    category: string
    feeSource: string
    totalFees: bigint
    ubiContribution: bigint
    txCount: bigint
    lastUpdateBlock: bigint
    active: boolean
  }
  let protocols: ProtocolStats[] = []
  if (protocolsError === null) {
    const raw = (protRes.result as RawProtocol[] | undefined) ?? []
    const tf = totalFees > 0n ? totalFees : 1n
    const tu = totalUBI > 0n ? totalUBI : 1n
    protocols = raw.map((p) => ({
      name: p.name,
      category: p.category,
      feeSource: p.feeSource,
      totalFees: p.totalFees,
      ubiContribution: p.ubiContribution,
      txCount: p.txCount,
      lastUpdateBlock: p.lastUpdateBlock,
      active: p.active,
      totalFeesFormatted: formatGD(p.totalFees),
      ubiFormatted: formatGD(p.ubiContribution),
      feeShare: totalFees > 0n ? Number((p.totalFees * 10000n) / tf) / 100 : 0,
      ubiShare: totalUBI > 0n ? Number((p.ubiContribution * 10000n) / tu) / 100 : 0,
    }))
  }

  // Decode snapshots (best-effort — only suppress on explicit failure).
  type RawSnapshot = { timestamp: bigint; totalUBI: bigint; totalFees: bigint; protocolCount: bigint }
  let snapshots: Snapshot[] = []
  if (snapshotsError === null) {
    const raw = (snapRes.result as RawSnapshot[] | undefined) ?? []
    snapshots = raw.map((s) => ({
      timestamp: s.timestamp,
      totalUBI: s.totalUBI,
      totalFees: s.totalFees,
      protocolCount: s.protocolCount,
      date: new Date(Number(s.timestamp) * 1000).toLocaleDateString(),
      totalUBIFormatted: formatGD(s.totalUBI),
      totalFeesFormatted: formatGD(s.totalFees),
    }))
  }

  // Fresh-deploy / no-fees-yet case: every headline metric is zero. We mark
  // this explicitly so the UI can render a friendly empty state instead of
  // staring at the user with all-zero numeric tiles (which look like a bug).
  const isEmpty =
    totalFees === 0n &&
    totalUBI === 0n &&
    totalTx === 0n &&
    protocols.length === 0 &&
    snapshots.length === 0

  return {
    dashboard,
    protocols,
    snapshots,
    isError: false,
    isEmpty,
    dashboardError: null,
    protocolsError,
    snapshotsError,
  }
}

/**
 * Compute the percentage of gross protocol fees routed to UBI.
 *
 * The UBIFeeSplitter contract is the on-chain source of truth: ubiBPS = 2000
 * (= 20%) splits every fee into UBI / protocol / dapp. When the splitter has
 * collected any fees, we derive the displayed % from `splitterUBI / splitterFees`
 * to guarantee the dashboard's headline matches the contract's behavior.
 *
 * We only fall back to the aggregated UBIRevenueTracker totals (totalUBI /
 * totalFees) when the splitter has zero recorded activity — useful during
 * fresh deploys or replays where the tracker may have been seeded from
 * historical snapshots before the splitter was wired up.
 *
 * Returns 0 (not NaN) for any malformed / zero-fee state.
 */
export function computeUbiPercentage(input: {
  totalUBI: bigint
  totalFees: bigint
  splitterUBI: bigint
  splitterFees: bigint
}): number {
  const { totalUBI, totalFees, splitterUBI, splitterFees } = input
  if (splitterFees > 0n) {
    return Number((splitterUBI * 10000n) / splitterFees) / 100
  }
  if (totalFees > 0n) {
    return Number((totalUBI * 10000n) / totalFees) / 100
  }
  return 0
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardData(): {
  data: DashboardData | null
  isLoading: boolean
  error: Error | null
} {
  const result = useReadContract({
    address: TRACKER,
    abi: UBIRevenueTrackerABI,
    functionName: 'getDashboardData',
    query: { refetchInterval: 15_000 },
  })

  const data = useMemo(() => {
    if (!result.data) return null
    const [totalFees, totalUBI, totalTx, protocolCount, activeProtocols, splitterFees, splitterUBI, snapshotCount] = result.data as unknown as bigint[]
    const ubiPct = computeUbiPercentage({ totalUBI, totalFees, splitterUBI, splitterFees })
    return {
      totalFees,
      totalUBI,
      totalTx,
      protocolCount,
      activeProtocols,
      splitterFees,
      splitterUBI,
      snapshotCount,
      totalFeesFormatted: formatGD(totalFees),
      totalUBIFormatted: formatGD(totalUBI),
      splitterFeesFormatted: formatGD(splitterFees),
      splitterUBIFormatted: formatGD(splitterUBI),
      ubiPercentage: ubiPct,
    }
  }, [result.data])

  return { data, isLoading: result.isLoading, error: result.error as Error | null }
}

export function useAllProtocols(totalFeesRef?: bigint, totalUBIRef?: bigint): {
  data: ProtocolStats[]
  isLoading: boolean
  error: Error | null
} {
  const result = useReadContract({
    address: TRACKER,
    abi: UBIRevenueTrackerABI,
    functionName: 'getAllProtocols',
    query: { refetchInterval: 15_000 },
  })

  const data = useMemo(() => {
    if (!result.data) return []
    const raw = result.data as any[]
    const tf = totalFeesRef ?? 1n
    const tu = totalUBIRef ?? 1n
    return raw.map((p: any) => ({
      name: p.name as string,
      category: p.category as string,
      feeSource: p.feeSource as string,
      totalFees: p.totalFees as bigint,
      ubiContribution: p.ubiContribution as bigint,
      txCount: p.txCount as bigint,
      lastUpdateBlock: p.lastUpdateBlock as bigint,
      active: p.active as boolean,
      totalFeesFormatted: formatGD(p.totalFees as bigint),
      ubiFormatted: formatGD(p.ubiContribution as bigint),
      feeShare: tf > 0n ? Number(((p.totalFees as bigint) * 10000n) / tf) / 100 : 0,
      ubiShare: tu > 0n ? Number(((p.ubiContribution as bigint) * 10000n) / tu) / 100 : 0,
    }))
  }, [result.data, totalFeesRef, totalUBIRef])

  return { data, isLoading: result.isLoading, error: result.error as Error | null }
}

export function useSnapshots(count: number = 30): {
  data: Snapshot[]
  isLoading: boolean
  error: Error | null
} {
  const result = useReadContract({
    address: TRACKER,
    abi: UBIRevenueTrackerABI,
    functionName: 'getSnapshots',
    args: [BigInt(count)],
    query: { refetchInterval: 60_000 },
  })

  const data = useMemo(() => {
    if (!result.data) return []
    const raw = result.data as any[]
    return raw.map((s: any) => ({
      timestamp: s.timestamp as bigint,
      totalUBI: s.totalUBI as bigint,
      totalFees: s.totalFees as bigint,
      protocolCount: s.protocolCount as bigint,
      date: new Date(Number(s.timestamp) * 1000).toLocaleDateString(),
      totalUBIFormatted: formatGD(s.totalUBI as bigint),
      totalFeesFormatted: formatGD(s.totalFees as bigint),
    }))
  }, [result.data])

  return { data, isLoading: result.isLoading, error: result.error as Error | null }
}

// ─── Aggregate hook (preferred — Multicall3) ──────────────────────────────────

/**
 * useUBIImpactAggregate — single Multicall3 read for all three dashboard
 * data sources (dashboard tuple, protocols array, recent snapshots).
 *
 * Why this exists: the original implementation issued three separate
 * `useReadContract` hooks. On some RPCs (notably when viem's HTTP
 * `batch: true` is on) those three eth_calls were being silently coalesced
 * into a single JSON-RPC batch request — and any transport-layer hiccup
 * (service-worker interception, intermediary proxy, gzip mismatch) caused
 * all three to remain `isLoading: true` forever, manifesting as the page
 * being stuck on loading skeletons indefinitely.
 *
 * Multicall3 sidesteps that entirely: viem encodes all three calls into a
 * single `aggregate3` invocation against the chain's well-known
 * multicall3 address. One eth_call, one response, one failure domain.
 *
 * Returns a normalized `AggregateState` plus standard `isLoading`/`refetch`
 * so the caller can render loading, error, empty, and data states without
 * juggling three independent query objects.
 *
 * @param snapshotCount — number of historical snapshots to fetch (default 30)
 * @returns combined state + refetch trigger for retry buttons
 */
export function useUBIImpactAggregate(snapshotCount: number = 30): AggregateState & {
  isLoading: boolean
  refetch: () => void
} {
  const result = useReadContracts({
    contracts: [
      {
        address: TRACKER,
        abi: UBIRevenueTrackerABI,
        functionName: 'getDashboardData',
      },
      {
        address: TRACKER,
        abi: UBIRevenueTrackerABI,
        functionName: 'getAllProtocols',
      },
      {
        address: TRACKER,
        abi: UBIRevenueTrackerABI,
        functionName: 'getSnapshots',
        args: [BigInt(snapshotCount)],
      },
    ],
    query: { refetchInterval: 15_000 },
  })

  // The wagmi type for `result.data` is a deeply-nested generic. We narrow
  // it to our test-friendly `AggregateContractResult[]` shape here so the
  // pure parser doesn't have to depend on wagmi types.
  const state = useMemo(
    () => parseAggregateResult(result.data as readonly AggregateContractResult[] | undefined),
    [result.data],
  )

  return {
    ...state,
    isLoading: result.isLoading,
    refetch: () => { void result.refetch() },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a wei-denominated G$ balance for display. Exported so the page
 * component and any other consumer can render totals without re-implementing
 * the K/M abbreviation rules.
 */
export function formatGD(wei: bigint): string {
  const num = Number(formatEther(wei))
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}
