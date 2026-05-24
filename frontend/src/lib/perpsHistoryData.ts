/**
 * perpsHistoryData.ts — Types, deterministic demo seeds for the four
 * /perps history tabs, and the production funding-rate-history hook.
 *
 * Production hooks (`useOpenOrders` / `useOrderHistory` / `useTradeHistory`
 * / `useFundingHistory` / `useFundingRateHistory`) currently return
 * empty data until on-chain perps event indexing is wired. The seeded
 * demo generators are exposed via explicit `useDemo*` hooks for
 * storybook + fixture tests only — production routes MUST NOT import
 * them. Task 0042 promoted `useFundingRateHistory` to the same pattern
 * so the funding chart can no longer paint a fake 168-hour ladder while
 * /activity reports the RPC is unreachable.
 */

import { useCallback, useMemo } from 'react'
import { useBlockNumber } from 'wagmi'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoryOpenOrder {
  id: string
  pair: string
  side: 'long' | 'short'
  type: 'limit' | 'stop-limit'
  price: number
  triggerPrice?: number
  size: number
  filled: number
  leverage: number
  createdAt: number
}

export type OrderStatus = 'filled' | 'cancelled' | 'expired' | 'partial'

export interface OrderHistoryItem {
  id: string
  pair: string
  side: 'long' | 'short'
  type: 'market' | 'limit' | 'stop-limit'
  price: number
  size: number
  filledSize: number
  status: OrderStatus
  createdAt: number
  filledAt?: number
}

export interface TradeHistoryItem {
  id: string
  pair: string
  side: 'long' | 'short'
  price: number
  size: number
  fee: number
  pnl: number
  timestamp: number
}

export interface FundingHistoryItem {
  id: string
  pair: string
  rate: number
  amount: number
  positionSize: number
  timestamp: number
}

// ─── Deterministic pseudo-random ──────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ─── Demo generators (storybook + fixture seeds only) ─────────────────────────

const PAIRS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'AAPL-USD', 'TSLA-USD']
const BASE_PRICES: Record<string, number> = {
  'BTC-USD': 67800,
  'ETH-USD': 1920,
  'SOL-USD': 134,
  'AAPL-USD': 192,
  'TSLA-USD': 178,
}

function generateOpenOrders(count: number): HistoryOpenOrder[] {
  const rng = seededRng(42)
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const pair = PAIRS[Math.floor(rng() * PAIRS.length)]
    const base = BASE_PRICES[pair] ?? 100
    const side = rng() > 0.5 ? 'long' : 'short' as const
    const type = rng() > 0.5 ? 'limit' : 'stop-limit' as const
    const offset = (rng() - 0.5) * 0.04 * base
    const size = +(rng() * 2 + 0.01).toFixed(4)
    return {
      id: `oo-${i}`,
      pair,
      side,
      type,
      price: +(base + offset).toFixed(2),
      triggerPrice: type === 'stop-limit' ? +(base + offset * 0.8).toFixed(2) : undefined,
      size,
      filled: 0,
      leverage: [2, 5, 10, 25][Math.floor(rng() * 4)],
      createdAt: now - Math.floor(rng() * 3600_000 * 24),
    }
  })
}

function generateOrderHistory(count: number): OrderHistoryItem[] {
  const rng = seededRng(123)
  const now = Date.now()
  const statuses: OrderStatus[] = ['filled', 'cancelled', 'expired', 'partial']
  return Array.from({ length: count }, (_, i) => {
    const pair = PAIRS[Math.floor(rng() * PAIRS.length)]
    const base = BASE_PRICES[pair] ?? 100
    const status = statuses[Math.floor(rng() * statuses.length)]
    const size = +(rng() * 3 + 0.01).toFixed(4)
    const createdAt = now - Math.floor(rng() * 3600_000 * 72)
    return {
      id: `oh-${i}`,
      pair,
      side: rng() > 0.5 ? 'long' : 'short' as const,
      type: (['market', 'limit', 'stop-limit'] as const)[Math.floor(rng() * 3)],
      price: +(base + (rng() - 0.5) * 0.06 * base).toFixed(2),
      size,
      filledSize: status === 'filled' ? size : status === 'partial' ? +(size * rng()).toFixed(4) : 0,
      status,
      createdAt,
      filledAt: status === 'filled' || status === 'partial' ? createdAt + Math.floor(rng() * 60_000) : undefined,
    }
  })
}

function generateTradeHistory(count: number): TradeHistoryItem[] {
  const rng = seededRng(777)
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const pair = PAIRS[Math.floor(rng() * PAIRS.length)]
    const base = BASE_PRICES[pair] ?? 100
    const size = +(rng() * 2 + 0.01).toFixed(4)
    const price = +(base + (rng() - 0.5) * 0.04 * base).toFixed(2)
    const notional = size * price
    return {
      id: `th-${i}`,
      pair,
      side: rng() > 0.5 ? 'long' : 'short' as const,
      price,
      size,
      fee: +(notional * 0.001).toFixed(4),
      pnl: +((rng() - 0.45) * notional * 0.08).toFixed(2),
      timestamp: now - Math.floor(rng() * 3600_000 * 168),
    }
  })
}

function generateFundingHistory(count: number): FundingHistoryItem[] {
  const rng = seededRng(999)
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const pair = PAIRS[Math.floor(rng() * PAIRS.length)]
    const rate = (rng() - 0.5) * 0.0006
    const positionSize = +(rng() * 5 + 0.1).toFixed(3)
    const base = BASE_PRICES[pair] ?? 100
    return {
      id: `fh-${i}`,
      pair,
      rate,
      amount: +(rate * positionSize * base).toFixed(4),
      positionSize,
      timestamp: now - i * 8 * 3600_000,
    }
  })
}

