import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

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

import { OnChainOraclePanel } from '../OnChainOraclePanel'
import { TestProofPipelineAxesProvider } from '../ProofPipelineAxesProvider'
import { ProofPanelActionsProvider } from '../ProofPanelActionsProvider'
import { shortAddress } from '../panelHeaderMetaUtils'
import {
  type DecodedPriceData,
  type OnChainFetchStatus,
  type ProofPipelineAxesState,
} from '../useProofPipelineAxes'

const ORACLE_ADDRESS = '0x1111111111111111111111111111111111111111'
const ORACLE_ADDRESS_SHORT = shortAddress(ORACLE_ADDRESS)

/**
 * Sane defaults for the parts of the axes context that don't drive the
 * on-chain panel — the panel only reads the on-chain fields, so other
 * axes can stay nominal here without affecting assertions.
 */
const BASE_AXES_VALUE: ProofPipelineAxesState = {
  axes: { quotes: 'healthy', onChain: 'healthy', hedgeProof: 'healthy' },
  verdict: 'green',
  partialVerdict: 'green',
  resolvedAxisCount: 3,
  lastFullyAliveAt: null,
  lastQuotesPayload: null,
  lastQuotesAt: null,
  lastQuotesStatus: 'ok',
  lastHedgeProofPayload: null,
  lastHedgeProofAt: null,
  lastHedgeProofStatus: 'ok',
  onChainRows: [],
  onChainStatus: 'ok',
  onChainAt: null,
  cadenceMs: 5_000,
  onChainCadenceMs: 30_000,
  priceServiceUrl: 'http://localhost:9300',
  hedgeProofEndpoint: '/api/hedge-proof/latest',
  stalenessThresholdMs: 30_000,
  retryQuotes: () => Promise.resolve(),
  retryHedgeProof: () => Promise.resolve(),
  retryOnChain: () => Promise.resolve(),
}

interface RenderOpts {
  rows?: readonly DecodedPriceData[]
  status?: OnChainFetchStatus
  onChainAt?: number | null
  retryOnChain?: () => Promise<void>
}

/**
 * Mount the panel inside a hand-crafted axes context. Mirrors the
 * pattern `LiveQuotesPanel.test.tsx` adopted in #0051 — the panel no
 * longer owns its fetch, so tests drive its render contract by handing
 * it the desired decoded rows + status directly via context (#0063).
 */
function renderPanel(opts: RenderOpts = {}) {
  const value: ProofPipelineAxesState = {
    ...BASE_AXES_VALUE,
    onChainRows: opts.rows ?? [],
    onChainStatus: opts.status ?? 'ok',
    onChainAt: opts.onChainAt ?? null,
    retryOnChain: opts.retryOnChain ?? BASE_AXES_VALUE.retryOnChain,
  }
  return render(
    <TestProofPipelineAxesProvider value={value}>
      <ProofPanelActionsProvider>
        <OnChainOraclePanel />
      </ProofPanelActionsProvider>
    </TestProofPipelineAxesProvider>,
  )
}

function row(
  symbol: string,
  overrides: Partial<DecodedPriceData> = {},
): DecodedPriceData {
  return {
    symbol,
    price8: 17_860_000_000n,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    session: 0,
    confidence: 95,
    signerCount: 1,
    ...overrides,
  }
}

