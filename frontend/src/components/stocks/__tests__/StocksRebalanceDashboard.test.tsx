import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StocksRebalanceDashboard } from '@/components/stocks/StocksRebalanceDashboard'
import type { RebalanceInvariantResult } from '@/lib/stocksRebalanceInvariant'

function unsyncedFixture(symbol: string): RebalanceInvariantResult {
  return {
    symbol,
    currentBlock: 0,
    oracleBlock: 0,
    products: { amm: 0, perps: 0, prediction: 0, lend: 0, yield: 0 },
    lastSyncedBlock: 0,
    blockSkew: 0,
    divergenceBps: 0,
    coherentBlock: false,
    stopReasons: [],
    riskIncreaseAllowed: false,
  }
}

describe('StocksRebalanceDashboard', () => {
  it('renders symbol rows with open/stopped risk gates', () => {
    render(
      <StocksRebalanceDashboard
        symbols={[
          {
            symbol: 'AAPL',
            currentBlock: 100,
            oracleBlock: 100,
            products: { amm: 100, perps: 100, prediction: 100, lend: 100, yield: 100 },
            lastSyncedBlock: 100,
            blockSkew: 0,
            divergenceBps: 12,
            coherentBlock: true,
            stopReasons: [],
            riskIncreaseAllowed: true,
          },
          {
            symbol: 'TSLA',
            currentBlock: 100,
            oracleBlock: 100,
            products: { amm: 100, perps: 99, prediction: 100, lend: 100, yield: 100 },
            lastSyncedBlock: 99,
            blockSkew: 1,
            divergenceBps: 55,
            coherentBlock: false,
            stopReasons: ['stale_propagation', 'cross_product_block_mismatch'],
            riskIncreaseAllowed: false,
          },
        ]}
      />,
    )

    expect(screen.getByText('Drift & Rebalance')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Stopped')).toBeInTheDocument()
  })

  it('shows skeleton shimmer when loading and error text when errored', () => {
    const { container, rerender } = render(<StocksRebalanceDashboard symbols={[]} isLoading />)
    expect(screen.queryByText(/Loading symbol sync status/i)).not.toBeInTheDocument()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)

    rerender(<StocksRebalanceDashboard symbols={[]} error="status 503" />)
    expect(screen.getByText(/Unable to load sync status/i)).toBeInTheDocument()
  })

  it('collapses to one rebalance-all-unsynced banner when every symbol is unsynced (task 0007d-0020)', () => {
    render(
      <StocksRebalanceDashboard
        symbols={[unsyncedFixture('AAPL'), unsyncedFixture('TSLA'), unsyncedFixture('NVDA')]}
      />,
    )

    const banner = screen.getByTestId('rebalance-all-unsynced')
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toMatch(/Oracle has not synced any of 3 symbols yet/i)
    expect(banner.textContent).toMatch(/AAPL.*TSLA.*NVDA/)

    // Table must NOT render in the all-unsynced state.
    expect(document.querySelector('table')).toBeNull()
    expect(screen.queryAllByTestId('rebalance-row-unsynced')).toHaveLength(0)
  })

  it('renders the table when at least one symbol is synced (mixed case is unchanged)', () => {
    render(
      <StocksRebalanceDashboard
        symbols={[
          {
            ...unsyncedFixture('AAPL'),
            lastSyncedBlock: 12345,
            oracleBlock: 12345,
            currentBlock: 12345,
            riskIncreaseAllowed: true,
            coherentBlock: true,
          },
          unsyncedFixture('TSLA'),
          unsyncedFixture('NVDA'),
        ]}
      />,
    )

    expect(screen.queryByTestId('rebalance-all-unsynced')).toBeNull()
    expect(document.querySelector('table')).not.toBeNull()
    expect(screen.getAllByTestId('rebalance-row')).toHaveLength(1)
    expect(screen.getAllByTestId('rebalance-row-unsynced')).toHaveLength(2)
  })

  it('zero symbols still uses the rebalance-empty branch — banner does not steal that case', () => {
    render(<StocksRebalanceDashboard symbols={[]} />)
    expect(screen.getByTestId('rebalance-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('rebalance-all-unsynced')).toBeNull()
    expect(document.querySelector('table')).toBeNull()
  })
})
