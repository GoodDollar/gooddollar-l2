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

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_SUPPLIES: LendSupply[] = [
  { asset: 'gAAPL', amount: 12.5, apy: 4.2, healthFactor: 2.1, valueUsd: 2_437.50 },
  { asset: 'G$', amount: 5_000, apy: 6.8, healthFactor: 3.4, valueUsd: 5_000.00 },
  { asset: 'gTSLA', amount: 8.0, apy: 3.9, healthFactor: 1.8, valueUsd: 1_424.00 },
]

const MOCK_BORROWS: LendBorrow[] = [
  { asset: 'G$', amount: 2_000, rate: 8.5, accruedInterest: 14.17, valueUsd: 2_000.00 },
]

const MOCK_VAULTS: YieldVault[] = [
  { name: 'GoodStocks LP', asset: 'gAAPL/G$', deposited: 3_000, currentValue: 3_187.50, yieldEarned: 187.50, apy: 12.5 },
  { name: 'Stable Yield', asset: 'G$', deposited: 10_000, currentValue: 10_425.00, yieldEarned: 425.00, apy: 8.5 },
  { name: 'Stock Index', asset: 'gSPY/G$', deposited: 5_000, currentValue: 5_112.75, yieldEarned: 112.75, apy: 9.0 },
]

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useMockLendPositions(): LendPositions {
  return useMemo(() => {
    const totalSupplied = MOCK_SUPPLIES.reduce((s, p) => s + p.valueUsd, 0)
    const totalBorrowed = MOCK_BORROWS.reduce((s, p) => s + p.valueUsd, 0)
    return {
      supplies: MOCK_SUPPLIES,
      borrows: MOCK_BORROWS,
      totalSupplied,
      totalBorrowed,
      netValue: totalSupplied - totalBorrowed,
    }
  }, [])
}

export function useMockYieldPositions(): YieldPositions {
  return useMemo(() => {
    const totalDeposited = MOCK_VAULTS.reduce((s, v) => s + v.deposited, 0)
    const totalCurrentValue = MOCK_VAULTS.reduce((s, v) => s + v.currentValue, 0)
    const totalYieldEarned = MOCK_VAULTS.reduce((s, v) => s + v.yieldEarned, 0)
    return {
      vaults: MOCK_VAULTS,
      totalDeposited,
      totalCurrentValue,
      totalYieldEarned,
    }
  }, [])
}
