/**
 * Lane-4 invariant: every price element on every lane-4 surface MUST be
 * accompanied by a `PriceSourceBadge` (data-testid="price-source-badge")
 * inside the same logical container.
 *
 * "Logical container" = the nearest ancestor that is one of:
 *   - <tr>                                                    (table row)
 *   - element with data-testid="live-price-card"              (price card)
 *   - the surface root we mount in the test                   (page/strip)
 *
 * If you remove a badge or render a bare price, this test fails. To opt a new
 * surface in, render it here with deterministic mocks and tag its price cell
 * with data-testid="live-price" or data-testid="price-cell".
 *
 * Covers six surfaces: Swap (landing strip), Perps, Portfolio, Analytics,
 * Activity, Stocks.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/',
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', chainId: 42220 }),
  }
})

vi.mock('@/lib/usePriceFeeds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceFeeds')>()
  return {
    ...actual,
    usePriceFeeds: () => ({
      prices: { ETH: 3000, BTC: 60_000, USDC: 1, 'G$': 0.0002, WBTC: 60_000 },
      sources: {
        ETH: 'coingecko', BTC: 'coingecko', USDC: 'coingecko', 'G$': 'coingecko', WBTC: 'coingecko',
      },
      quotes: {
        ETH: { symbol: 'ETH', price: 3000, change24h: 1.0, marketCap: 1e12, volume24h: 1e10 },
        BTC: { symbol: 'BTC', price: 60_000, change24h: 2.0, marketCap: 1e12, volume24h: 1e10 },
        USDC: { symbol: 'USDC', price: 1, change24h: 0, marketCap: 1e10, volume24h: 1e9 },
        'G$': { symbol: 'G$', price: 0.0002, change24h: 0.5, marketCap: 1e7, volume24h: 1e6 },
        WBTC: { symbol: 'WBTC', price: 60_000, change24h: 2.0, marketCap: 1e10, volume24h: 1e9 },
      },
      isLive: true,
      isLoading: false,
      lastUpdated: new Date(),
      unknownSymbols: [],
      refresh: vi.fn(),
    }),
  }
})

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => ({
      status: {
        healthy: true,
        freshCount: 4,
        totalCount: 4,
        quotes: [
          { symbol: 'ETH', lastUpdateMs: 1000, sessionState: 'open', confidence: 1 },
          { symbol: 'BTC', lastUpdateMs: 1000, sessionState: 'open', confidence: 1 },
          { symbol: 'USDC', lastUpdateMs: 1000, sessionState: 'open', confidence: 1 },
          { symbol: 'G$', lastUpdateMs: 1000, sessionState: 'open', confidence: 1 },
        ],
        timestamp: Date.now(),
      },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    }),
  }
})

vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: () => ({
    prices: { AAPL: 220 },
    sources: { AAPL: 'chain-oracle' } as Record<string, 'chain-oracle' | 'fallback'>,
    hasLiveData: true,
    isLoading: false,
    isPartial: false,
    isFallback: false,
    missingSymbols: [],
  }),
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: () => ({
    pairs: [
      { marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD', markPrice: 60_000, indexPrice: 60_000, change24h: 2.0, volume24h: 0, fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100, high24h: 0, low24h: 0 },
      { marketId: 1, symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD', markPrice: 3_000, indexPrice: 3_000, change24h: 1.0, volume24h: 0, fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 50, high24h: 0, low24h: 0 },
    ],
    isLoading: false,
    isLive: true,
  }),
  useOnChainPositions: () => ({ positions: [], isLoading: false }),
  useOnChainAccountSummary: () => ({ summary: { balance: 0, equity: 0, unrealizedPnl: 0, marginUsed: 0, availableMargin: 0, marginRatio: 0 }, isLoading: false }),
}))

import { LandingPriceStrip } from '@/components/LandingPriceStrip'
import { PerpsPriceStrip } from '@/components/PerpsPriceStrip'
import { PortfolioPriceStrip } from '@/components/PortfolioPriceStrip'
import { AnalyticsPriceStrip } from '@/components/AnalyticsPriceStrip'
import { ActivityPriceStrip } from '@/components/ActivityPriceStrip'

const surfaces: Array<{ name: string; render: () => React.ReactElement }> = [
  { name: 'Swap (landing strip)',   render: () => <LandingPriceStrip /> },
  { name: 'Perps strip',            render: () => <PerpsPriceStrip activeSymbol="BTC-USD" /> },
  { name: 'Portfolio strip',        render: () => <PortfolioPriceStrip stockTickers={['AAPL']} cryptoSymbols={['ETH', 'BTC']} /> },
  { name: 'Analytics strip',        render: () => <AnalyticsPriceStrip /> },
  { name: 'Activity strip',         render: () => <ActivityPriceStrip /> },
]

function nearestContainer(el: Element, root: Element): Element {
  // Walk up to the nearest tr / live-price-card / row marker, or fall back
  // to the surface root we mounted.
  let cur: Element | null = el
  while (cur && cur !== root) {
    if (
      cur.tagName === 'TR' ||
      cur.getAttribute('data-testid') === 'live-price-card' ||
      cur.getAttribute('data-row') === 'true'
    ) {
      return cur
    }
    cur = cur.parentElement
  }
  return root
}

describe('Lane 4 — global price-source-badge invariant', () => {
  for (const surface of surfaces) {
    it(`${surface.name}: every price element has a sibling source badge`, () => {
      const { container } = render(<TestWrapper>{surface.render()}</TestWrapper>)
      const root = container

      const priceEls = [
        ...root.querySelectorAll('[data-testid="live-price"]'),
        ...root.querySelectorAll('[data-testid="price-cell"]'),
      ] as Element[]

      expect(priceEls.length, `${surface.name}: expected at least one price element`).toBeGreaterThan(0)

      for (const priceEl of priceEls) {
        const container = nearestContainer(priceEl, root)
        const badge = container.querySelector('[data-testid="price-source-badge"]')
        expect(
          badge,
          `${surface.name}: price element rendered without a price-source-badge in its container.\n` +
            `priceEl.outerHTML = ${priceEl.outerHTML.slice(0, 200)}…`,
        ).not.toBeNull()
      }
    })
  }

  it('Cross-page BTC tile renders the same dollar number on Perps and Activity strips', () => {
    // Same fixtures as the suite above:
    //   on-chain BTC pair markPrice = $60,000 (mocked at the top of the file)
    //   CoinGecko WBTC quote     = $60,000 (mocked above)
    // With the shared `useAttributedPrice` hook, Activity's "WBTC" tile
    // resolves to the chain BTC reading — same as the Perps strip — so the
    // formatted dollar string MUST appear at least twice on the combined
    // render.
    const { container } = render(
      <TestWrapper>
        <>
          <PerpsPriceStrip activeSymbol="BTC-USD" />
          <ActivityPriceStrip />
        </>
      </TestWrapper>,
    )

    const priceEls = container.querySelectorAll('[data-testid="live-price"]')
    const btcTexts: string[] = []
    for (const el of Array.from(priceEls)) {
      const card = el.closest('[data-testid="live-price-card"]')
      if (!card) continue
      const symbolText = card.querySelector('span')?.textContent ?? ''
      if (symbolText === 'BTC-USD' || symbolText === 'WBTC' || symbolText === 'BTC') {
        btcTexts.push((el.textContent ?? '').trim())
      }
    }

    expect(btcTexts.length, 'expected at least a Perps BTC tile and an Activity WBTC tile').toBeGreaterThanOrEqual(2)
    const unique = new Set(btcTexts)
    expect(
      unique.size,
      `BTC tiles disagree across pages — saw: ${[...unique].join(' | ')}`,
    ).toBe(1)
  })

  it('Perps + Activity agree on BTC/ETH when RPC is down and CoinGecko is live (task 0033)', async () => {
    vi.resetModules()
    vi.doMock('@/lib/useOnChainPerps', () => ({
      useOnChainPairs: () => ({
        pairs: [
          { marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD', markPrice: 84_250, indexPrice: 84_250, change24h: 2.4, volume24h: 0, fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100, high24h: 0, low24h: 0, isFallback: true },
          { marketId: 1, symbol: 'ETH-USD', baseAsset: 'ETH', quoteAsset: 'USD', markPrice: 1_820, indexPrice: 1_820, change24h: -1.2, volume24h: 0, fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 50, high24h: 0, low24h: 0, isFallback: true },
        ],
        isLoading: false, isLive: false,
      }),
      useOnChainPositions: () => ({ positions: [], isLoading: false }),
      useOnChainAccountSummary: () => ({ summary: { balance: 0, equity: 0, unrealizedPnl: 0, marginUsed: 0, availableMargin: 0, marginRatio: 0 }, isLoading: false }),
    }))

    const { PerpsPriceStrip: FreshPerpsPriceStrip } = await import('@/components/PerpsPriceStrip')
    const { ActivityPriceStrip: FreshActivityPriceStrip } = await import('@/components/ActivityPriceStrip')

    const { container } = render(
      <TestWrapper>
        <>
          <FreshPerpsPriceStrip activeSymbol="BTC-USD" />
          <FreshActivityPriceStrip />
        </>
      </TestWrapper>,
    )

    const cards = Array.from(container.querySelectorAll('[data-testid="live-price-card"]'))
    const ethTexts: string[] = []
    for (const card of cards) {
      const symbol = card.querySelector('span')?.textContent ?? ''
      if (symbol !== 'ETH-USD' && symbol !== 'ETH' && symbol !== 'WETH') continue
      const priceEl = card.querySelector('[data-testid="live-price"]')
      const priceText = (priceEl?.textContent ?? '').trim()
      if (priceText) ethTexts.push(priceText)
    }

    expect(ethTexts.length, 'expected ETH tile on Perps + Activity').toBeGreaterThanOrEqual(2)
    expect(
      new Set(ethTexts).size,
      `ETH tiles disagree across pages — saw: ${ethTexts.join(' | ')}`,
    ).toBe(1)

    // Both must read CoinGecko ($3000 fixture) and carry "Cached (CoinGecko)",
    // not the FALLBACK_PAIRS $1,820 dressed up as "Chain oracle".
    for (const text of ethTexts) {
      expect(text).toContain('$3,000')
      expect(text).not.toContain('$1,820')
    }
    const cgBadges = container.querySelectorAll('[data-testid="price-source-badge"]')
    const cgLabels = Array.from(cgBadges).map(b => b.textContent ?? '')
    const cgCount = cgLabels.filter(l => l.includes('Cached')).length
    expect(cgCount).toBeGreaterThanOrEqual(2)
  })

  it('Stocks page: every per-row price has a sibling source badge', async () => {
    vi.doMock('@/lib/useOnChainStocks', () => ({
      useOnChainStocks: () => ({
        stocks: [
          {
            ticker: 'AAPL', name: 'Apple', sector: 'Technology', description: 'apple',
            price: 220, change24h: 1.0, volume24h: 1_000_000, marketCap: 3e12,
            high52w: 260, low52w: 150, sparkline7d: [210, 215, 220],
            peRatio: 30, eps: 6, dividendYield: 0.4, avgVolume: 1_000_000,
          },
        ],
        isLoading: false, isLive: true,
      }),
    }))
    vi.doMock('@/lib/useStocksRebalanceStatus', () => ({
      useStocksRebalanceStatus: () => ({
        data: [], isLoading: false, error: null, bySymbol: {},
      }),
    }))
    vi.doMock('@/lib/useStockWatchlist', () => ({
      useStockWatchlist: () => ({
        favorites: new Set(), toggleFavorite: vi.fn(), isFavorite: () => false,
      }),
    }))
    const { default: StocksPage } = await import('@/app/(app)/stocks/page')
    const { container } = render(<TestWrapper><StocksPage /></TestWrapper>)

    const priceEls = container.querySelectorAll('[data-testid="price-cell"]')
    expect(priceEls.length).toBeGreaterThan(0)

    for (const el of Array.from(priceEls)) {
      const row = el.closest('tr') ?? el.closest('div')
      expect(row, 'price-cell must have a row/card ancestor').not.toBeNull()
      const badge = row!.querySelector('[data-testid="price-source-badge"]')
      expect(badge, 'stocks row must have a sibling price-source-badge').not.toBeNull()
    }
  })
})
