import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(),
}))

vi.mock('@/lib/stockData', () => ({
  getAllTickers: () => ['AAPL', 'TSLA', 'NVDA'],
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    StocksPriceOracle: '0x1111111111111111111111111111111111111111',
  },
}))

vi.mock('@/lib/abi', () => ({
  PriceOracleABI: [],
}))

import { useReadContracts } from 'wagmi'
import { OnChainOraclePanel } from '../OnChainOraclePanel'

const useReadContractsMock = vi.mocked(useReadContracts)

const VERBOSE_WAGMI_ERROR = new Error(
  [
    'HTTP request failed.',
    '',
    'URL: https://rpc.gooddollar.org',
    'Request body: {"method":"eth_call","params":[{"to":"0xa4899d35897033b927acfcf422bc7459161397ab"}]}',
    '',
    'Details: connect ECONNREFUSED 10.0.0.42:8545',
    'Version: viem@2.x.x',
  ].join('\n'),
)

const ORACLE_ADDRESS = '0x1111111111111111111111111111111111111111'

describe('OnChainOraclePanel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    useReadContractsMock.mockReset()
  })

  it('renders the outer section with the stable jump-target id', () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)
    const { container } = render(<OnChainOraclePanel />)
    expect(container.querySelector('section[id="panel-onchain-oracle"]')).not.toBeNull()
  })

  it('renders the sanitised oracle copy and leaks no wagmi internals in the error block', async () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: VERBOSE_WAGMI_ERROR,
    // The wagmi mock is intentionally loose; we only consume the three fields above.
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    await waitFor(() => {
      expect(screen.getByText(/Oracle multicall failed/i)).toBeInTheDocument()
    })

    const headline = screen.getByText(/Oracle multicall failed/i)
    const errorBlock = headline.parentElement as HTMLElement
    expect(errorBlock).not.toBeNull()

    const inside = within(errorBlock)
    expect(inside.getByText(/On-chain oracle reads are unavailable/i)).toBeInTheDocument()
    expect(inside.queryByText(/eth_call/)).not.toBeInTheDocument()
    expect(inside.queryByText(/https?:\/\//)).not.toBeInTheDocument()
    expect(inside.queryByText(/0x[a-f0-9]{40}/i)).not.toBeInTheDocument()
    expect(inside.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
    expect(inside.queryByText(/viem/)).not.toBeInTheDocument()
  })

  it('logs the underlying error to console.error with the [proof-panel] tag', async () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: VERBOSE_WAGMI_ERROR,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    await waitFor(() => {
      expect(screen.getByText(/Oracle multicall failed/i)).toBeInTheDocument()
    })

    const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls
    const tagged = calls.find((c) => c[0] === '[proof-panel]')
    expect(tagged).toBeDefined()
    expect(tagged?.[1]).toBe('oracle-multicall')
    expect(tagged?.[2]).toBe(VERBOSE_WAGMI_ERROR)
  })

  it('renders the empty-state placeholder rows on the happy path with no error', () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    expect(screen.queryByText(/Oracle multicall failed/i)).not.toBeInTheDocument()
    // Old single-sentence "no data" copy is gone, replaced by placeholders.
    expect(
      screen.queryByText(/No on-chain price data available/i),
    ).not.toBeInTheDocument()
  })

  it('renders one placeholder row per ticker when no on-chain prices are available', () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    for (const symbol of ['AAPL', 'TSLA', 'NVDA']) {
      const row = screen.getByTestId(`onchain-oracle-placeholder-${symbol}`)
      expect(row).toBeInTheDocument()
      expect(within(row).getByText(symbol)).toBeInTheDocument()
    }
  })

  it('renders the onchain-oracle-empty-banner with the expected symbol count', () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    const banner = screen.getByTestId('onchain-oracle-empty-banner')
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toMatch(/Waiting for on-chain prices/)
    expect(banner.textContent).toMatch(/3 symbols/)
    expect(banner.textContent).toMatch(/oracle-signer keeper/)
  })

  it('does not render placeholder rows or the empty banner when populated rows exist', () => {
    useReadContractsMock.mockReturnValue({
      data: [
        {
          status: 'success',
          result: {
            price8: 17_860_000_000n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            session: 0,
            confidence: 95,
            signerCount: 1,
          },
        },
        { status: 'failure', error: new Error('skip') },
        { status: 'failure', error: new Error('skip') },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    expect(screen.queryByTestId('onchain-oracle-empty-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('onchain-oracle-placeholder-AAPL')).not.toBeInTheDocument()
    expect(screen.queryByTestId('onchain-oracle-placeholder-TSLA')).not.toBeInTheDocument()
  })

  it('renders the contract address as a link to the block explorer when NEXT_PUBLIC_BLOCK_EXPLORER is set', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com')
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    const link = screen.getByTestId('oracle-address-link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(
      `https://explorer.example.com/address/${ORACLE_ADDRESS}`,
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toContain(ORACLE_ADDRESS)
    expect(screen.queryByTestId('oracle-address-text')).not.toBeInTheDocument()
  })

  it('falls back to plain text when no explorer env is set', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', '')
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER_URL', '')
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    expect(screen.queryByTestId('oracle-address-link')).not.toBeInTheDocument()
    const span = screen.getByTestId('oracle-address-text')
    expect(span.textContent).toContain(ORACLE_ADDRESS)
  })

  it('survives a trailing slash on the explorer URL', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com/')
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)

    const link = screen.getByTestId('oracle-address-link')
    expect(link.getAttribute('href')).toBe(
      `https://explorer.example.com/address/${ORACLE_ADDRESS}`,
    )
  })

  it('surfaces the full address via title attribute on either variant', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com')
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)
    expect(screen.getByTestId('oracle-address-link').getAttribute('title')).toBe(ORACLE_ADDRESS)
  })

  it('surfaces the full address via title attribute on the fallback span', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', '')
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER_URL', '')
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)

    render(<OnChainOraclePanel />)
    expect(screen.getByTestId('oracle-address-text').getAttribute('title')).toBe(ORACLE_ADDRESS)
  })
})
