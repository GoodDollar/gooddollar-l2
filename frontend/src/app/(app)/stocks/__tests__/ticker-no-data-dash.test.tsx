/**
 * /stocks/[ticker] — Analysis panel + Peer Compare + RelatedMoversPanel must
 * render `—` for chain-path sentinel zeros, never literal `0` / `+0.00%` /
 * `0.0x` / `$0.00`.
 *
 * Mirror of `no-data-dash.test.tsx` (task 0009) for the surfaces task 0009
 * missed (task 0012). When `useOnChainStocks` returns `change24h: 0,
 * peRatio: 0, eps: 0, marketCap: 0, avgVolume: 0` for the active ticker AND
 * its peers, the page must show `—` everywhere those values appear, plus
 * the empty-state copy on the Daily movers panel.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type React from 'react'
import { TestWrapper } from '@/test-utils/wrapper'

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({ ticker: 'AAPL' }),
  usePathname: () => '/stocks/AAPL',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, prefetch: _prefetch, ...rest }: { href: string; children: React.ReactNode; prefetch?: boolean }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: undefined, isConnected: false, chainId: 42220 }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

const sentinelStock = (ticker: string, name = ticker, sector = 'Technology') => ({
  ticker,
  name,
  sector,
  description: `${name} synthetic`,
  price: 100,
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  high52w: 0,
  low52w: 0,
  sparkline7d: [100, 100, 100],
  peRatio: 0,
  eps: 0,
  dividendYield: 0,
  avgVolume: 0,
})

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: [
      sentinelStock('AAPL', 'Apple'),
      sentinelStock('MSFT', 'Microsoft'),
      sentinelStock('NVDA', 'Nvidia'),
      sentinelStock('GOOGL', 'Alphabet'),
      sentinelStock('META', 'Meta Platforms'),
    ],
    isLoading: false,
    isLive: false,
  }),
}))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({
    data: [],
    isLoading: false,
    error: null,
    bySymbol: {},
  }),
}))

vi.mock('@/lib/useStocks', () => ({
  useStockPosition: () => ({ position: undefined }),
  useMintSynthetic: () => ({ mint: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
  useRedeemSynthetic: () => ({ redeem: vi.fn(), phase: 'idle', error: null, isDeployed: false }),
}))

vi.mock('@/lib/useStockNews', () => ({
  useStockNews: () => ({ items: [], isLoading: false, error: null }),
}))

vi.mock('@/lib/useStockWatchlist', () => ({
  useStockWatchlist: () => ({
    favorites: new Set(),
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}))

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => true,
}))

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => ({
      status: null,
      isLoading: false,
      error: null,
      nextRetryAt: null,
    }),
  }
})

import StockDetailPage from '@/app/(app)/stocks/[ticker]/page'

describe('/stocks/[ticker] — Analysis + Peer Compare + Movers gates (task 0012)', () => {
  it('renders the Analysis panel P/E, EPS, and avg vol cells as em-dash for sentinel zeros', () => {
    render(
      <TestWrapper>
        <StockDetailPage />
      </TestWrapper>
    )

    const pe = screen.getByTestId('analysis-pe')
    expect(pe).toHaveTextContent(/^P\/E —$/)
    expect(pe).toHaveClass('text-gray-500')

    const eps = screen.getByTestId('analysis-eps')
    expect(eps).toHaveTextContent(/^EPS —$/)
    expect(eps).toHaveClass('text-gray-500')

    const avgVol = screen.getByTestId('analysis-avg-vol')
    expect(avgVol).toHaveTextContent('—')
    expect(avgVol).not.toHaveTextContent(/0 avg vol/)
  })

  it('Peer Compare renders the empty-state when every visible peer is missing the active metric', () => {
    render(
      <TestWrapper>
        <StockDetailPage />
      </TestWrapper>
    )

    // Default peerMetric is 'change24h'. With every peer at change24h: 0
    // the panel should bail to the existing "Peer data unavailable right now."
    // empty state, not render a wall of green +0.00% rows.
    const empty = screen.getByTestId('peer-empty-state')
    expect(empty).toHaveTextContent(/peer data unavailable/i)

    // No `peer-row-*` data-testids should be rendered — the empty state
    // takes the whole table.
    expect(screen.queryAllByTestId(/^peer-row-/)).toHaveLength(0)
  })

  it('"Discover More Stocks" Daily movers shows the empty-state when every mover has no live change', () => {
    render(
      <TestWrapper>
        <StockDetailPage />
      </TestWrapper>
    )

    const empty = screen.getByTestId('related-movers-empty')
    expect(empty).toHaveTextContent(/no live movers yet — waiting for feed\./i)

    // The empty-state branch took over — no per-mover row was rendered.
    // The Daily movers section has its own `mov-` link pattern; with the
    // empty branch active there should be no `+0.00%` *within the empty
    // state's parent panel*. The panel is the closest ancestor with the
    // mt-3 sibling class.
    const panel = empty.parentElement!
    expect(within(panel).queryAllByText(/^\+0\.00%$/)).toHaveLength(0)
  })
})
