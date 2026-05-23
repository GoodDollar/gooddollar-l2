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

  it('outer section uses flex flex-col h-full so it fills its grid cell row height (#0039)', () => {
    useReadContractsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useReadContracts>)
    const { container } = render(<OnChainOraclePanel />)
    const section = container.querySelector('section[id="panel-onchain-oracle"]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/\bh-full\b/)
    expect(section.className).toMatch(/\bflex\b/)
    expect(section.className).toMatch(/\bflex-col\b/)
    const body = section.querySelector(':scope > div.flex-1')
    expect(body, 'expected a flex-1 body wrapper inside the panel').not.toBeNull()
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

  // Removed by lane6-reviewer-callout-empty-rule-contradicts-oracle-placeholder-table:
  // the rows.length === 0 path used to render 12 dash placeholder rows + a
  // "Waiting for on-chain prices" colspan banner, but that contradicted the
  // "if a panel is empty, that service is unreachable" reviewer rule on the
  // proof page. The new contract is now covered by the
  // 'awaiting-first-write empty state' describe block below: a single yellow
  // notice replaces both the banner and the per-ticker placeholder rows.

  it('colours the session pill green when getPriceData decodes session=0 (Open)', () => {
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

    const pill = screen.getByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/bg-green/)
    expect(pill.textContent).toBe('Open')
  })

  it('colours the session pill red when session=4 (Halted)', () => {
    useReadContractsMock.mockReturnValue({
      data: [
        {
          status: 'success',
          result: {
            price8: 17_860_000_000n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
            session: 4,
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

    const pill = screen.getByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/bg-red/)
    expect(pill.textContent).toBe('Halted')
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

  // Task lane6-onchain-oracle-column-headers-unexplained-jargon:
  // The centerpiece table's column shorthands ("8-dec", "Conf",
  // "Signers", "Session") must expose a plain-English explanation via
  // the `title=` attribute (mouse hover) and `aria-describedby` →
  // sr-only `<dd>` (screen reader) so a fresh non-engineer reviewer
  // can read every column.
  describe('column header help', () => {
    const EXPECTED_COLUMNS = ['symbol', 'price', 'session', 'conf', 'signers', 'updated']

    beforeEach(() => {
      // The table (and its <thead> + sr-only <dl>) only renders when
      // rows.length > 0 after lane6-reviewer-callout-empty-rule-…; the
      // empty-data branch now shows a yellow "awaiting" notice instead.
      // Mock one populated row so the header help contract is exercised
      // in its real rendering condition.
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
    })

    it('columns render in the documented order and count', () => {
      render(<OnChainOraclePanel />)
      const headers = EXPECTED_COLUMNS.map((key) =>
        screen.getByTestId(`onchain-oracle-header-${key}`),
      )
      expect(headers).toHaveLength(EXPECTED_COLUMNS.length)
      const all = document.querySelectorAll('[data-testid^="onchain-oracle-header-"]')
      expect(all.length).toBe(EXPECTED_COLUMNS.length)
      EXPECTED_COLUMNS.forEach((key, i) => {
        expect(all[i].getAttribute('data-testid')).toBe(`onchain-oracle-header-${key}`)
      })
    })

    it.each([
      ['symbol', /ticker/i],
      ['price', /8 decimals|1e8/i],
      ['session', /open/i],
      ['conf', /confidence/i],
      ['signers', /keeper keys/i],
      ['updated', /timestamp|ago/i],
    ])(
      'each column header (%s) carries a non-empty title tooltip mentioning %s',
      (key, keyword) => {
        render(<OnChainOraclePanel />)
        const th = screen.getByTestId(`onchain-oracle-header-${key}`)
        const title = th.getAttribute('title')
        expect(title).toBeTruthy()
        expect(title).toMatch(keyword)
      },
    )

    it('each column header is described by a hidden description node', () => {
      render(<OnChainOraclePanel />)
      for (const key of EXPECTED_COLUMNS) {
        const th = screen.getByTestId(`onchain-oracle-header-${key}`)
        const ariaId = th.getAttribute('aria-describedby')
        expect(ariaId).toBeTruthy()
        const desc = document.getElementById(ariaId as string)
        expect(desc).not.toBeNull()
        expect((desc as HTMLElement).textContent).toBe(th.getAttribute('title'))
      }
    })

    it('populated body rows render one cell per header', () => {
      // After lane6-reviewer-callout-empty-rule-contradicts-oracle-placeholder-table,
      // the rows.length === 0 path no longer renders a 12-row dash table — a
      // yellow "awaiting" notice takes its place. The header help describe
      // block now exercises the populated branch (see beforeEach above), so
      // this test asserts the populated row also has one <td> per header.
      render(<OnChainOraclePanel />)
      const populatedRows = document.querySelectorAll('tbody tr')
      expect(populatedRows.length).toBe(1)
      expect((populatedRows[0] as HTMLElement).querySelectorAll('td').length).toBe(
        EXPECTED_COLUMNS.length,
      )
    })
  })

  // Task lane6-reviewer-callout-empty-rule-contradicts-oracle-placeholder-table:
  // The aside's "if a panel is empty, that service is unreachable" rule was
  // contradicted by the panel rendering a full 12-row dash table when degraded.
  // The empty-data branch now collapses to a single yellow "awaiting first
  // on-chain write" notice so the visual matches the rule.
  describe('awaiting-first-write empty state', () => {
    it('rows.length === 0 path renders the awaiting-first-write notice (yellow box, no placeholder rows)', () => {
      useReadContractsMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useReadContracts>)

      render(<OnChainOraclePanel />)

      expect(screen.getByTestId('onchain-oracle-awaiting')).toBeInTheDocument()
      expect(
        document.querySelectorAll('[data-testid^="onchain-oracle-placeholder-"]').length,
      ).toBe(0)
      expect(screen.queryByTestId('onchain-oracle-empty-banner')).not.toBeInTheDocument()
    })

    it('awaiting notice lists the expected ticker count and joined symbols', () => {
      useReadContractsMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useReadContracts>)

      render(<OnChainOraclePanel />)

      const box = screen.getByTestId('onchain-oracle-awaiting')
      expect(box.textContent).toMatch(/AAPL/)
      expect(box.textContent).toMatch(/TSLA/)
      expect(box.textContent).toMatch(/NVDA/)
      expect(box.textContent).toMatch(/Awaiting first on-chain write/i)
      expect(box.className).toMatch(/border-yellow/)
    })

    it('rows.length > 0 path renders the table without the awaiting notice', () => {
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

      expect(screen.queryByTestId('onchain-oracle-awaiting')).not.toBeInTheDocument()
      const populatedRows = document.querySelectorAll('tbody tr')
      expect(populatedRows.length).toBe(1)
      expect(within(populatedRows[0] as HTMLElement).getByText('AAPL')).toBeInTheDocument()
    })
  })
})
