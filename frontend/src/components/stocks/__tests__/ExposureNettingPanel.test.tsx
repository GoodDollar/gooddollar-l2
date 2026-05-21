import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExposureNettingPanel } from '../ExposureNettingPanel'
import type { SymbolExposureSummary } from '@/lib/exposureNetting'

const mockSummaries: SymbolExposureSummary[] = [
  {
    symbol: 'AAPL',
    grossLongUsd: 5000,
    grossShortUsd: 2000,
    netExposureUsd: 3000,
    classification: 'unhedged',
    byProduct: [
      { product: 'amm', sizeUsd: 5000, direction: 'long' },
      { product: 'perps', sizeUsd: 2000, direction: 'short' },
    ],
  },
  {
    symbol: 'TSLA',
    grossLongUsd: 1000,
    grossShortUsd: 900,
    netExposureUsd: 100,
    classification: 'hedged',
    byProduct: [
      { product: 'amm', sizeUsd: 1000, direction: 'long' },
      { product: 'perps', sizeUsd: 900, direction: 'short' },
    ],
  },
]

describe('ExposureNettingPanel', () => {
  it('renders the panel heading', () => {
    render(<ExposureNettingPanel summaries={mockSummaries} portfolioDelta={3100} />)
    expect(screen.getByText('Unified Exposure')).toBeDefined()
  })

  it('shows portfolio delta', () => {
    render(<ExposureNettingPanel summaries={mockSummaries} portfolioDelta={3100} />)
    expect(screen.getByTestId('portfolio-delta')).toBeDefined()
  })

  it('renders a row per symbol', () => {
    render(<ExposureNettingPanel summaries={mockSummaries} portfolioDelta={3100} />)
    expect(screen.getByText('AAPL')).toBeDefined()
    expect(screen.getByText('TSLA')).toBeDefined()
  })

  it('shows classification badges', () => {
    render(<ExposureNettingPanel summaries={mockSummaries} portfolioDelta={3100} />)
    expect(screen.getByText('Unhedged')).toBeDefined()
    expect(screen.getByText('Hedged')).toBeDefined()
  })

  it('renders empty state when no summaries', () => {
    render(<ExposureNettingPanel summaries={[]} portfolioDelta={0} />)
    expect(screen.getByText(/no open positions/i)).toBeDefined()
  })
})
