import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewsEventsPanel } from '@/components/stocks/NewsEventsPanel'
import type { StockNewsItem } from '@/lib/stockInsights'

const FORBIDDEN = /Apple supply-chain update|Apple expands on-device AI suite|Services revenue tops \$26B|Market Wire|Tech Ledger|Earnings Desk|News powered by GoodChain/

describe('NewsEventsPanel', () => {
  it('renders loading state', () => {
    render(<NewsEventsPanel ticker="AAPL" isLoading error={null} items={[]} />)
    expect(screen.getByLabelText(/news loading/i)).toBeInTheDocument()
  })

  describe('task 0030 — no fabricated headlines', () => {
    it('renders feed-pending empty state when items is []', () => {
      const { container } = render(
        <NewsEventsPanel ticker="AAPL" isLoading={false} error={null} items={[]} />,
      )
      expect(screen.getByTestId('news-events-source-pending')).toBeInTheDocument()
      expect(screen.getByText(/No news feed configured yet/i)).toBeInTheDocument()
      expect(screen.getByText(/Source: feed pending/i)).toBeInTheDocument()
      expect(container.textContent ?? '').not.toMatch(FORBIDDEN)
    })

    it('renders feed-pending empty state when items is null', () => {
      const { container } = render(
        <NewsEventsPanel ticker="AAPL" isLoading={false} error={null} items={null} />,
      )
      expect(screen.getByTestId('news-events-source-pending')).toBeInTheDocument()
      expect(container.textContent ?? '').not.toMatch(FORBIDDEN)
    })

    it('renders provided items + derives Xd ago from publishedAt; no "News powered by GoodChain" caption', () => {
      const day = 24 * 60 * 60 * 1000
      const items: StockNewsItem[] = [
        { id: 'a', ticker: 'AAPL', headline: 'Real Apple Q1 results', source: 'Wire News',
          publishedAt: new Date(Date.now() - 1 * day).toISOString(), tag: 'Earnings',
          url: 'https://example.com/a' },
        { id: 'b', ticker: 'AAPL', headline: 'Real Apple guidance lift', source: 'Wire News',
          publishedAt: new Date(Date.now() - 3 * day).toISOString(), tag: 'Guidance',
          url: 'https://example.com/b' },
        { id: 'c', ticker: 'AAPL', headline: 'Real Apple product reveal', source: 'Wire News',
          publishedAt: new Date(Date.now() - 5 * day).toISOString(), tag: 'Product',
          url: 'https://example.com/c' },
      ]
      const { container } = render(
        <NewsEventsPanel ticker="AAPL" isLoading={false} error={null} items={items} />,
      )

      expect(screen.getByRole('link', { name: /Real Apple Q1 results/i })).toHaveAttribute('href', 'https://example.com/a')
      expect(screen.getByRole('link', { name: /Real Apple guidance lift/i })).toHaveAttribute('href', 'https://example.com/b')
      expect(screen.getByRole('link', { name: /Real Apple product reveal/i })).toHaveAttribute('href', 'https://example.com/c')
      expect(screen.getByText('1d ago')).toBeInTheDocument()
      expect(screen.getByText('3d ago')).toBeInTheDocument()
      expect(screen.getByText('5d ago')).toBeInTheDocument()
      expect(container.textContent ?? '').not.toMatch(/News powered by GoodChain/)
    })
  })
})
