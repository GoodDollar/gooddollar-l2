import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AddNetworkButton } from '../AddNetworkButton'
import {
  DEVNET_CHAIN_ID,
  DEVNET_RPC_URL,
  DEVNET_EXPLORER_URL,
} from '@/lib/devnet'

type EthereumRequest = (args: {
  method: string
  params?: unknown[]
}) => Promise<unknown>

interface MockEthereum {
  request: ReturnType<typeof vi.fn<EthereumRequest>>
}

declare global {
  // eslint-disable-next-line no-var
  var ethereum: MockEthereum | undefined
}

function installMockEthereum(impl: EthereumRequest): MockEthereum {
  const mock = { request: vi.fn(impl) } as MockEthereum
  Object.defineProperty(window, 'ethereum', {
    value: mock,
    writable: true,
    configurable: true,
  })
  return mock
}

function uninstallMockEthereum() {
  Object.defineProperty(window, 'ethereum', {
    value: undefined,
    writable: true,
    configurable: true,
  })
}

describe('AddNetworkButton', () => {
  beforeEach(() => {
    uninstallMockEthereum()
  })

  afterEach(() => {
    uninstallMockEthereum()
  })

  it('renders the idle CTA with the canonical button label', () => {
    installMockEthereum(async () => null)
    render(<AddNetworkButton />)
    expect(
      screen.getByRole('button', { name: /add goodchain testnet to wallet/i }),
    ).toBeInTheDocument()
  })

  it('renders a compact label when variant="compact"', () => {
    installMockEthereum(async () => null)
    render(<AddNetworkButton variant="compact" />)
    expect(
      screen.getByRole('button', { name: /add goodchain testnet/i }),
    ).toBeInTheDocument()
  })

  it('on click, calls wallet_addEthereumChain with the canonical EIP-3085 payload', async () => {
    const mock = installMockEthereum(async () => null)
    render(<AddNetworkButton />)
    fireEvent.click(
      screen.getByRole('button', { name: /add goodchain testnet to wallet/i }),
    )

    await waitFor(() => expect(mock.request).toHaveBeenCalledTimes(1))

    const [args] = mock.request.mock.calls[0]
    expect(args.method).toBe('wallet_addEthereumChain')
    expect(Array.isArray(args.params)).toBe(true)
    const [param] = args.params as Array<Record<string, unknown>>
    // Chain id MUST be hex-encoded per EIP-3085.
    expect(param.chainId).toBe(`0x${DEVNET_CHAIN_ID.toString(16)}`)
    expect(param.chainName).toBe('GoodChain Testnet')
    expect(param.rpcUrls).toEqual([DEVNET_RPC_URL])
    expect(param.blockExplorerUrls).toEqual([DEVNET_EXPLORER_URL])
    expect(param.nativeCurrency).toEqual({
      name: 'GoodDollar',
      symbol: 'G$',
      decimals: 18,
    })
  })

  it('hex-encodes the chain id correctly (e.g. 42069 → 0xa455)', () => {
    // Defensive sanity check — production must NOT regress to decimal encoding.
    expect(DEVNET_CHAIN_ID.toString(16)).toBe('a455')
    expect(`0x${DEVNET_CHAIN_ID.toString(16)}`).toBe('0xa455')
  })

  it('shows the no-wallet state when window.ethereum is undefined', () => {
    uninstallMockEthereum()
    render(<AddNetworkButton />)
    // The CTA is replaced with a disabled hint and an install link.
    expect(
      screen.getByText(/no evm wallet detected/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /install metamask/i }),
    ).toBeInTheDocument()
  })

  it('shows the success state after the wallet resolves the request', async () => {
    installMockEthereum(async () => null)
    render(<AddNetworkButton />)
    fireEvent.click(
      screen.getByRole('button', { name: /add goodchain testnet to wallet/i }),
    )
    await waitFor(() => {
      expect(screen.getByText(/goodchain testnet added/i)).toBeInTheDocument()
    })
  })

  it('shows the rejected state when the user denies the request (4001)', async () => {
    installMockEthereum(async () => {
      const err = new Error('User rejected the request.') as Error & {
        code?: number
      }
      err.code = 4001
      throw err
    })
    render(<AddNetworkButton />)
    fireEvent.click(
      screen.getByRole('button', { name: /add goodchain testnet to wallet/i }),
    )
    await waitFor(() => {
      expect(screen.getByText(/declined the request/i)).toBeInTheDocument()
    })
  })

  it('shows the error state for any other thrown error', async () => {
    installMockEthereum(async () => {
      throw new Error('Internal wallet error')
    })
    render(<AddNetworkButton />)
    fireEvent.click(
      screen.getByRole('button', { name: /add goodchain testnet to wallet/i }),
    )
    await waitFor(() => {
      expect(screen.getByText(/could not add the network/i)).toBeInTheDocument()
    })
  })
})
