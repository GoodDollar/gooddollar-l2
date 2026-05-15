import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// Mutable param mock — each test sets `currentParams` before rendering.
let currentParams: Record<string, string | undefined> = {}
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useParams: () => currentParams,
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@/components/TokenIcon', () => ({
  TokenIcon: ({ symbol }: { symbol: string }) => <span data-testid={`icon-${symbol}`}>{symbol}</span>,
}))

// Stub the dynamic chart component so jsdom doesn't try to render canvas.
vi.mock('@/components/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart" />,
}))

vi.mock('@/lib/chartData', () => ({
  getChartData: () => [],
}))

vi.mock('@/lib/useOnChainMarketData', () => ({
  TOKEN_COLORS: {} as Record<string, string>,
  useOnChainMarketData: () => ({
    isLive: true,
    isLoading: false,
    tokens: [
      {
        symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0',
        category: 'Infrastructure' as const, color: '#627EEA',
        price: 3500, change1h: 0.5, change24h: 1.2, change7d: -2.0,
        volume24h: 1e9, marketCap: 4e11, sparkline7d: [3400, 3450, 3500],
        description: 'Ethereum',
      },
      {
        symbol: 'G$', name: 'GoodDollar', icon: '', decimals: 18, address: '0x1',
        category: 'GoodDollar' as const, color: '#00B0A0',
        price: 0.0002, change1h: 0.1, change24h: -0.5, change7d: 1.0,
        volume24h: 5e5, marketCap: 1e7, sparkline7d: [0.00019, 0.0002, 0.00021],
        description: 'GoodDollar UBI token',
      },
    ],
  }),
}))

import TokenDetailPage from '../page'

describe('TokenDetailPage — URL-encoded symbol handling', () => {
  beforeEach(() => {
    pushMock.mockClear()
    currentParams = {}
  })

  it('resolves G$ when the URL segment is percent-encoded as G%24', () => {
    currentParams = { symbol: 'G%24' }
    render(<TestWrapper><TokenDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'GoodDollar' })).toBeTruthy()
    expect(screen.queryByText(/Token Not Found/i)).toBeNull()
  })

  it('still resolves G$ when the URL segment is already decoded', () => {
    // Defends against double-decoding regressions.
    currentParams = { symbol: 'G$' }
    render(<TestWrapper><TokenDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'GoodDollar' })).toBeTruthy()
    expect(screen.queryByText(/Token Not Found/i)).toBeNull()
  })

  it('resolves ETH normally (no encoding involved)', () => {
    currentParams = { symbol: 'ETH' }
    render(<TestWrapper><TokenDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'Ether' })).toBeTruthy()
    expect(screen.queryByText(/Token Not Found/i)).toBeNull()
  })

  it('falls back to "Token Not Found" without throwing on malformed percent-encoding', () => {
    // `decodeURIComponent` throws URIError on a lone `%`. The page must catch
    // this and render the not-found state instead of crashing.
    currentParams = { symbol: 'BAD%' }
    expect(() =>
      render(<TestWrapper><TokenDetailPage /></TestWrapper>)
    ).not.toThrow()

    expect(screen.getByRole('heading', { name: /Token Not Found/i })).toBeTruthy()
  })
})
