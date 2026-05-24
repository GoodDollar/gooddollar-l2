/**
 * StocksStatusPanel.walletconnect.test.tsx — Tests for wallet connect chip functionality
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: vi.fn(),
}))

vi.mock('@/lib/walletConnectConfig', () => ({
  isWalletConnectConfigured: false, // Set to false for this test
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
import { StocksStatusPanel } from '../StocksStatusPanel'

describe('StocksStatusPanel wallet connect behavior', () => {
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

  it('shows wallet connect chip when not configured', () => {
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

    expect(screen.getByTestId('stocks-status-wc-chip')).toBeInTheDocument()
    expect(screen.getByText('Wallet connect: injected only')).toBeInTheDocument()
  })
})