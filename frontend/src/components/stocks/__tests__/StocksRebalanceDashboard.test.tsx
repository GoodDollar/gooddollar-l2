import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StocksRebalanceDashboard } from '@/components/stocks/StocksRebalanceDashboard'

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
})
