/**
 * Task 0044 — cross-page BTC parity smoke.
 *
 * A power user opening /perps and /explore in two tabs MUST see the
 * same dollar value for BTC. Before task 0044 the perps strip read
 * BTC-USD from the chain mark and /explore read WBTC from CoinGecko,
 * producing a silent ~10 % disagreement with no badge on either side.
 *
 * This test mounts both `<PerpsPriceStrip>` and a slimmed-down
 * `<ExplorePage>` with shared upstream feed mocks and asserts:
 *
 *   1. When the chain oracle has a BTC mark, both surfaces display the
 *      same number (chain wins) and both rows carry a `chain-oracle`
 *      `PriceSourceBadge`.
 *   2. When the chain BTC mark disagrees with CoinGecko's WBTC by more
 *      than 0.5 %, BOTH surfaces render a `price-divergence-chip`.
 *   3. When the chain is offline and only CoinGecko has a value, both
 *      surfaces fall back to `coingecko` with the same number, and the
 *      chip is hidden.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

vi.mock('@/components/TokenIcon', () => ({
  TokenIcon: ({ symbol }: { symbol: string }) => <span data-testid={`icon-${symbol}`}>{symbol}</span>,
}))

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceFeeds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceFeeds')>('@/lib/usePriceFeeds')
  return { ...actual, usePriceFeeds: vi.fn() }
})

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn().mockReturnValue({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

vi.mock('@/lib/usePerpsPriceSources', () => ({
  usePerpsPriceSources: () => ({
    sources: {} as Record<string, string>,
    buildEntries: () => [],
  }),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useReadContract: vi.fn(() => ({ data: undefined, isLoading: false })),
    useReadContracts: vi.fn(() => ({ data: undefined, isLoading: false })),
  }
})

import { PerpsPriceStrip } from '@/components/PerpsPriceStrip'
import ExplorePage from '@/app/(app)/explore/page'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceFeeds, FALLBACK_PRICES } from '@/lib/usePriceFeeds'
import type { PerpPair } from '@/lib/perpsData'

function pair(over: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 0, indexPrice: 0, change24h: 0, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 10,
    ...over,
  }
}

function mockFeeds(over: {
  prices?: Record<string, number>
  sources?: Record<string, 'coingecko' | 'fallback'>
  isLive?: boolean
}) {
  vi.mocked(usePriceFeeds).mockReturnValue({
    prices: { ...FALLBACK_PRICES, ...(over.prices ?? {}) },
    sources: over.sources ?? {},
    quotes: {},
    isLive: over.isLive ?? true,
    lastUpdated: new Date(),
    error: null,
    unknownSymbols: [],
  })
}

function findWbtcRow(): HTMLTableRowElement {
  for (const icon of screen.getAllByTestId('icon-WBTC')) {
    const row = icon.closest('tr')
    if (row && row.closest('table')) return row as HTMLTableRowElement
  }
  throw new Error('no WBTC table row found')
}

describe('Cross-page BTC parity (task 0044)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strip BTC-USD card matches explore WBTC row when both resolve to chain-oracle', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 }),
        pair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500 }),
      ],
      isLoading: false, isLive: true,
    })
    // Both feeds agree → no divergence chip on either surface.
    mockFeeds({ prices: { WBTC: 84_250, ETH: 3500 }, sources: { WBTC: 'coingecko', ETH: 'coingecko' } })

    render(<TestWrapper><PerpsPriceStrip activeSymbol="BTC-USD" /></TestWrapper>)
    render(<TestWrapper><ExplorePage /></TestWrapper>)

    // Both surfaces show $84,250 (the strip uses 2 fraction digits, the
    // explore row drops to 0 — but the magnitude is identical). Each
    // surface attributes the price to `chain-oracle`.
    const stripBtcCard = screen.getAllByTestId('live-price-card').find(c => c.textContent?.includes('BTC-USD'))
    expect(stripBtcCard).toBeDefined()
    expect(stripBtcCard!.textContent).toMatch(/\$84,250(\.00)?\b/)
    expect(
      stripBtcCard!.querySelector('[data-testid="price-source-badge"]')!.getAttribute('data-source'),
    ).toBe('chain-oracle')

    const wbtcRow = findWbtcRow()
    expect(wbtcRow.textContent).toMatch(/\$84,250(\.00)?\b/)
    expect(
      wbtcRow.querySelector('[data-testid="price-source-badge"]')!.getAttribute('data-source'),
    ).toBe('chain-oracle')

    // No divergence chip on either side when feeds agree.
    expect(stripBtcCard!.querySelector('[data-testid="price-divergence-chip"]')).toBeNull()
    expect(wbtcRow.querySelector('[data-testid="price-divergence-chip"]')).toBeNull()
  })

  it('surfaces a divergence chip on BOTH surfaces when chain & CoinGecko disagree', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        pair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250 }),
        pair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500 }),
      ],
      isLoading: false, isLive: true,
    })
    // PRD screenshot — chain $84,250 vs CoinGecko $76,531 (~10 %).
    mockFeeds({ prices: { WBTC: 76_531, ETH: 3500 }, sources: { WBTC: 'coingecko', ETH: 'coingecko' } })

    render(<TestWrapper><PerpsPriceStrip activeSymbol="BTC-USD" /></TestWrapper>)
    render(<TestWrapper><ExplorePage /></TestWrapper>)

    const stripBtcCard = screen.getAllByTestId('live-price-card').find(c => c.textContent?.includes('BTC-USD'))!
    const wbtcRow = findWbtcRow()

    expect(stripBtcCard.querySelector('[data-testid="price-divergence-chip"]')).not.toBeNull()
    expect(wbtcRow.querySelector('[data-testid="price-divergence-chip"]')).not.toBeNull()
    // Chain wins on both — the price magnitude is identical even though
    // the strip and the table format with different precision.
    expect(stripBtcCard.textContent).toMatch(/\$84,250(\.00)?/)
    expect(wbtcRow.textContent).toMatch(/\$84,250(\.00)?/)
  })

  it('both surfaces fall back to coingecko when the chain RPC is offline', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })
    mockFeeds({
      prices: { WBTC: 75_500, ETH: 3450 },
      sources: { WBTC: 'coingecko', ETH: 'coingecko' },
    })

    render(<TestWrapper><PerpsPriceStrip activeSymbol="BTC-USD" /></TestWrapper>)
    render(<TestWrapper><ExplorePage /></TestWrapper>)

    const stripBtcCard = screen.getAllByTestId('live-price-card').find(c => c.textContent?.includes('BTC-USD'))!
    const wbtcRow = findWbtcRow()

    expect(stripBtcCard.textContent).toMatch(/\$75,500(\.00)?\b/)
    expect(wbtcRow.textContent).toMatch(/\$75,500(\.00)?\b/)
    expect(
      stripBtcCard.querySelector('[data-testid="price-source-badge"]')!.getAttribute('data-source'),
    ).toBe('coingecko')
    expect(
      wbtcRow.querySelector('[data-testid="price-source-badge"]')!.getAttribute('data-source'),
    ).toBe('coingecko')
    // No divergence chip when only one feed has a value.
    expect(stripBtcCard.querySelector('[data-testid="price-divergence-chip"]')).toBeNull()
    expect(wbtcRow.querySelector('[data-testid="price-divergence-chip"]')).toBeNull()
  })
})
