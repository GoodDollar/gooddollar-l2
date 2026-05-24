/**
 * perpsHistoryData.ts — Types for /perps history tabs and the funding-rate
 * chart.
 *
 * The hooks return empty arrays until the on-chain event indexer is
 * wired. The previous implementation generated deterministic
 * `seededRng` rows ("realistic placeholder data") which painted red
 * "Cancel" buttons next to orders nobody had placed, fabricated
 * funding-rate bars, and lied to the user about the state of the
 * exchange. The honest empty-state branches that already lived in
 * `PerpsHistoryTabs.tsx` and `FundingRateChart.tsx` now fire because
 * there is no fake data ahead of them. Removed in initiative 0007c,
 * task 0041.
 */

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

export interface FundingRateSnapshot {
  timestamp: number
  rate: number
  annualized: number
}

export type FundingRange = '24h' | '7d' | '30d'

// ─── Frozen empties ───────────────────────────────────────────────────────────
//
// Module-level constants give the consumer hooks stable referential
// identity without needing a `useMemo` inside each hook.

const EMPTY_OPEN_ORDERS: readonly HistoryOpenOrder[] = Object.freeze([])
const EMPTY_ORDER_HISTORY: readonly OrderHistoryItem[] = Object.freeze([])
const EMPTY_TRADE_HISTORY: readonly TradeHistoryItem[] = Object.freeze([])
const EMPTY_FUNDING_HISTORY: readonly FundingHistoryItem[] = Object.freeze([])
const EMPTY_FUNDING_RATES: readonly FundingRateSnapshot[] = Object.freeze([])

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMockOpenOrders(): readonly HistoryOpenOrder[] {
  return EMPTY_OPEN_ORDERS
}

export function useMockOrderHistory(): readonly OrderHistoryItem[] {
  return EMPTY_ORDER_HISTORY
}

export function useMockTradeHistory(): readonly TradeHistoryItem[] {
  return EMPTY_TRADE_HISTORY
}

export function useMockFundingHistory(): readonly FundingHistoryItem[] {
  return EMPTY_FUNDING_HISTORY
}

export function useFundingRateChart(
  _symbol: string,
  _range: FundingRange,
): readonly FundingRateSnapshot[] {
  return EMPTY_FUNDING_RATES
}
