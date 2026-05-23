import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PerpsHistoryTabs } from '@/components/PerpsHistoryTabs'

describe('PerpsHistoryTabs', () => {
  it('renders the honest "no open orders" empty state — no table, no Cancel buttons, no badge', () => {
    render(<PerpsHistoryTabs />)
    expect(screen.getByText('No open orders')).toBeInTheDocument()
    expect(screen.queryByText('Cancel')).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText(/on-chain event indexer/i)).toBeInTheDocument()
  })

  it('does not render the "(5)" tab badge when the open-orders list is empty', () => {
    const { container } = render(<PerpsHistoryTabs />)
    expect(container.querySelector('.bg-goodgreen\\/15.text-goodgreen.font-semibold')).toBeNull()
    expect(screen.queryByText('5')).toBeNull()
  })

  it('shows the funding-history empty state on click without rendering fake rows', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Funding History/i }))
    expect(screen.getByText('No funding payments')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows the trade-history empty state on click without rendering fake rows', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Trade History/i }))
    expect(screen.getByText('No trade history')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('shows the order-history empty state on click without rendering fake rows', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: /Order History/i }))
    expect(screen.getByText('No order history')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
