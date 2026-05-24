import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { renderHook } from '@testing-library/react'
import {
  useLendPositions,
  useYieldPositions,
  useDemoLendPositions,
  useDemoYieldPositions,
} from '../portfolioLendYieldData'

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..')

function gitGrep(pattern: string, scope: string): string[] {
  // Use git grep to scan tracked files only — avoids picking up generated
  // .next bundles or node_modules.
  try {
    const out = execSync(
      `git grep -n -E ${JSON.stringify(pattern)} -- ${JSON.stringify(scope)}`,
      { cwd: FRONTEND_ROOT, encoding: 'utf8' },
    )
    return out.trim().split('\n').filter(Boolean)
  } catch (err) {
    // git grep exits non-zero when there are no matches.
    const e = err as { status?: number }
    if (e.status === 1) return []
    throw err
  }
}

describe('portfolioLendYieldData — production hooks return empty', () => {
  it('useLendPositions returns an empty position set with all totals zero', () => {
    const { result } = renderHook(() => useLendPositions())
    expect(result.current.supplies).toEqual([])
    expect(result.current.borrows).toEqual([])
    expect(result.current.totalSupplied).toBe(0)
    expect(result.current.totalBorrowed).toBe(0)
    expect(result.current.netValue).toBe(0)
  })

  it('useYieldPositions returns an empty vault set with all totals zero', () => {
    const { result } = renderHook(() => useYieldPositions())
    expect(result.current.vaults).toEqual([])
    expect(result.current.totalDeposited).toBe(0)
    expect(result.current.totalCurrentValue).toBe(0)
    expect(result.current.totalYieldEarned).toBe(0)
  })

  it('useDemoLendPositions still exposes the seed shape for storybook / fixtures', () => {
    const { result } = renderHook(() => useDemoLendPositions())
    expect(result.current.supplies.length).toBeGreaterThan(0)
    expect(result.current.netValue).toBeGreaterThan(0)
  })

  it('useDemoYieldPositions still exposes the seed shape for storybook / fixtures', () => {
    const { result } = renderHook(() => useDemoYieldPositions())
    expect(result.current.vaults.length).toBeGreaterThan(0)
    expect(result.current.totalYieldEarned).toBeGreaterThan(0)
  })
})

describe('portfolioLendYieldData — guardrails', () => {
  it('no app route imports the demo lend/yield hooks', () => {
    const hits = gitGrep('useDemo(Lend|Yield)Positions', 'src/app')
    expect(hits, hits.join('\n')).toEqual([])
  })

  it('no app route references the dropped useMock* names', () => {
    const hits = gitGrep('useMock(Lend|Yield)Positions', 'src/app')
    expect(hits, hits.join('\n')).toEqual([])
  })
})
