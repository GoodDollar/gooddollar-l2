import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewsEventsPanel } from '@/components/stocks/NewsEventsPanel'

describe('NewsEventsPanel', () => {
  it('renders loading state', () => {
    render(<NewsEventsPanel ticker="AAPL" isLoading error={null} items={[]} />)
    expect(screen.getByLabelText(/news loading/i)).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<NewsEventsPanel ticker="AAPL" isLoading={false} error={null} items={[]} />)
    expect(screen.getByText(/No recent catalysts for AAPL yet/i)).toBeInTheDocument()
  })

  it('renders news rows and safe external links', () => {
    render(
      <NewsEventsPanel
        ticker="AAPL"
        isLoading={false}
        error={null}
        items={[
          {
            id: 'n1',
            ticker: 'AAPL',
            headline: 'Apple launches new model line',
            source: 'Market Wire',
            publishedAt: '2026-05-18T15:30:00Z',
            tag: 'Product',
            url: 'https://example.com/aapl-news',
          },
        ]}
      />
    )

    const link = screen.getByRole('link', { name: /Apple launches new model line/i })
    expect(link).toHaveAttribute('href', 'https://example.com/aapl-news')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
