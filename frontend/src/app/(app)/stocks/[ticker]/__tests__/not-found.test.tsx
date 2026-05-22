import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-utils/wrapper'

let currentParams: Record<string, string | undefined> = {}
const routerPush = vi.fn()
const mockChartData = vi.hoisted(() => vi.fn())
let currentStocks: Array<{
  ticker: string
  name: string
  sector: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  high52w: number
  low52w: number
  sparkline7d: number[] | null
  peRatio: number
  eps: number
  dividendYield: number
  avgVolume: number
  description?: string
}> = []

const makeStock = (overrides: Partial<{
  ticker: string
  name: string
  sector: string
  price: number
}> = {}) => ({
  ticker: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  price: 190,
  change24h: 1.2,
  marketCap: 1000000000,
  volume24h: 1000000,
  high52w: 210,
  low52w: 120,
  sparkline7d: [1, 2, 3, 4, 5],
  peRatio: 29.4,
  eps: 6.4,
  dividendYield: 0.52,
  avgVolume: 850000,
  ...overrides,
})

vi.mock('next/navigation', () => ({
  useParams: () => currentParams,
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('@/components/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart" />,
}))

vi.mock('@/lib/chartData', () => ({
  getChartData: mockChartData,
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: currentStocks, isLive: false, isLoading: false }),
}))

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: () => ({ mint: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), phase: 'idle', error: null }),
  useStockPosition: () => ({ position: null, isLoading: false }),
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => true,
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: () => null },
}))

import StockDetailPage from '../page'

