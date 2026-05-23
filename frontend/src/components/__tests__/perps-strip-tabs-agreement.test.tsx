/**
 * Task 0036 — `/perps` top strip card and the Active pair info-bar Mark cell
 * MUST agree on one BTC-USD price (or both empty-state honestly) so the user
 * never sees `$0.000000 · Unknown · No data` stacked next to `$84,250.00 ·
 * Fallback price` on the same viewport.
 *
 * These tests pin the contract at three corners of the resolver state space:
 *
 *   1. All sources dead (chain dead, CG dead, no fallback) →
 *      strip card renders em-dash + "Feed pending" badge, MUST NOT render
 *      `$0.000000`.
 *   2. Chain in fallback mode + CG dead but `FALLBACK_PAIRS.markPrice` is set →
 *      strip card renders the same dollar string as the Mark cell, both
 *      carrying the "Fallback price" badge.
 *   3. ETH headline still passes in the chain-live case (regression guard).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn().mockReturnValue({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

// `FALLBACK_PRICES` is intentionally absent of any BTC/WBTC entry so the
// "all sources dead" case below truly leaves BTC unknown. ETH keeps its
// static fallback so ETH-only tests can still exercise the fallback path.
vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn().mockReturnValue({
    prices: {}, sources: {}, quotes: {}, isLive: true,
    lastUpdated: new Date(), error: null, unknownSymbols: [],
  }),
  FALLBACK_PRICES: { ETH: 3012.45, USDC: 1 },
}))

import { PerpsPriceStrip } from '@/components/PerpsPriceStrip'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import type { PerpPair } from '@/lib/perpsData'

function p(over: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 84_250, indexPrice: 84_250, change24h: 0, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100,
    ...over,
  }
}

function mockFeeds(over: {
  prices?: Record<string, number>
  sources?: Record<string, 'coingecko' | 'fallback'>
  quotes?: Record<string, { price: number; change24h: number; volume24h: number; marketCap: number }>
} = {}): void {
  vi.mocked(usePriceFeeds).mockReturnValue({
    prices: over.prices ?? {},
    sources: over.sources ?? {},
    quotes: over.quotes ?? {},
    isLive: true,
    lastUpdated: new Date(),
    error: null,
    unknownSymbols: [],
  })
}

function btcCardText(): string {
  const cards = Array.from(document.querySelectorAll('[data-testid="live-price-card"]'))
  const card = cards.find(c => (c.querySelector('span')?.textContent ?? '') === 'BTC-USD')
  return card?.textContent ?? ''
}

function btcPriceText(): string {
  const cards = Array.from(document.querySelectorAll('[data-testid="live-price-card"]'))
  const card = cards.find(c => (c.querySelector('span')?.textContent ?? '') === 'BTC-USD')
  return card?.querySelector('[data-testid="live-price"]')?.textContent?.trim() ?? ''
}

describe('PerpsPriceStrip — BTC card never shows $0.000000 (task 0036)', () => {
  beforeEach(() => {
    mockFeeds()
  })

  it('renders em-dash + "Feed pending" when chain is fallback, CG is dead, and no static fallback exists', () => {
    // Construct a state where every source is dead and FALLBACK_PRICES has
    // no equivalent for the asset, so the resolver lands on `'unknown'`.
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'XYZ-USD', baseAsset: 'XYZ', markPrice: 1, isFallback: false }),
      ],
      isLoading: false, isLive: false,
    })

    render(<PerpsPriceStrip activeSymbol="XYZ-USD" />)

    const text = btcCardText()
    // BTC card always renders (it's an always-on headline).
    expect(text).toContain('BTC-USD')
    // No `$0.000000` and no `$0.00` "Unknown" combo.
    expect(text).not.toMatch(/\$0\.0+/)
    // Em-dash for the missing price.
    expect(btcPriceText()).toContain('—')
    // Badge text contains "Feed pending" (case-insensitive).
    expect(text.toLowerCase()).toContain('feed pending')
  })

  it('strip card price matches active-pair info-bar Mark when FALLBACK_PAIRS is the source', () => {
    // Chain is in fallback mode (RPC 502), CG is dead. The strip card must
    // render the chain-pair fallback markPrice ($84,250) and the same badge
    // ("Fallback price") as the Active pair info bar Mark cell.
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250, isFallback: true }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 1_820, marketId: 1, isFallback: true }),
      ],
      isLoading: false, isLive: false,
    })

    render(<PerpsPriceStrip activeSymbol="BTC-USD" />)

    const text = btcCardText()
    // Strip card price = chain-pair fallback markPrice ($84,250).
    expect(btcPriceText()).toBe('$84,250.00')
    expect(text).not.toMatch(/\$0\.0+/)
    // Badge text says "Fallback price".
    expect(text).toContain('Fallback price')
  })

  it('regression guard — ETH-USD headline still renders the CoinGecko price when chain is in fallback', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250, isFallback: true }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 1_820, marketId: 1, isFallback: true }),
      ],
      isLoading: false, isLive: false,
    })
    mockFeeds({
      prices: { ETH: 2_069, WETH: 2_069 },
      sources: { ETH: 'coingecko', WETH: 'coingecko' },
      quotes: {
        ETH: { price: 2_069, change24h: -0.9, volume24h: 0, marketCap: 0 },
        WETH: { price: 2_069, change24h: -0.9, volume24h: 0, marketCap: 0 },
      },
    })

    render(<PerpsPriceStrip activeSymbol="BTC-USD" />)

    // ETH-USD card prefers CoinGecko (live) over the chain-pair fallback.
    const ethCard = Array.from(document.querySelectorAll('[data-testid="live-price-card"]'))
      .find(c => (c.querySelector('span')?.textContent ?? '') === 'ETH-USD')
    expect(ethCard?.textContent ?? '').toContain('$2,069')
    expect(ethCard?.textContent ?? '').not.toContain('$1,820')
    expect(screen.getAllByText('Cached (CoinGecko)').length).toBeGreaterThanOrEqual(1)
  })
})
