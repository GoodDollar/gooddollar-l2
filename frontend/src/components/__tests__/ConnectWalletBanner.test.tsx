import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock wagmi's useAccount so we can drive each connection state from tests.
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

// ConnectButton.Custom is a render-prop. In tests we don't have a
// RainbowKitProvider mounted, so we stub it as a passthrough that yields
// stub modal-openers — matching the pattern already used in
// frontend/src/app/(app)/predict/__tests__/market-detail.test.tsx.
const openConnectModal = vi.fn()
const openChainModal = vi.fn()
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode }) =>
      children({ openConnectModal, openChainModal }),
  },
}))

import { useAccount } from 'wagmi'
import { ConnectWalletBanner } from '../ConnectWalletBanner'

describe('ConnectWalletBanner', () => {
  beforeEach(() => {
    vi.mocked(useAccount).mockReset()
    openConnectModal.mockReset()
    openChainModal.mockReset()
  })

  it('shows the green Connect Wallet CTA when the user is disconnected', () => {
    vi.mocked(useAccount).mockReturnValue({
      isConnected: false,
      chainId: undefined,
    } as ReturnType<typeof useAccount>)

    render(<ConnectWalletBanner />)

    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /connect wallet/i }),
    ).toBeInTheDocument()
    // The disconnected variant must not advertise a network switch.
    expect(
      screen.queryByText(/switch to the good chain devnet/i),
    ).not.toBeInTheDocument()
  })

  it('shows the amber Switch Network CTA when connected to the wrong chain', () => {
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      chainId: 1, // Ethereum mainnet ≠ devnet 42069
    } as ReturnType<typeof useAccount>)

    render(<ConnectWalletBanner />)

    expect(
      screen.getByText(/switch to the good chain devnet/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /switch network/i }),
    ).toBeInTheDocument()
    // Must not also show the disconnected heading.
    expect(screen.queryByText(/^connect your wallet$/i)).not.toBeInTheDocument()
  })

  it('renders nothing when connected to the Good Chain devnet (42069)', () => {
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      chainId: 42069,
    } as ReturnType<typeof useAccount>)

    const { container } = render(<ConnectWalletBanner />)

    expect(container.firstChild).toBeNull()
  })

  it('clicking the CTA opens the connect modal when disconnected', async () => {
    vi.mocked(useAccount).mockReturnValue({
      isConnected: false,
      chainId: undefined,
    } as ReturnType<typeof useAccount>)

    render(<ConnectWalletBanner />)

    const btn = screen.getByRole('button', { name: /connect wallet/i })
    btn.click()

    expect(openConnectModal).toHaveBeenCalledTimes(1)
    expect(openChainModal).not.toHaveBeenCalled()
  })

  it('clicking the CTA opens the chain modal when on the wrong network', async () => {
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      chainId: 1,
    } as ReturnType<typeof useAccount>)

    render(<ConnectWalletBanner />)

    const btn = screen.getByRole('button', { name: /switch network/i })
    btn.click()

    expect(openChainModal).toHaveBeenCalledTimes(1)
    expect(openConnectModal).not.toHaveBeenCalled()
  })

  it('treats hydration state (chainId undefined) as disconnected, not wrong chain', () => {
    // While wagmi is hydrating, isConnected is false and chainId may be
    // undefined. We must show the friendly green prompt — never the amber
    // warning — to avoid a brief mis-flash on first paint.
    vi.mocked(useAccount).mockReturnValue({
      isConnected: false,
      chainId: undefined,
    } as ReturnType<typeof useAccount>)

    render(<ConnectWalletBanner />)

    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/switch to the good chain devnet/i),
    ).not.toBeInTheDocument()
  })
})
