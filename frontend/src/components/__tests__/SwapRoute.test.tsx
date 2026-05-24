import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SwapRoute } from '../SwapRoute'
import type { Token } from '@/lib/tokens'

const ETH: Token = { symbol: 'ETH', name: 'Ether', icon: '', decimals: 18, address: '0x0', category: 'Infrastructure' as const }
const GD:  Token = { symbol: 'G$',  name: 'GoodDollar', icon: '', decimals: 18, address: '0x1', category: 'GoodDollar' as const }
const LINK: Token = { symbol: 'LINK', name: 'Chainlink', icon: '', decimals: 18, address: '0x2', category: 'DeFi' as const }
const SNX:  Token = { symbol: 'SNX',  name: 'Synthetix', icon: '', decimals: 18, address: '0x3', category: 'DeFi' as const }

describe('SwapRoute — pool mode (on-chain GoodSwap pair)', () => {
  it('renders the green "GoodSwap Pool" pill with the chain-oracle source line', () => {
    const { container } = render(
      <SwapRoute inputToken={ETH} outputToken={GD} pairOnChain={true} rateSource="chain-oracle" />,
    )
    expect(container.querySelector('[data-route-mode="pool"]')).not.toBeNull()
    expect(screen.getByText('GoodSwap Pool')).toBeInTheDocument()

    const badge = container.querySelector('[data-testid="price-source-badge"]')
    expect(badge).not.toBeNull()
    expect(badge?.getAttribute('data-source')).toBe('chain-oracle')
  })
})

describe('SwapRoute — off-chain mode (rate sourced from CoinGecko / fallback / etoro)', () => {
  it('renders an amber "Off-chain quote" pill and the no-pool disclaimer for fallback rates', () => {
    const { container } = render(
      <SwapRoute inputToken={LINK} outputToken={SNX} pairOnChain={false} rateSource="fallback" />,
    )
    expect(container.querySelector('[data-route-mode="off-chain"]')).not.toBeNull()
    expect(screen.getByText('Off-chain quote')).toBeInTheDocument()
    expect(screen.getByText(/no GoodSwap pool exists/i)).toBeInTheDocument()
    // Crucially, the green "GoodSwap Pool" copy must NOT leak through.
    expect(screen.queryByText('GoodSwap Pool')).not.toBeInTheDocument()
  })

  it('treats CoinGecko as off-chain too', () => {
    const { container } = render(
      <SwapRoute inputToken={LINK} outputToken={SNX} pairOnChain={false} rateSource="coingecko" />,
    )
    expect(container.querySelector('[data-route-mode="off-chain"]')).not.toBeNull()
    expect(screen.getByText('Off-chain quote')).toBeInTheDocument()
  })
})

describe('SwapRoute — unavailable mode (no rate at all)', () => {
  it('renders a muted "No route available" chip when rateSource is unknown', () => {
    const { container } = render(
      <SwapRoute inputToken={LINK} outputToken={SNX} pairOnChain={false} rateSource="unknown" />,
    )
    expect(container.querySelector('[data-route-mode="unavailable"]')).not.toBeNull()
    expect(screen.getByText('No route available')).toBeInTheDocument()
    expect(screen.queryByText('GoodSwap Pool')).not.toBeInTheDocument()
    expect(screen.queryByText('Off-chain quote')).not.toBeInTheDocument()
  })

  it('treats stale and closed sources as unavailable', () => {
    const { container: stale } = render(
      <SwapRoute inputToken={LINK} outputToken={SNX} pairOnChain={false} rateSource="stale" />,
    )
    expect(stale.querySelector('[data-route-mode="unavailable"]')).not.toBeNull()

    const { container: closed } = render(
      <SwapRoute inputToken={LINK} outputToken={SNX} pairOnChain={false} rateSource="closed" />,
    )
    expect(closed.querySelector('[data-route-mode="unavailable"]')).not.toBeNull()
  })
})
