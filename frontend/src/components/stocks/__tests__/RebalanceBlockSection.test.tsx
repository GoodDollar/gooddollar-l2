import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

let mockBlockNumber: bigint | undefined = 99999n

vi.mock('wagmi', () => ({
  useBlockNumber: vi.fn(() => ({ data: mockBlockNumber })),
}))

vi.mock('@/hooks/useThrottledBlockNumber', () => ({
  useThrottledBlockNumber: () =>
    mockBlockNumber != null ? Number(mockBlockNumber) : null,
}))

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<any> }>) => {
    let Comp: React.ComponentType<any> | null = null
    loader().then((mod) => { Comp = mod.default })
    return function DynamicWrapper(props: any) {
      if (!Comp) {
        loader().then((mod) => { Comp = mod.default })
        return null
      }
      return React.createElement(Comp, props)
    }
  },
}))

vi.mock('@/components/stocks/RebalanceSyncPanel', () => ({
  RebalanceSyncPanel: ({ currentBlock, guard }: { currentBlock: number | null; guard: { blocked: boolean } }) => (
    <div data-testid="rebalance-sync-panel">
      block={String(currentBlock)} blocked={String(guard.blocked)}
    </div>
  ),
}))

vi.mock('@/components/stocks/RebalanceErrorBoundary', () => ({
  RebalanceErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import {
  buildSymbolRebalanceStatus,
  type SymbolRebalanceStatus,
} from '@/lib/stocksRebalanceInvariant'

import { RebalanceBlockSection } from '../RebalanceBlockSection'

function makeStatus(symbol = 'AAPL'): SymbolRebalanceStatus {
  return buildSymbolRebalanceStatus(symbol, {})
}

describe('RebalanceBlockSection', () => {
  it('renders RebalanceSyncPanel with block data from useThrottledBlockNumber', () => {
    mockBlockNumber = 42000n
    const onRisk = vi.fn()
    render(
      <RebalanceBlockSection
        symbolRebalanceStatus={makeStatus()}
        onRiskBlockReasonChange={onRisk}
      />,
    )
    expect(screen.getByTestId('rebalance-sync-panel')).toBeDefined()
    expect(screen.getByTestId('rebalance-sync-panel').textContent).toContain(
      'block=42000',
    )
  })

  it('calls onRiskBlockReasonChange with the derived reason', () => {
    mockBlockNumber = 42000n
    const onRisk = vi.fn()
    render(
      <RebalanceBlockSection
        symbolRebalanceStatus={makeStatus()}
        onRiskBlockReasonChange={onRisk}
      />,
    )
    expect(onRisk).toHaveBeenCalled()
    const lastCall = onRisk.mock.calls[onRisk.mock.calls.length - 1][0]
    expect(typeof lastCall === 'string' || lastCall === null).toBe(true)
  })

  it('handles null block number gracefully', () => {
    mockBlockNumber = undefined
    const onRisk = vi.fn()
    render(
      <RebalanceBlockSection
        symbolRebalanceStatus={makeStatus()}
        onRiskBlockReasonChange={onRisk}
      />,
    )
    expect(screen.getByTestId('rebalance-sync-panel').textContent).toContain(
      'block=null',
    )
  })
})
