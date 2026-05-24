'use client'

import { useMemo } from 'react'

// ─── GoodLend Types ─────────────────────────────────────────────────────────

export interface LendSupply {
  asset: string
  amount: number
  apy: number
  healthFactor: number
  valueUsd: number
}

export interface LendBorrow {
  asset: string
  amount: number
  rate: number
  accruedInterest: number
  valueUsd: number
}

export interface LendPositions {
  supplies: LendSupply[]
  borrows: LendBorrow[]
  totalSupplied: number
  totalBorrowed: number
  netValue: number
}

// ─── GoodYield Types ────────────────────────────────────────────────────────

export interface YieldVault {
  name: string
  asset: string
  deposited: number
  currentValue: number
  yieldEarned: number
  apy: number
}

export interface YieldPositions {
  vaults: YieldVault[]
  totalDeposited: number
  totalCurrentValue: number
  totalYieldEarned: number
}

// ─── Empty defaults ─────────────────────────────────────────────────────────

const EMPTY_LEND: LendPositions = {
  supplies: [],
  borrows: [],
  totalSupplied: 0,
  totalBorrowed: 0,
  netValue: 0,
}

const EMPTY_YIELD: YieldPositions = {
  vaults: [],
  totalDeposited: 0,
  totalCurrentValue: 0,
  totalYieldEarned: 0,
}

// ─── Demo seed data ─────────────────────────────────────────────────────────
// Kept in this file (not deleted) so storybook / fixture tests can opt into
// the seed shape via the explicit `useDemo*` hooks below. Production routes
// MUST NOT import these constants — the `useLendPositions` / `useYieldPositions`
// hooks return `EMPTY_LEND` / `EMPTY_YIELD` until on-chain reads are wired.

const DEMO_SUPPLIES: LendSupply[] = [
  { asset: 'gAAPL', amount: 12.5, apy: 4.2, healthFactor: 2.1, valueUsd: 2_437.50 },
  { asset: 'G$', amount: 5_000, apy: 6.8, healthFactor: 3.4, valueUsd: 5_000.00 },
  { asset: 'gTSLA', amount: 8.0, apy: 3.9, healthFactor: 1.8, valueUsd: 1_424.00 },
]

const DEMO_BORROWS: LendBorrow[] = [
  { asset: 'G$', amount: 2_000, rate: 8.5, accruedInterest: 14.17, valueUsd: 2_000.00 },
]

const DEMO_VAULTS: YieldVault[] = [
  { name: 'GoodStocks LP', asset: 'gAAPL/G$', deposited: 3_000, currentValue: 3_187.50, yieldEarned: 187.50, apy: 12.5 },
  { name: 'Stable Yield', asset: 'G$', deposited: 10_000, currentValue: 10_425.00, yieldEarned: 425.00, apy: 8.5 },
  { name: 'Stock Index', asset: 'gSPY/G$', deposited: 5_000, currentValue: 5_112.75, yieldEarned: 112.75, apy: 9.0 },
]

// ─── Production hooks ───────────────────────────────────────────────────────

/**
 * Production lending positions hook. Returns empty until on-chain reads from
 * GoodLend are wired in; never returns mock numbers. Components should fall
 * through to their existing `supplies.length === 0 && borrows.length === 0`
 * empty-state branch.
 */
export function useLendPositions(): LendPositions {
  return EMPTY_LEND
}

/**
 * Production yield positions hook. Returns empty until on-chain reads from
 * GoodYield are wired in; never returns mock numbers. Components should fall
 * through to their existing `vaults.length === 0` empty-state branch.
 */
export function useYieldPositions(): YieldPositions {
  return EMPTY_YIELD
}

// ─── Demo / fixture hooks ───────────────────────────────────────────────────

/**
 * Demo lending positions for storybook and fixture tests only. NOT for
 * production routes — `/portfolio` must not import this hook.
 */
export function useDemoLendPositions(): LendPositions {
  return useMemo(() => {
    const totalSupplied = DEMO_SUPPLIES.reduce((s, p) => s + p.valueUsd, 0)
    const totalBorrowed = DEMO_BORROWS.reduce((s, p) => s + p.valueUsd, 0)
    return {
      supplies: DEMO_SUPPLIES,
      borrows: DEMO_BORROWS,
      totalSupplied,
      totalBorrowed,
      netValue: totalSupplied - totalBorrowed,
    }
  }, [])
}

/**
 * Demo yield positions for storybook and fixture tests only. NOT for
 * production routes — `/portfolio` must not import this hook.
 */
export function useDemoYieldPositions(): YieldPositions {
  return useMemo(() => {
    const totalDeposited = DEMO_VAULTS.reduce((s, v) => s + v.deposited, 0)
    const totalCurrentValue = DEMO_VAULTS.reduce((s, v) => s + v.currentValue, 0)
    const totalYieldEarned = DEMO_VAULTS.reduce((s, v) => s + v.yieldEarned, 0)
    return {
      vaults: DEMO_VAULTS,
      totalDeposited,
      totalCurrentValue,
      totalYieldEarned,
    }
  }, [])
}
