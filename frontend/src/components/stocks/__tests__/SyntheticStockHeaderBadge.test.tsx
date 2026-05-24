import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/marketHours', () => ({
  getMarketSession: vi.fn(),
}))

import { SyntheticStockHeaderBadge } from '@/components/stocks/SyntheticStockHeaderBadge'
import { getMarketSession } from '@/lib/marketHours'

describe('SyntheticStockHeaderBadge — task 0022', () => {
  beforeEach(() => {
    vi.mocked(getMarketSession).mockReset()
  })

  it('renders "Synthetic · trade 24/7" with a subdued dot when the underlying market is closed', () => {
    vi.mocked(getMarketSession).mockReturnValue({
      label: 'Market Closed',
      state: 'closed',
      color: 'text-gray-400',
      dotColor: 'bg-gray-400',
      nextEventLabel: 'Opens Mon',
      nextEventDate: null,
    })

    render(<SyntheticStockHeaderBadge />)
    const pill = screen.getByTestId('synthetic-stock-header-badge')
    expect(pill).toHaveTextContent('Synthetic · trade 24/7')
    expect(pill.getAttribute('data-tone')).toBe('subdued')
    expect(pill.textContent).not.toMatch(/Market Closed/i)
  })

  it('renders "Live · oracle ticking" with an animated dot when the underlying market is open', () => {
    vi.mocked(getMarketSession).mockReturnValue({
      label: 'Market Open',
      state: 'open',
      color: 'text-green-400',
      dotColor: 'bg-green-400',
      nextEventLabel: 'Closes 4:00 PM ET',
      nextEventDate: null,
    })

    render(<SyntheticStockHeaderBadge />)
    const pill = screen.getByTestId('synthetic-stock-header-badge')
    expect(pill).toHaveTextContent('Live · oracle ticking')
    expect(pill.getAttribute('data-tone')).toBe('live')
    const dot = pill.querySelector('span[aria-hidden="true"]')
    expect(dot?.className).toMatch(/animate-pulse/)
  })
})
