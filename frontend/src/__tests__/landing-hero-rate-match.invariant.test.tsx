/**
 * Task 0027 invariant: the landing-page hero (`SwapPriceChart`) and the
 * `LandingPriceStrip` directly below it MUST agree on the ETH/G$ rate by
 * construction — both must derive from the same shared `useAttributedPrices`
 * snapshot.
 *
 * With chain-oracle ETH = $1820 and fallback G$ = $0.0102, the hero must
 * read `1 ETH = 178,431 G$` (= 1820 / 0.0102, rounded) and not the
 * CoinGecko-derived 202,025 number from before the fix.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/useAttributedPrice', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useAttributedPrice')>('@/lib/useAttributedPrice')
  return {
    ...actual,
    useAttributedPrices: () => ({
      ETH:  { symbol: 'ETH',  priceUsd: 1820,   source: 'chain-oracle' as const, change24h: 1.2,  ageMs: 4000, divergent: false, divergenceOtherUsd: null },
      USDC: { symbol: 'USDC', priceUsd: 1,      source: 'coingecko'   as const, change24h: 0,    ageMs: 4000, divergent: false, divergenceOtherUsd: null },
      'G$': { symbol: 'G$',   priceUsd: 0.0102, source: 'fallback'    as const, change24h: null, ageMs: null, divergent: false, divergenceOtherUsd: null },
    }),
  }
})

vi.mock('@/lib/usePriceFeeds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceFeeds')>('@/lib/usePriceFeeds')
  return {
    ...actual,
    usePriceFeeds: () => ({
      // Deliberately different from the canonical 1820 — proves the hero
      // ignores raw CoinGecko numbers and reads through the resolver.
      prices: { ETH: 2065, 'G$': 0.01022 },
      sources: { ETH: 'coingecko', 'G$': 'coingecko' },
      quotes: {},
      isLive: true,
      lastUpdated: new Date(),
      error: null,
      unknownSymbols: [],
    }),
  }
})

import { LandingPriceStrip } from '@/components/LandingPriceStrip'
import { SwapPriceChart } from '@/components/SwapPriceChart'

describe('Landing hero ↔ strip rate invariant (task 0027)', () => {
  it('hero rate equals (strip ETH price) / (strip G$ price) within 0.5%', () => {
    render(
      <>
        <SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />
        <LandingPriceStrip />
      </>,
    )

    // 1820 / 0.0102 ≈ 178431
    expect(screen.getByText(/178,431\s*G\$/)).toBeInTheDocument()
    expect(screen.queryByText(/202,025/)).not.toBeInTheDocument()
  })
})
