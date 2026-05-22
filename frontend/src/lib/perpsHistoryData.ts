/**
 * perpsHistoryData.ts — Types and mock data generators for Perps history tabs.
 *
 * Provides hooks returning realistic placeholder data for Open Orders,
 * Order History, Trade History, and Funding History until on-chain event
 * indexing is available.
 */

import { useMemo } from 'react'

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

// ─── Generators ───────────────────────────────────────────────────────────────

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

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMockOpenOrders() {
  return useMemo(() => generateOpenOrders(5), [])
}

export function useMockOrderHistory() {
  return useMemo(() => generateOrderHistory(20), [])
}

export function useMockTradeHistory() {
  return useMemo(() => generateTradeHistory(25), [])
}

export function useMockFundingHistory() {
  return useMemo(() => generateFundingHistory(30), [])
}
