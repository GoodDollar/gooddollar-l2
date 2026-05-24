/**
 * StocksStatusPanel.test.tsx — Tests for the consolidated stocks status panel
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'
import { StocksStatusPanel } from '../StocksStatusPanel'

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: vi.fn(),
}))

vi.mock('@/lib/walletConnectConfig', () => ({
  isWalletConnectConfigured: true,
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: vi.fn(),
  }
})

import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { useAccount } from 'wagmi'

describe('StocksStatusPanel', () => {
  const mockOnCtaClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAccount).mockReturnValue({ 
      address: undefined,
      isConnecting: false,
      isReconnecting: false,
      isConnected: false,
      isDisconnected: true,
      status: 'disconnected'
    } as any)
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })
  })

  it('renders live oracle state correctly', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: true,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    expect(screen.getByText('Stocks oracle is live')).toBeInTheDocument()
    expect(screen.getByText(/Synthetic prices track the on-chain oracle/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect wallet to trade/i })).toBeInTheDocument()
  })

  it('renders demo oracle state correctly', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: false,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    expect(screen.getByText('Stocks oracle in demo mode')).toBeInTheDocument()
    expect(screen.getByText(/Synthetic prices track the last on-chain close/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /trade demo/i })).toBeInTheDocument()
  })

  it('does not show wallet connect chip when configured', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: true,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    expect(screen.queryByTestId('stocks-status-wc-chip')).not.toBeInTheDocument()
  })

  it('adapts CTA for connected wallet', () => {
    vi.mocked(useAccount).mockReturnValue({ 
      address: '0x1234567890123456789012345678901234567890',
      isConnecting: false,
      isReconnecting: false,
      isConnected: true,
      isDisconnected: false,
      status: 'connected'
    } as any)
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: true,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /view stocks/i })).toBeInTheDocument()
  })

  it('toggles explainer content', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: true,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    // Initially explainer should be open (localStorage returns null = not dismissed)
    expect(screen.getByText('Hide details')).toBeInTheDocument()
    expect(screen.getByText(/Synthetic stock tokens track real equity prices/)).toBeInTheDocument()
    
    // Click to hide explainer
    fireEvent.click(screen.getByRole('button', { name: /hide details/i }))
    
    expect(screen.getByText('How this works')).toBeInTheDocument()
    expect(screen.queryByText(/Synthetic stock tokens track real equity prices/)).not.toBeInTheDocument()
  })

  it('calls onCtaClick when CTA button is clicked', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: false,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    fireEvent.click(screen.getByRole('button', { name: /trade demo/i }))
    expect(mockOnCtaClick).toHaveBeenCalledTimes(1)
  })

  it('has correct data attributes for oracle state', () => {
    vi.mocked(useOnChainStocks).mockReturnValue({
      stocks: [],
      isLoading: false,
      isLive: false,
      refetch: vi.fn(),
    })

    render(
      <TestWrapper>
        <StocksStatusPanel onCtaClick={mockOnCtaClick} />
      </TestWrapper>
    )

    const panel = screen.getByTestId('stocks-status-panel')
    expect(panel).toHaveAttribute('data-oracle-state', 'demo')
  })
})