import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { RebalanceSyncPanel } from '../RebalanceSyncPanel'
import type { RebalanceGuardEvaluation, SymbolRebalanceStatus } from '@/lib/stocksRebalanceInvariant'

const baseStatus: SymbolRebalanceStatus = {
  symbol: 'AAPL',
  snapshotBlock: 101,
  blockProof: [101, 102],
  stalePropagation: false,
  secretLeak: false,
  products: {
    amm: { lastSyncedBlock: 102, divergencePct: 0.1 },
    perps: { lastSyncedBlock: 102, divergencePct: 0.1 },
    predict: { lastSyncedBlock: 102, divergencePct: 0.1 },
    lend: { lastSyncedBlock: 102, divergencePct: 0.1 },
    yield: { lastSyncedBlock: 102, divergencePct: 0.1 },
  },
}

const clearGuard: RebalanceGuardEvaluation = {
  blocked: false,
  reasons: [],
  staleProducts: [],
  maxDivergencePct: 0.1,
  hasTwoBlockProof: true,
}

describe('<RebalanceSyncPanel />', () => {
  it('shows synced state when all products are current', () => {
    render(<RebalanceSyncPanel status={baseStatus} guard={clearGuard} currentBlock={102} />)

    expect(screen.getByTestId('stocks-rebalance-sync-panel')).toBeInTheDocument()
    expect(screen.getByText('Rebalance Sync')).toBeInTheDocument()
    expect(screen.getByText('Synced for trading')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('lists reasons when risk stop is active', () => {
    render(
      <RebalanceSyncPanel
        status={baseStatus}
        guard={{
          blocked: true,
          reasons: ['Awaiting same-block sync for: perps', 'Two-block oracle sync proof missing'],
          staleProducts: ['perps'],
          maxDivergencePct: 0.2,
          hasTwoBlockProof: false,
        }}
        currentBlock={103}
      />,
    )

    expect(screen.getByText('Trading paused — syncing')).toBeInTheDocument()
    expect(screen.getByTestId('stocks-rebalance-reasons')).toBeInTheDocument()
    expect(screen.getByText('Awaiting same-block sync for: perps')).toBeInTheDocument()
  })
})