describe('OnChainOraclePanel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('renders the outer section with the stable jump-target id', () => {
    const { container } = renderPanel({ status: 'loading' })
    expect(container.querySelector('section[id="panel-onchain-oracle"]')).not.toBeNull()
  })

  it('outer section uses flex flex-col h-full so it fills its grid cell row height (#0039)', () => {
    const { container } = renderPanel({ status: 'loading' })
    const section = container.querySelector('section[id="panel-onchain-oracle"]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/\bh-full\b/)
    expect(section.className).toMatch(/\bflex\b/)
    expect(section.className).toMatch(/\bflex-col\b/)
    const body = section.querySelector(':scope > div.flex-1')
    expect(body, 'expected a flex-1 body wrapper inside the panel').not.toBeNull()
  })

  it('renders a user-facing error block when onChainStatus is "error" — no wagmi internals leak', () => {
    renderPanel({ status: 'error' })

    const headline = screen.getByText(/Oracle multicall failed/i)
    const errorBlock = headline.parentElement as HTMLElement
    expect(errorBlock).not.toBeNull()
    const inside = within(errorBlock)
    // Customer-readable copy renders…
    expect(inside.getByText(/temporarily unreachable/i)).toBeInTheDocument()
    // …and no wagmi internals leak. The detail blob lives only at the
    // data boundary (useProofPipelineAxes) now (#0063).
    expect(inside.queryByText(/eth_call/)).not.toBeInTheDocument()
    expect(inside.queryByText(/https?:\/\//)).not.toBeInTheDocument()
    expect(inside.queryByText(/0x[a-f0-9]{40}/i)).not.toBeInTheDocument()
    expect(inside.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
    expect(inside.queryByText(/viem/)).not.toBeInTheDocument()
  })

  it('renders no error block on the happy path with no error and no rows', () => {
    renderPanel({ status: 'ok', rows: [] })

    expect(screen.queryByText(/Oracle multicall failed/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/No on-chain price data available/i),
    ).not.toBeInTheDocument()
  })

  it('colours the session pill green when getPriceData decodes session=0 (Open)', () => {
    renderPanel({ status: 'ok', rows: [row('AAPL', { session: 0 })] })

    const pill = screen.getByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/bg-green/)
    expect(pill.textContent).toBe('Open')
  })

  it('colours the session pill red when session=4 (Halted)', () => {
    renderPanel({ status: 'ok', rows: [row('AAPL', { session: 4 })] })

    const pill = screen.getByTestId('session-pill-AAPL')
    expect(pill.className).toMatch(/bg-red/)
    expect(pill.textContent).toBe('Halted')
  })

  it('does not render placeholder rows or the empty banner when populated rows exist', () => {
    renderPanel({ status: 'ok', rows: [row('AAPL')] })

    expect(screen.queryByTestId('onchain-oracle-empty-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('onchain-oracle-placeholder-AAPL')).not.toBeInTheDocument()
    expect(screen.queryByTestId('onchain-oracle-placeholder-TSLA')).not.toBeInTheDocument()
  })

  it('renders the contract address as a link to the block explorer when NEXT_PUBLIC_BLOCK_EXPLORER is set', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com')
    renderPanel({ status: 'ok' })

    const link = screen.getByTestId('oracle-address-link') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(
      `https://explorer.example.com/address/${ORACLE_ADDRESS}`,
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    // The visible link text is the canonical short form so this panel
    // matches OracleUpdatesPanel's address rendering — see #0072. The
    // full hex stays reachable via the `href` and the `title` tooltip.
    expect(link.textContent).toContain(ORACLE_ADDRESS_SHORT)
    expect(link.textContent).not.toContain(ORACLE_ADDRESS)
    expect(screen.queryByTestId('oracle-address-text')).not.toBeInTheDocument()
  })

  it('oracle address link reads as a muted mono atom by default and reveals the accent tone on hover (#0042)', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com')
    renderPanel({ status: 'ok' })
    const link = screen.getByTestId('oracle-address-link') as HTMLAnchorElement
    const cls = link.className
    expect(cls).toMatch(/\bfont-mono\b/)
    expect(cls).toMatch(/\btext-gray-400\b/)
    expect(cls).toMatch(/hover:text-accent/)
    expect(cls).toMatch(/hover:underline/)
    expect(cls).not.toMatch(/(^|\s)text-accent(\s|$)/)
  })

  it('falls back to plain text when no explorer env is set', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', '')
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER_URL', '')
    renderPanel({ status: 'ok' })

    expect(screen.queryByTestId('oracle-address-link')).not.toBeInTheDocument()
    const span = screen.getByTestId('oracle-address-text')
    // Fallback span also uses the canonical short form so the two
    // adjacent panels never disagree on how the same oracle address
    // looks — see #0072.
    expect(span.textContent).toContain(ORACLE_ADDRESS_SHORT)
    expect(span.textContent).not.toContain(ORACLE_ADDRESS)
  })

  it('survives a trailing slash on the explorer URL', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com/')
    renderPanel({ status: 'ok' })

    const link = screen.getByTestId('oracle-address-link')
    expect(link.getAttribute('href')).toBe(
      `https://explorer.example.com/address/${ORACLE_ADDRESS}`,
    )
  })

  it('surfaces the full address via title attribute on either variant', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com')
    renderPanel({ status: 'ok' })
    expect(screen.getByTestId('oracle-address-link').getAttribute('title')).toBe(ORACLE_ADDRESS)
  })

  it('surfaces the full address via title attribute on the fallback span', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', '')
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER_URL', '')
    renderPanel({ status: 'ok' })
    expect(screen.getByTestId('oracle-address-text').getAttribute('title')).toBe(ORACLE_ADDRESS)
  })

  // #0072 — sister to the OracleUpdatesPanel test that pins the same
  // short-form. Both panels sit one above the other on the proof page
  // and a reviewer scanning for "is this the right oracle?" must see
  // an identical visible string in both panel headers. Pin the link's
  // visible text to exactly `shortAddress(ORACLE_ADDRESS)` so any
  // future drift in render path (longer slice, different separator)
  // surfaces here.
  it('renders the explorer link text as exactly shortAddress(oracleAddress) — same canonical short form as OracleUpdatesPanel (#0072)', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', 'https://explorer.example.com')
    renderPanel({ status: 'ok' })
    const link = screen.getByTestId('oracle-address-link')
    expect(link.textContent?.trim()).toBe(`${ORACLE_ADDRESS_SHORT} ↗`)
  })

  it('renders the fallback span text as exactly shortAddress(oracleAddress) (#0072)', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER', '')
    vi.stubEnv('NEXT_PUBLIC_BLOCK_EXPLORER_URL', '')
    renderPanel({ status: 'ok' })
    const span = screen.getByTestId('oracle-address-text')
    expect(span.textContent?.trim()).toBe(ORACLE_ADDRESS_SHORT)
  })

  // Task lane6-onchain-oracle-column-headers-unexplained-jargon:
  // The centerpiece table's column shorthands ("8-dec", "Conf",
  // "Signers", "Session") must expose a plain-English explanation via
  // the `title=` attribute (mouse hover) and `aria-describedby` →
  // sr-only `<dd>` (screen reader) so a fresh non-engineer reviewer
  // can read every column.
  describe('column header help', () => {
    const EXPECTED_COLUMNS = ['symbol', 'price', 'session', 'conf', 'signers', 'updated']

    function renderPopulated() {
      return renderPanel({ status: 'ok', rows: [row('AAPL', { session: 0 })] })
    }

    it('columns render in the documented order and count', () => {
      renderPopulated()
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
        renderPopulated()
        const th = screen.getByTestId(`onchain-oracle-header-${key}`)
        const title = th.getAttribute('title')
        expect(title).toBeTruthy()
        expect(title).toMatch(keyword)
      },
    )

    it('each column header is described by a hidden description node', () => {
      renderPopulated()
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
      renderPopulated()
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
    it('status=ok with no rows renders the awaiting-first-write notice (yellow box, no placeholder rows)', () => {
      renderPanel({ status: 'ok', rows: [] })

      expect(screen.getByTestId('onchain-oracle-awaiting')).toBeInTheDocument()
      expect(
        document.querySelectorAll('[data-testid^="onchain-oracle-placeholder-"]').length,
      ).toBe(0)
      expect(screen.queryByTestId('onchain-oracle-empty-banner')).not.toBeInTheDocument()
    })

    it('awaiting notice lists the expected ticker count and joined symbols', () => {
      renderPanel({ status: 'ok', rows: [] })

      const box = screen.getByTestId('onchain-oracle-awaiting')
      expect(box.textContent).toMatch(/AAPL/)
      expect(box.textContent).toMatch(/TSLA/)
      expect(box.textContent).toMatch(/NVDA/)
      expect(box.textContent).toMatch(/Awaiting first on-chain write/i)
      expect(box.className).toMatch(/border-yellow/)
    })

    // #0046 — the awaiting box previously crammed three font treatments
    // (sans body, inline `<code>setPrice</code>`, inline mono comma-joined
    // ticker span) into one paragraph. Restructure into three stacked
    // atoms with one font treatment each: bold title, prose paragraph,
    // labelled chip grid.
    it('awaiting state renders expected symbols as chips, not a comma-separated string (#0046)', () => {
      renderPanel({ status: 'ok', rows: [] })

      const list = screen.getByTestId('onchain-oracle-expected-symbols')
      expect(list.tagName).toBe('UL')
      expect(list.children.length).toBe(3)
      const tickers = Array.from(list.children).map((li) => li.textContent?.trim())
      expect(tickers).toEqual(['AAPL', 'TSLA', 'NVDA'])
      for (const li of Array.from(list.children)) {
        expect(li.textContent).not.toMatch(/,/)
        expect(li.className).toMatch(/\bfont-mono\b/)
        expect(li.className).toMatch(/\brounded-md\b/)
      }
    })

    it('awaiting state explanation paragraph has no inline code or mono spans (#0046)', () => {
      renderPanel({ status: 'ok', rows: [] })

      const box = screen.getByTestId('onchain-oracle-awaiting')
      const paragraphs = box.querySelectorAll('p')
      expect(paragraphs.length).toBeGreaterThanOrEqual(1)
      for (const p of Array.from(paragraphs)) {
        expect(p.querySelectorAll('code, [class*="font-mono"]').length).toBe(0)
        expect(p.textContent).not.toMatch(/setPrice/)
      }
    })

    it('awaiting state surfaces a labelled "EXPECTED SYMBOLS (N)" header above the chip grid (#0046)', () => {
      renderPanel({ status: 'ok', rows: [] })

      const box = screen.getByTestId('onchain-oracle-awaiting')
      expect(box.textContent).toMatch(/Expected symbols\s*\(3\)/i)
    })

    it('status=ok with rows renders the table without the awaiting notice', () => {
      renderPanel({ status: 'ok', rows: [row('AAPL')] })

      expect(screen.queryByTestId('onchain-oracle-awaiting')).not.toBeInTheDocument()
      const populatedRows = document.querySelectorAll('tbody tr')
      expect(populatedRows.length).toBe(1)
      expect(within(populatedRows[0] as HTMLElement).getByText('AAPL')).toBeInTheDocument()
    })
  })

  // The panel now consumes pre-decoded rows + status from
  // `useProofPipelineAxes` (#0063). The hook owns the single
  // sanitise/log pair at the data boundary, so the panel test no
  // longer asserts on console.error/sanitiseClientError directly —
  // those contracts move to the hook test where they belong.
})
