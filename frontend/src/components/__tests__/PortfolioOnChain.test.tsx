import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Wagmi mocks ──────────────────────────────────────────────────────────────

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  // The component no longer calls these directly, but `usePortfolioReads`
  // (which we mock below) and other lib code may pull them in transitively.
  useReadContract: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useReadContracts: vi.fn().mockReturnValue({ data: undefined, isLoading: false, isError: false }),
}))

// Stub the batched reads hook so the test does not exercise wagmi internals.
vi.mock('@/lib/usePortfolioReads', () => ({
  usePortfolioReads: vi.fn().mockReturnValue({
    gdBalance: 0,
    gusdBalance: 0,
    lend: null,
    ethVault: null,
    gdVault: null,
    usdcVault: null,
    isLoading: false,
    isError: false,
  }),
}))

// usePriceFeeds is a thin wrapper around the singleton CoinGecko cache.
vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn().mockReturnValue({
    prices: { WETH: 0, 'G$': 0, USDC: 0 },
    isLoading: false,
  }),
  getPrice: (prices: Record<string, number>, sym: string) => prices[sym] ?? 0,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { useAccount } from 'wagmi'
import { PortfolioOnChain } from '../PortfolioOnChain'

// allowlist: placeholder mock wallet for unit tests (sequential digits, not a real address)
const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`

describe('PortfolioOnChain', () => {
  beforeEach(() => {
    vi.mocked(useAccount).mockReset()
  })

  it('renders nothing when wallet not connected', () => {
    vi.mocked(useAccount).mockReturnValue({ address: undefined, chainId: undefined } as ReturnType<typeof useAccount>)
    const { container } = render(<PortfolioOnChain />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when connected to wrong chain', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 1 } as ReturnType<typeof useAccount>)
    const { container } = render(<PortfolioOnChain />)
    expect(container.firstChild).toBeNull()
  })

  it('renders on-chain section when connected to chain 42069', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    expect(screen.getByText('On-Chain Positions')).toBeInTheDocument()
  })

  it('shows devnet chain ID label when connected', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    expect(screen.getByText(/devnet chain 42069/)).toBeInTheDocument()
  })

  it('shows G$ Balance label', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    expect(screen.getByText('G$ Balance')).toBeInTheDocument()
  })

  it('shows gUSD Balance label', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    expect(screen.getByText('gUSD Balance')).toBeInTheDocument()
  })

  it('shows GoodLend section', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    expect(screen.getByText('GoodLend')).toBeInTheDocument()
  })

  it('shows GoodStable section', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    expect(screen.getByText('GoodStable')).toBeInTheDocument()
  })

  it('shows manage links for GoodLend and GoodStable', () => {
    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chainId: 42069 } as ReturnType<typeof useAccount>)
    render(<PortfolioOnChain />)
    const manageLinks = screen.getAllByRole('link', { name: /Manage/i })
    expect(manageLinks.length).toBeGreaterThanOrEqual(2)
  })
})
