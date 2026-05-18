import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock wagmi so we can drive the connected-wallet branch from each test.
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

// AddNetworkButton hits window.ethereum / EIP-3085 — stub it as a noop so
// the faucet page renders without touching the injected provider.
vi.mock('@/components/AddNetworkButton', () => ({
  AddNetworkButton: () => <button type="button">Add Network</button>,
}))

import { useAccount } from 'wagmi'
import FaucetPage from '../page'

const VALID_ADDRESS = '0x1111111111111111111111111111111111111111'

function setAccount(opts: { address?: string; isConnected?: boolean } = {}) {
  vi.mocked(useAccount).mockReturnValue({
    address: opts.address,
    isConnected: opts.isConnected ?? Boolean(opts.address),
    // The rest of the useAccount surface is unused by FaucetPage.
  } as ReturnType<typeof useAccount>)
}

describe('FaucetPage — Claim Test Tokens button (0062)', () => {
  beforeEach(() => {
    vi.mocked(useAccount).mockReset()
  })

  it('renders disabled with high-contrast tokens and shows helper text when no address is provided', () => {
    setAccount()
    render(<FaucetPage />)

    const button = screen.getByRole('button', { name: /claim test tokens/i })
    expect(button).toBeDisabled()

    // New contrast classes — proves we are not relying on the old
    // `disabled:opacity-50` pattern that produced muddy disabled text.
    expect(button).toHaveClass('disabled:bg-dark-300')
    expect(button).toHaveClass('disabled:text-gray-400')
    expect(button).not.toHaveClass('disabled:opacity-50')

    // Helper text is rendered inside an aria-live region so screen readers
    // hear the prompt when the form first mounts.
    const helper = screen.getByText(/enter an address above to claim/i)
    expect(helper).toBeInTheDocument()
    const liveRegion = helper.closest('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
  })

  it('hides the helper text once the user starts typing an (invalid) address', () => {
    setAccount()
    const { container } = render(<FaucetPage />)

    expect(
      screen.getByText(/enter an address above to claim/i),
    ).toBeInTheDocument()

    const input = container.querySelector('#faucet-addr') as HTMLInputElement
    expect(input).not.toBeNull()
    fireEvent.change(input, { target: { value: '0xabc' } })

    // The "enter an address" hint disappears because effectiveAddr is now
    // non-empty; the inline "Invalid Ethereum address" error takes over.
    expect(
      screen.queryByText(/enter an address above to claim/i),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/invalid ethereum address/i)).toBeInTheDocument()
  })

  it('hides the helper text and enables the button when a valid address is typed', () => {
    setAccount()
    const { container } = render(<FaucetPage />)

    const input = container.querySelector('#faucet-addr') as HTMLInputElement
    fireEvent.change(input, { target: { value: VALID_ADDRESS } })

    const button = screen.getByRole('button', { name: /claim test tokens/i })
    expect(button).not.toBeDisabled()
    // Enabled state uses the new brand token, not the legacy `bg-accent`.
    expect(button).toHaveClass('bg-goodgreen')
    expect(button).toHaveClass('text-dark-50')

    expect(
      screen.queryByText(/enter an address above to claim/i),
    ).not.toBeInTheDocument()
  })

  it('hides the helper text when a wallet is connected, even before the user types', () => {
    setAccount({ address: VALID_ADDRESS, isConnected: true })
    render(<FaucetPage />)

    expect(
      screen.queryByText(/enter an address above to claim/i),
    ).not.toBeInTheDocument()
    // Confirms the connected-wallet code path is the one driving effectiveAddr.
    expect(screen.getByText(/using connected wallet/i)).toBeInTheDocument()
  })
})
