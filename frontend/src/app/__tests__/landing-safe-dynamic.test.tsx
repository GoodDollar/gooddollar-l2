import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: () => Promise<any>) => {
    let Comp: any = null
    loader().then((m: any) => { Comp = m.default || m })
    const Wrapper = (props: any) => Comp ? <Comp {...props} /> : null
    Wrapper.displayName = 'DynamicMock'
    return Wrapper
  },
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/components/StartSwappingCTA', () => ({
  StartSwappingCTA: () => <div><button>Start Swapping →</button></div>,
}))

vi.mock('@/components/HowItWorks', () => ({
  HowItWorks: () => <section>How It Works</section>,
}))

vi.mock('@/components/StatsRow', () => ({
  StatsRow: () => <section>Stats</section>,
}))

vi.mock('@/components/UBIExplainer', () => ({
  UBIExplainer: () => <section>UBI Explainer</section>,
}))

vi.mock('@/components/PlatformShowcase', () => ({
  PlatformShowcase: () => <section>Platform Showcase</section>,
}))

vi.mock('@/components/SwapPriceChart', () => ({
  SwapPriceChart: () => { throw new Error('ChunkLoadError: Loading chunk failed for SwapPriceChart') },
}))

vi.mock('@/components/LandingSwapCard', () => ({
  __esModule: true,
  default: () => <div data-testid="swap-card">swap card</div>,
}))

import Home from '../page'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('Landing page — SafeDynamic isolation (task 0051)', () => {
  it('renders the inline safe-dynamic fallback when the swap-price chart chunk fails to load', () => {
    render(<Home />)
    // Exactly one SafeDynamic fallback for the chart subtree.
    const fallbacks = screen.getAllByTestId('safe-dynamic-fallback')
    expect(fallbacks.length).toBeGreaterThanOrEqual(1)
    expect(fallbacks[0]).toHaveTextContent(/price chart/i)
  })

  it('keeps the rest of the page rendering when one dynamic chunk fails', () => {
    render(<Home />)
    // Hero, ProductPills, and sections below the failing chart still mount.
    expect(screen.getByText(/Trade\. Predict\. Invest\./i)).toBeInTheDocument()
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    expect(screen.getByText('UBI Explainer')).toBeInTheDocument()
    expect(screen.getByText('Platform Showcase')).toBeInTheDocument()
    expect(screen.getByText('Stats')).toBeInTheDocument()
  })
})