// ─── Funding Rate Chart Data ──────────────────────────────────────────────────

export interface FundingRateSnapshot {
  timestamp: number
  rate: number
  annualized: number
}

export type FundingRange = '24h' | '7d' | '30d'

const RANGE_HOURS: Record<FundingRange, number> = { '24h': 24, '7d': 168, '30d': 720 }

const PAIR_SEEDS: Record<string, number> = {
  'BTC-USD': 5001, 'ETH-USD': 5002, 'SOL-USD': 5003,
  'AAPL-USD': 5004, 'TSLA-USD': 5005,
}

/**
 * Status of the funding-rate history feed:
 *  - `live` — indexer returned a real time series.
 *  - `chain-offline` — the chain RPC is unreachable, so even an indexer
 *    would have nothing fresh to show. UI renders a Retry empty state.
 *  - `unknown` — chain is reachable but no indexer is wired yet (the
 *    default until perps event indexing ships). UI renders a "no data
 *    yet" empty state without a retry button.
 */
export type FundingRateStatus = 'live' | 'chain-offline' | 'unknown'

export interface FundingRateHistoryResult {
  status: FundingRateStatus
  snapshots: readonly FundingRateSnapshot[]
  refetch: () => void
}

const EMPTY_FUNDING_RATE_SNAPSHOTS: readonly FundingRateSnapshot[] = Object.freeze([])

/**
 * Production funding-rate history reader.
 *
 * Today we have no perps-events indexer, so this hook never returns a
 * live series — it just distinguishes "chain unreachable, retry" from
 * "chain up but indexer pending". Once `useOnChainFundingPayments` (or
 * an equivalent subgraph reader) lands, swap the empty snapshots for a
 * real series here and consumers continue to work unchanged.
 *
 * `_symbol` / `_range` are kept on the signature so the eventual
 * indexer-backed implementation can land without re-wiring callers.
 */
export function useFundingRateHistory(
  _symbol: string,
  _range: FundingRange,
): FundingRateHistoryResult {
  const { isError, refetch } = useBlockNumber({
    query: { refetchInterval: 30_000 },
  })

  const refetchSafe = useCallback(() => { void refetch() }, [refetch])

  return useMemo<FundingRateHistoryResult>(() => ({
    status: isError ? 'chain-offline' : 'unknown',
    snapshots: EMPTY_FUNDING_RATE_SNAPSHOTS,
    refetch: refetchSafe,
  }), [isError, refetchSafe])
}

// ─── Production hooks ─────────────────────────────────────────────────────────
// Each hook returns `[]` until perps event indexing ships. The empty array
// flows through PerpsHistoryTabs into the existing `<EmptyState>` branches —
// no fake rows, no orphan Cancel buttons.
//
// TODO: replace each return with the real on-chain reads once
// `useOnChainOpenOrders` / `useOnChainOrderHistory` / `useOnChainTradeHistory`
// / `useOnChainFundingPayments` exist.

const EMPTY_OPEN_ORDERS: readonly HistoryOpenOrder[] = Object.freeze([])
const EMPTY_ORDER_HISTORY: readonly OrderHistoryItem[] = Object.freeze([])
const EMPTY_TRADE_HISTORY: readonly TradeHistoryItem[] = Object.freeze([])
const EMPTY_FUNDING_HISTORY: readonly FundingHistoryItem[] = Object.freeze([])

export function useOpenOrders(): readonly HistoryOpenOrder[] {
  return EMPTY_OPEN_ORDERS
}

export function useOrderHistory(): readonly OrderHistoryItem[] {
  return EMPTY_ORDER_HISTORY
}

export function useTradeHistory(): readonly TradeHistoryItem[] {
  return EMPTY_TRADE_HISTORY
}

export function useFundingHistory(): readonly FundingHistoryItem[] {
  return EMPTY_FUNDING_HISTORY
}

// ─── Demo / fixture hooks ─────────────────────────────────────────────────────
// Storybook + fixture tests only. Production routes MUST NOT import these.

export function useDemoOpenOrders(): HistoryOpenOrder[] {
  return useMemo(() => generateOpenOrders(5), [])
}

export function useDemoOrderHistory(): OrderHistoryItem[] {
  return useMemo(() => generateOrderHistory(20), [])
}

export function useDemoTradeHistory(): TradeHistoryItem[] {
  return useMemo(() => generateTradeHistory(25), [])
}

export function useDemoFundingHistory(): FundingHistoryItem[] {
  return useMemo(() => generateFundingHistory(30), [])
}

/**
 * Demo / fixture funding-rate-history generator. Deterministic LCG walk
 * keyed off `symbol + hours`. Storybook and the funding chart's own
 * unit fixtures may import this; production routes MUST NOT.
 */
export function generateDemoFundingRateHistory(
  symbol: string,
  range: FundingRange,
): FundingRateSnapshot[] {
  const hours = RANGE_HOURS[range]
  const rng = seededRng((PAIR_SEEDS[symbol] ?? 5999) + hours)
  const now = Date.now()
  const snapshots: FundingRateSnapshot[] = []

  let drift = (rng() - 0.4) * 0.0001
  for (let i = hours - 1; i >= 0; i--) {
    drift += (rng() - 0.5) * 0.00004
    const rate = drift + (rng() - 0.5) * 0.0002
    snapshots.push({
      timestamp: now - i * 3600_000,
      rate: +rate.toFixed(6),
      annualized: +(rate * 8760 * 100).toFixed(4),
    })
  }
  return snapshots
}

export function useDemoFundingRateChart(symbol: string, range: FundingRange) {
  return useMemo(() => generateDemoFundingRateHistory(symbol, range), [symbol, range])
}