describe('StockDetailPage invalid ticker messaging hardening', () => {
  beforeEach(() => {
    currentParams = {}
    currentStocks = []
    routerPush.mockReset()
    mockChartData.mockReset()
    mockChartData.mockImplementation(() => [])
  })

  it('renders a generic not-found message without echoing plain invalid ticker input', () => {
    currentParams = { ticker: 'NOTAREALSTOCK' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: /Stock Not Found/i })).toBeTruthy()
    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    expect(paragraph).toBeTruthy()
    expect(paragraph.textContent).not.toContain('NOTAREALSTOCK')
  })

  it('does not leak encoded whitespace payload (%20) in error copy', () => {
    currentParams = { ticker: '%20' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%20')
  })

  it('does not leak encoded null-byte payload (%00) in error copy', () => {
    currentParams = { ticker: '%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%00')
  })

  it('does not leak double-encoded whitespace payload (%2520) in error copy', () => {
    currentParams = { ticker: '%2520' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%2520')
    expect(text).not.toContain('%20')
  })

  it('does not leak encoded script-like payload (%3Csvg...) in error copy', () => {
    currentParams = { ticker: '%3Csvg%20onload%3Dalert(1)%3E' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%3C')
    expect(text).not.toContain('SVG')
    expect(text).not.toContain('ALERT')
  })

  it('does not leak encoded slash payload (%2F) in error copy', () => {
    currentParams = { ticker: '%2F' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%2F')
  })

  it('does not leak repeated percent-encoded payload (%252525252525) in error copy', () => {
    currentParams = { ticker: '%252525252525' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%252525252525')
  })

  it('does not leak double-encoded traversal payload (%252F..%252F%00) in error copy', () => {
    currentParams = { ticker: '%252F..%252F%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('%252F')
    expect(text).not.toContain('..')
    expect(text).not.toContain('%00')
  })

  it('does not leak mixed alphanumeric null-byte payload (AAPL%00) in error copy', () => {
    currentParams = { ticker: 'AAPL%00' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const paragraph = screen.getByText(/This stock symbol is not available\./i)
    const text = paragraph.textContent ?? ''
    expect(text).not.toContain('AAPL%00')
  })

  it('still provides quick recovery links', () => {
    currentParams = { ticker: 'NOTAREALSTOCK' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const aapl = screen.getByRole('link', { name: 'AAPL' })
    const msft = screen.getByRole('link', { name: 'MSFT' })
    const nvda = screen.getByRole('link', { name: 'NVDA' })
    expect(aapl.getAttribute('href')).toBe('/stocks/AAPL')
    expect(msft.getAttribute('href')).toBe('/stocks/MSFT')
    expect(nvda.getAttribute('href')).toBe('/stocks/NVDA')
  })

  it('resolves valid lowercase ticker to stock detail page', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'aapl' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Stock Not Found/i })).toBeNull()
  })

  it('resolves double-encoded valid ticker to stock detail page', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: '%2541APL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByRole('heading', { name: 'AAPL' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Stock Not Found/i })).toBeNull()
  })

  it('shows stocks-focused next actions in empty-position state on valid detail pages', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const buyLink = screen.getByRole('link', { name: /Buy sAAPL/i })
    const portfolioLink = screen.getByRole('link', { name: /Open Stock Portfolio/i })
    const browseLink = screen.getByRole('link', { name: /Browse Stocks/i })

    expect(buyLink.getAttribute('href')).toBe('/stocks/AAPL#stock-order-form')
    expect(portfolioLink.getAttribute('href')).toBe('/stocks/portfolio')
    expect(browseLink.getAttribute('href')).toBe('/stocks')

    expect(screen.queryByRole('link', { name: /Explore crypto tokens/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Trade crypto perpetual futures/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Prediction markets/i })).toBeNull()
  })

  it('renders timeframe controls in a single-row horizontal rail to avoid mobile wrapping', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const tablist = screen.getByRole('tablist', { name: /chart timeframe/i })
    expect(tablist.className).toContain('overflow-x-auto')
    expect(tablist.className).toContain('flex-nowrap')
  })

  it('supports quick symbol switching from the detail page via keyboard Enter', () => {
    currentStocks = [makeStock(), makeStock({ ticker: 'NVDA', name: 'NVIDIA Corp.' })]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const switchInput = screen.getByLabelText('Switch stock symbol')
    fireEvent.change(switchInput, { target: { value: 'NVDA' } })
    fireEvent.keyDown(switchInput, { key: 'Enter' })

    expect(routerPush).toHaveBeenCalledWith('/stocks/NVDA')
  })

  it('shows a mobile switcher trigger and navigates on Go', () => {
    currentStocks = [makeStock(), makeStock({ ticker: 'MSFT', name: 'Microsoft Corp.' })]
    currentParams = { ticker: 'AAPL' }
    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    fireEvent.click(screen.getByRole('button', { name: 'Switch Symbol' }))
    const mobileInput = screen.getByLabelText('Switch stock symbol mobile')
    fireEvent.change(mobileInput, { target: { value: 'MSFT' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Go' })[1])

    expect(routerPush).toHaveBeenCalledWith('/stocks/MSFT')
  })

  it('renders a timeframe performance summary and updates label/value when tabs change', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    mockChartData.mockImplementation((_symbol: string, timeframe: string, basePrice: number) => {
      if (timeframe === '3M') return [{ close: 100, open: 100, high: 101, low: 99, volume: 1, time: 1 }, { close: 110, open: 100, high: 111, low: 99, volume: 1, time: 2 }]
      if (timeframe === '1D') return [{ close: 200, open: 200, high: 201, low: 199, volume: 1, time: 1 }, { close: 190, open: 200, high: 201, low: 189, volume: 1, time: 2 }]
      return [{ close: basePrice, open: basePrice, high: basePrice, low: basePrice, volume: 1, time: 1 }, { close: basePrice, open: basePrice, high: basePrice, low: basePrice, volume: 1, time: 2 }]
    })

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByText('+10.00%')).toBeTruthy()
    expect(screen.getByText('Past 3 Months')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: '1D' }))

    expect(screen.getByText('-5.00%')).toBeTruthy()
    expect(screen.getByText('Past Day')).toBeTruthy()
  })

  it('supports arrow-key navigation for chart timeframe tabs', async () => {
    const user = userEvent.setup()
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    mockChartData.mockImplementation((_symbol: string, timeframe: string, basePrice: number) => {
      if (timeframe === '3M') return [{ close: 100, open: 100, high: 101, low: 99, volume: 1, time: 1 }, { close: 110, open: 100, high: 111, low: 99, volume: 1, time: 2 }]
      if (timeframe === '6M') return [{ close: 200, open: 200, high: 201, low: 199, volume: 1, time: 1 }, { close: 160, open: 200, high: 201, low: 159, volume: 1, time: 2 }]
      return [{ close: basePrice, open: basePrice, high: basePrice, low: basePrice, volume: 1, time: 1 }, { close: basePrice, open: basePrice, high: basePrice, low: basePrice, volume: 1, time: 2 }]
    })

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    const threeMonthTab = screen.getByRole('tab', { name: '3M' })
    threeMonthTab.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: '6M' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('-20.00%')).toBeTruthy()
    expect(screen.getByText('Past 6 Months')).toBeTruthy()
  })

  it('shows quote context metadata and day range in key statistics', () => {
    currentStocks = [makeStock()]
    currentParams = { ticker: 'AAPL' }
    mockChartData.mockImplementation((_symbol: string, timeframe: string, basePrice: number) => {
      if (timeframe === '1D') {
        return [
          { close: 198, open: 197, high: 201, low: 190, volume: 1, time: 1 },
          { close: 200, open: 198, high: 200.5, low: 194, volume: 1, time: 2 },
        ]
      }
      return [
        { close: basePrice, open: basePrice, high: basePrice, low: basePrice, volume: 1, time: 1 },
        { close: basePrice, open: basePrice, high: basePrice, low: basePrice, volume: 1, time: 2 },
      ]
    })

    render(<TestWrapper><StockDetailPage /></TestWrapper>)

    expect(screen.getByText('USD · Oracle source: stocks-keeper · Updated live')).toBeTruthy()
    expect(screen.getByText('Day Range')).toBeTruthy()
    expect(screen.getByText('$190.00 - $201.00')).toBeTruthy()
  })
})
