import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LastDemoHedgePanel } from '../LastDemoHedgePanel'
import {
  ProofPipelineAxesProvider,
  TestProofPipelineAxesProvider,
} from '../ProofPipelineAxesProvider'
import { ProofPanelActionsProvider } from '../ProofPanelActionsProvider'
import {
  type HedgeProofFetchStatus,
  type ProofPipelineAxesState,
} from '../useProofPipelineAxes'
import { NO_OP_ORDER_ID, type HedgeProof } from '@/lib/hedgeProof'
import { parseRunId } from '@/lib/parseRunId'

// The panel never reads on-chain state. Keep a quiet wagmi mock around in
// case any future composite test mounts `ProofPipelineAxesProvider`
// directly (e.g. the integrated retry test below).
vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(),
}))

vi.mock('@/lib/stockData', () => ({
  getAllTickers: () => ['AAPL'],
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    StocksPriceOracle: '0x1111111111111111111111111111111111111111',
  },
}))

vi.mock('@/lib/abi', () => ({
  PriceOracleABI: [],
}))

const T0 = new Date('2026-05-23T13:50:20.584Z').getTime()
const T_PROOF = T0 - 3 * 60_000

const RELATIVE_SOURCE = 'qa-proof/hedges/latest.json'

function envelope(proof: HedgeProof) {
  return { proof, source: RELATIVE_SOURCE }
}

const PROOF_NO_OP: HedgeProof = {
  runId: '2026-05-23T13-30-22-900-2283a3',
  orderId: NO_OP_ORDER_ID,
  symbol: 'AAPL',
  side: 'buy',
  notionalUsd: 0,
  timestamp: 1779543022901,
  beforeExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
  afterExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
  dryRun: true,
  etoroMode: 'sandbox',
  realTradingEnabled: false,
}

const PROOF_DRY_RUN: HedgeProof = {
  runId: '2026-05-23T13-31-10-100-abc123',
  orderId: 'dry-run-abc',
  symbol: 'TSLA',
  side: 'buy',
  notionalUsd: 250,
  timestamp: 1779543070100,
  beforeExposure: { netDelta: 1000, absExposure: 1000, blockNumber: 41 },
  afterExposure: { netDelta: 750, absExposure: 750, blockNumber: 42 },
  dryRun: true,
  etoroMode: 'sandbox',
  realTradingEnabled: false,
}

const PROOF_LIVE: HedgeProof = {
  runId: '2026-05-23T13-32-00-100-def456',
  orderId: 'live-123',
  symbol: 'NVDA',
  side: 'sell',
  notionalUsd: 400,
  timestamp: 1779543120100,
  beforeExposure: { netDelta: -2000, absExposure: 2000, blockNumber: 50 },
  afterExposure: { netDelta: -1600, absExposure: 1600, blockNumber: 51 },
  dryRun: false,
  etoroMode: 'demo',
  realTradingEnabled: false,
}

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
  lastHedgeProofStatus: 'loading',
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
  payload?: unknown
  status?: HedgeProofFetchStatus
  hedgeProofEndpoint?: string
  cadenceMs?: number
  lastHedgeProofAt?: number | null
  retryHedgeProof?: () => Promise<void>
}

/**
 * Drop the panel into a `TestProofPipelineAxesProvider` with hand-crafted
 * hedge-proof axes state. Mirrors the pattern `LiveQuotesPanel.test.tsx`
 * adopted in #0051 — the panel no longer owns its fetch, so tests drive
 * its render contract by handing it the desired payload/status directly.
 */
function renderPanel(opts: RenderOpts = {}) {
  const value: ProofPipelineAxesState = {
    ...BASE_AXES_VALUE,
    lastHedgeProofPayload: opts.payload ?? null,
    lastHedgeProofStatus: opts.status ?? (opts.payload !== undefined ? 'ok' : 'loading'),
    lastHedgeProofAt: opts.lastHedgeProofAt ?? null,
    cadenceMs: opts.cadenceMs ?? BASE_AXES_VALUE.cadenceMs,
    hedgeProofEndpoint: opts.hedgeProofEndpoint ?? BASE_AXES_VALUE.hedgeProofEndpoint,
    retryHedgeProof: opts.retryHedgeProof ?? BASE_AXES_VALUE.retryHedgeProof,
  }
  return render(
    <TestProofPipelineAxesProvider value={value}>
      <ProofPanelActionsProvider>
        <LastDemoHedgePanel />
      </ProofPanelActionsProvider>
    </TestProofPipelineAxesProvider>,
  )
}

/** Sugar for the most common case — the panel renders an ok envelope. */
function renderWithProof(proof: HedgeProof, source: string = RELATIVE_SOURCE) {
  return renderPanel({ payload: { proof, source }, status: 'ok' })
}

describe('LastDemoHedgePanel', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders the hedge timestamp as a humanised relative phrase plus HH:MM:SS UTC', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(T0))

    renderWithProof({ ...PROOF_NO_OP, timestamp: T_PROOF })

    const ts = await vi.waitFor(() => {
      const el = screen.getByTestId('hedge-timestamp')
      expect(el.textContent).toMatch(/3m ago/i)
      return el
    })
    expect(ts.textContent).toMatch(/13:47:20 UTC/)
  })

  it('exposes the full ISO and local-time wall clock on the title attribute', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(T0))

    renderWithProof({ ...PROOF_NO_OP, timestamp: T_PROOF })

    const title = await vi.waitFor(() => {
      const t = screen.getByTestId('hedge-timestamp').getAttribute('title') ?? ''
      expect(t).toContain('2026-05-23T13:47:20.584Z')
      return t
    })
    expect(title.split('\n').length).toBeGreaterThanOrEqual(2)
    expect(title).toMatch(/2026/)
  })

  it.each([
    ['zero', 0],
    ['NaN', Number.NaN],
  ])('renders — when timestamp is %s', async (_label, timestamp) => {
    renderWithProof({ ...PROOF_NO_OP, timestamp })

    await waitFor(() => {
      expect(screen.getByTestId('hedge-timestamp')).toBeInTheDocument()
    })
    expect(screen.getByTestId('hedge-timestamp').textContent).toBe('—')
  })

  it('relative phrase updates at the 30s ticker without a fresh fetch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(T0))
    // After #0062 the panel does not own a fetch — guard regression by
    // asserting global fetch is never invoked while we drive the 30s tick.
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch

    renderWithProof({ ...PROOF_NO_OP, timestamp: T_PROOF })

    const initial = await vi.waitFor(() => {
      const t = screen.getByTestId('hedge-timestamp').textContent ?? ''
      expect(t).toMatch(/m ago/i)
      return t
    })
    const initialMatch = initial.match(/(\d+)m ago/i)
    expect(initialMatch).not.toBeNull()
    const initialMinutes = Number(initialMatch![1])

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
    })

    const after = screen.getByTestId('hedge-timestamp').textContent ?? ''
    const afterMatch = after.match(/(\d+)m ago/i)
    expect(afterMatch).not.toBeNull()
    const afterMinutes = Number(afterMatch![1])
    expect(afterMinutes).toBeGreaterThan(initialMinutes)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  // #0053 — RUNID and TIMESTAMP rows live in the same <dl> and each use a
  // middle-dot separator between two atoms; the dot must render with the
  // same horizontal padding in both rows. The fix promotes RelativeTimestamp
  // to the same flex-with-gap-1 pattern that RunIdValue uses (4 px / 4 px
  // around the dot). These tests pin both call sites to that pattern so a
  // regression in either component fails fast.
  describe('RelativeTimestamp dot-spacing parity with RunIdValue (#0053)', () => {
    it('RelativeTimestamp outer wrapper is a flex container with gap-1 / flex-wrap / items-baseline', async () => {
      renderWithProof({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' })

      const ts = await waitFor(() => screen.getByTestId('hedge-timestamp'))
      expect(ts.className).toMatch(/\binline-flex\b/)
      expect(ts.className).toMatch(/\bgap-1\b/)
      expect(ts.className).toMatch(/\bitems-baseline\b/)
      expect(ts.className).toMatch(/\bflex-wrap\b/)
    })

    it('RelativeTimestamp dot is a standalone aria-hidden span — not fused into a text node', async () => {
      renderWithProof({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' })

      const ts = await waitFor(() => screen.getByTestId('hedge-timestamp'))
      const dotSpans = Array.from(ts.querySelectorAll('span[aria-hidden]')).filter(
        (n) => (n.textContent ?? '').trim() === '·',
      )
      expect(dotSpans).toHaveLength(1)
      const dot = dotSpans[0]
      expect(dot.className).not.toMatch(/\bml-1\b/)
    })

    it('RelativeTimestamp and RunIdValue share the same flex-gap container classes — single typographic rhythm', async () => {
      renderWithProof({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' })

      const ts = await waitFor(() => screen.getByTestId('hedge-timestamp'))
      const run = screen.getByTestId('hedge-runid')
      for (const cls of ['inline-flex', 'flex-wrap', 'items-baseline', 'gap-1']) {
        expect(ts.className, `hedge-timestamp missing ${cls}`).toMatch(new RegExp(`\\b${cls}\\b`))
        expect(run.className, `hedge-runid missing ${cls}`).toMatch(new RegExp(`\\b${cls}\\b`))
      }
    })

    it('RelativeTimestamp still renders the relative phrase + HH:MM:SS UTC text content after the restructure', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      vi.setSystemTime(new Date(T0))

      renderWithProof({ ...PROOF_NO_OP, timestamp: T_PROOF })

      const ts = await vi.waitFor(() => {
        const el = screen.getByTestId('hedge-timestamp')
        expect(el.textContent).toMatch(/3m ago/i)
        return el
      })
      expect(ts.textContent).toMatch(/13:47:20 UTC/)
      expect(ts.getAttribute('title')).toContain('2026-05-23T13:47:20.584Z')
    })
  })

  it('renders the outer section with the stable jump-target id', () => {
    const { container } = renderPanel()
    expect(container.querySelector('section[id="panel-last-hedge"]')).not.toBeNull()
  })

  it('outer section uses flex flex-col h-full so it fills its grid cell row height (#0039)', () => {
    const { container } = renderPanel()
    const section = container.querySelector('section[id="panel-last-hedge"]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/\bh-full\b/)
    expect(section.className).toMatch(/\bflex\b/)
    expect(section.className).toMatch(/\bflex-col\b/)
    const body = section.querySelector(':scope > div.flex-1')
    expect(body, 'expected a flex-1 body wrapper inside the panel').not.toBeNull()
  })

  it('renders the no-op sentinel as a "below-threshold tick" card without a BUY badge', async () => {
    renderWithProof(PROOF_NO_OP)

    await waitFor(() => {
      expect(screen.getByText(/Below-threshold tick/i)).toBeInTheDocument()
    })
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText(/No hedge needed/i)).toBeInTheDocument()
    expect(screen.getByText(/netDelta unchanged/i)).toBeInTheDocument()
    expect(screen.queryByText(/^BUY$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^SELL$/i)).not.toBeInTheDocument()
    // `$0.00` may legitimately appear inside the "netDelta unchanged" footer
    // when before/after are both zero. The PRD bans it only next to a side
    // badge — and there is no side badge on the no-op card.
    expect(screen.getByText(/DRY-RUN/)).toBeInTheDocument()
    expect(screen.getByText(/real trading: false/i)).toBeInTheDocument()
  })

  it('renders a dry-run demo hedge with the green BUY badge, notional and DRY-RUN chip', async () => {
    renderWithProof(PROOF_DRY_RUN)

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })
    expect(screen.getByText(/^buy$/i)).toBeInTheDocument()
    expect(screen.getByText('$250.00')).toBeInTheDocument()
    expect(screen.getByText(/DRY-RUN/)).toBeInTheDocument()
    expect(screen.queryByText(/Below-threshold tick/i)).not.toBeInTheDocument()
    // #0045: the source path now appears only in the header rail (truncated
    // by shortenSourcePath); the bottom-of-card SourceFooter is gone.
    const headerMeta = screen.getByTestId('panel-header-meta')
    expect(headerMeta.textContent).toContain('hedges/latest.json')
  })

  it('renders a live demo hedge with the side badge but no DRY-RUN chip', async () => {
    renderWithProof(PROOF_LIVE)

    await waitFor(() => {
      expect(screen.getByText('NVDA')).toBeInTheDocument()
    })
    expect(screen.getByText(/^sell$/i)).toBeInTheDocument()
    expect(screen.getByText('$400.00')).toBeInTheDocument()
    expect(screen.queryByText(/DRY-RUN/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Below-threshold tick/i)).not.toBeInTheDocument()
  })

  // #0040 — uniform chip family on the LastDemoHedge header row.
  it('NoOpCard chip-row: below-threshold, DRY-RUN, real trading: false share the StatusPill base classes', async () => {
    renderWithProof(PROOF_NO_OP)

    const threshold = await screen.findByText(/Below-threshold tick/i)
    const dryRun = screen.getByText(/^DRY-RUN$/)
    const noLive = screen.getByText(/real trading: false/i)

    for (const chip of [threshold, dryRun, noLive]) {
      const cls = chip.className
      expect(cls).toMatch(/\bpx-2\b/)
      expect(cls).toMatch(/\bpy-0\.5\b/)
      expect(cls).toMatch(/\btext-xs\b/)
      expect(cls).toMatch(/\bfont-semibold\b/)
      expect(cls).toMatch(/\buppercase\b/)
      expect(cls).toMatch(/\btracking-wider\b/)
      expect(cls).toMatch(/\brounded-md\b/)
      // Guard against the old oversized variant.
      expect(cls).not.toMatch(/\bpx-2\.5\b/)
      expect(cls).not.toMatch(/\bpy-1\b/)
      expect(cls).not.toMatch(/\bfont-medium\b/)
    }
  })

  it('HedgeCard chip-row: side, DRY-RUN, real trading: false share the StatusPill base classes and tone', async () => {
    renderWithProof(PROOF_DRY_RUN)

    const side = await screen.findByText(/^buy$/i)
    const dryRun = screen.getByText(/^DRY-RUN$/)
    const noLive = screen.getByText(/real trading: false/i)

    for (const chip of [side, dryRun, noLive]) {
      const cls = chip.className
      expect(cls).toMatch(/\bpx-2\b/)
      expect(cls).toMatch(/\bpy-0\.5\b/)
      expect(cls).toMatch(/\btext-xs\b/)
      expect(cls).toMatch(/\bfont-semibold\b/)
      expect(cls).toMatch(/\buppercase\b/)
      expect(cls).toMatch(/\btracking-wider\b/)
      expect(cls).toMatch(/\brounded-md\b/)
      expect(cls).not.toMatch(/\bpx-2\.5\b/)
      expect(cls).not.toMatch(/\bpy-1\b/)
      expect(cls).not.toMatch(/\bfont-medium\b/)
    }

    expect(side.className).toMatch(/bg-green-500\/10/)
    expect(side.className).toMatch(/text-green-300/)
  })

  // #0044 — symbol promotes into the StatusPill family so all four atoms
  // in the row share padding, casing, and baseline. The bare `text-sm
  // font-semibold text-white` span is replaced with a `StatusPill
  // tone="symbol"` whose chrome matches the rest of the row.
  it('SymbolLabel: symbol renders inside a StatusPill with the symbol tone (#0044)', async () => {
    renderWithProof(PROOF_NO_OP)

    const symbol = await screen.findByText('AAPL')
    const cls = symbol.className
    expect(cls).toMatch(/\brounded-md\b/)
    expect(cls).toMatch(/\bpx-2\b/)
    expect(cls).toMatch(/\bpy-0\.5\b/)
    expect(cls).toMatch(/\btext-xs\b/)
    expect(cls).toMatch(/\bfont-semibold\b/)
    expect(cls).toMatch(/\buppercase\b/)
    expect(cls).toMatch(/\btracking-wider\b/)
    expect(cls).toMatch(/bg-white\/15/)
    expect(cls).toMatch(/\btext-white\b/)
    expect(cls).not.toMatch(/\btext-sm\b/)
    const parent = symbol.parentElement as HTMLElement
    expect(parent).not.toBeNull()
    expect(parent.className).toMatch(/\bitems-baseline\b/)
  })

  it('SymbolLabel: notionalUsd value renders at text-xs not text-sm so it baseline-aligns with the pill row (#0044)', async () => {
    renderWithProof(PROOF_DRY_RUN)

    const dollar = await screen.findByText('$250.00')
    const cls = dollar.className
    expect(cls).toMatch(/\bfont-mono\b/)
    expect(cls).toMatch(/\btext-xs\b/)
    expect(cls).toMatch(/\btext-gray-100\b/)
    expect(cls).not.toMatch(/\btext-sm\b/)
  })

  // #0045 — the LAST DEMO HEDGE panel previously rendered the proof
  // artifact's source path twice: once in the header rail (truncated)
  // and once in a bottom-of-card `source: …` caption. After #0042
  // promoted source metadata into the panel header rail for every panel
  // family, the footer became a redundant duplicate. Delete it; the
  // header rail's `title=` tooltip remains the path to the full string.
  it('renders the source path once — in the header rail only, with no SourceFooter caption (#0045)', async () => {
    renderWithProof(PROOF_NO_OP)

    const headerMeta = await screen.findByTestId('panel-header-meta')
    expect(headerMeta.textContent).toContain('hedges/latest.json')

    // No bottom-of-card "source: qa-proof/…" caption survives.
    expect(screen.queryByText(/source:\s*qa-proof/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^source:/i)).not.toBeInTheDocument()
    // The full path is reachable only via the rail's `title=` tooltip,
    // not rendered as visible text anywhere.
    const fullPathOccurrences = Array.from(
      document.querySelectorAll('*'),
    ).filter((el) => {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
      return ownText.includes('qa-proof/hedges/latest.json')
    })
    expect(fullPathOccurrences).toHaveLength(0)
  })

  it('renders the missing-proof state when the hedge-proof axis is missing (404)', async () => {
    renderPanel({ status: 'missing' })

    await waitFor(() => {
      expect(screen.getByText(/No proof yet/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/hedge:demo/)).toBeInTheDocument()
  })

  it('missing-proof state links to the configured hedge-proof endpoint', async () => {
    renderPanel({ status: 'missing', hedgeProofEndpoint: '/api/hedge-proof/latest' })

    const link = await screen.findByTestId('hedge-proof-url-link')
    expect(link.getAttribute('href')).toBe('/api/hedge-proof/latest')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('renders the canonical sanitised message when the axis reports error, without leaking debug strings', async () => {
    renderPanel({ status: 'error' })

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Hedge proof endpoint is unreachable/i)).toBeInTheDocument()
    expect(screen.queryByText(/JSON/)).not.toBeInTheDocument()
    expect(screen.queryByText(/parse/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/home\//)).not.toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
    expect(screen.queryByText(/HTTP \d/)).not.toBeInTheDocument()

    const tagged = consoleErrorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === '[proof-panel]' && c[1] === 'hedge-proof',
    )
    expect(tagged).toBeDefined()
  })

  it('renders the canned shape-mismatch message when the 200 body has no proof field', async () => {
    renderPanel({ payload: { source: RELATIVE_SOURCE }, status: 'ok' })

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/unexpected shape/i)).toBeInTheDocument()
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument()
    expect(screen.queryByText(/Below-threshold tick/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/SHAPE_MISMATCH/)).not.toBeInTheDocument()
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\bnull\b/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/home\//)).not.toBeInTheDocument()

    const tagged = consoleErrorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === '[proof-panel]' && c[1] === 'hedge-proof-shape',
    )
    expect(tagged).toBeDefined()
  })

  it('renders the canned shape-mismatch message when the 200 body has proof but no beforeExposure', async () => {
    renderPanel({
      payload: {
        proof: {
          runId: 'r',
          orderId: 'x',
          symbol: 'AAPL',
          side: 'buy',
          notionalUsd: 0,
          timestamp: 0,
          dryRun: true,
          etoroMode: 'sandbox',
          realTradingEnabled: false,
        },
        source: RELATIVE_SOURCE,
      },
      status: 'ok',
    })

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/unexpected shape/i)).toBeInTheDocument()
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument()
    expect(screen.queryByText(/netDelta/)).not.toBeInTheDocument()
    expect(screen.queryByText(/SHAPE_MISMATCH/)).not.toBeInTheDocument()

    const tagged = consoleErrorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === '[proof-panel]' && c[1] === 'hedge-proof-shape',
    )
    expect(tagged).toBeDefined()
  })

  it('error branch links to the configured hedge-proof endpoint', async () => {
    renderPanel({ status: 'error' })

    const link = await screen.findByTestId('hedge-proof-url-link')
    expect(link.getAttribute('href')).toBe('/api/hedge-proof/latest')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('Retry now button fires retryHedgeProof from the provider', async () => {
    const retryHedgeProof = vi.fn(() => Promise.resolve())
    renderPanel({ status: 'ok', payload: envelope(PROOF_NO_OP), retryHedgeProof })

    const button = await screen.findByTestId('last-hedge-retry')
    await act(async () => {
      fireEvent.click(button)
    })
    expect(retryHedgeProof).toHaveBeenCalledTimes(1)
  })

  // Integrated coverage — confirm the panel and the rest of the proof-page
  // axes provider stay in sync when both are driven by the same hook. The
  // hook itself owns the single `/api/hedge-proof/latest` poller (#0062),
  // so the panel under the real provider must reflect whatever the hook
  // last fetched without making a second request of its own.
  it('integrated provider drives the panel via the shared hedge-proof axis', async () => {
    // The hook also mounts a wagmi useReadContracts multicall for the
    // on-chain axis (#0063); quiet that so the test focuses on the
    // hedge-proof path.
    const { useReadContracts } = await import('wagmi')
    vi.mocked(useReadContracts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: () => Promise.resolve({ data: undefined } as never),
    } as unknown as ReturnType<typeof useReadContracts>)

    const fetchSpy = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const url = String(input)
      if (url.includes('/api/hedge-proof/latest')) {
        return {
          ok: true,
          status: 200,
          json: async () => envelope(PROOF_DRY_RUN),
        } as Response
      }
      return {
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response
    })
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch

    render(
      <ProofPipelineAxesProvider offChainIntervalMs={60_000}>
        <ProofPanelActionsProvider>
          <LastDemoHedgePanel />
        </ProofPanelActionsProvider>
      </ProofPipelineAxesProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })
    expect(screen.getByText(/^buy$/i)).toBeInTheDocument()
    // ONE poll per cycle — task #0062 collapses a previously-duplicated
    // 15s panel poller into the hook's 60s axis cadence in this test.
    const hedgeCalls = fetchSpy.mock.calls.filter((c) =>
      String(c[0]).includes('/api/hedge-proof/latest'),
    )
    expect(hedgeCalls.length).toBeGreaterThanOrEqual(1)
    expect(hedgeCalls.length).toBeLessThanOrEqual(2)
  })

  // Task lane6-last-demo-hedge-runid-renders-as-dash-encoded-iso-hash:
  // runId used to render as the raw filesystem-safe composite
  // "2026-05-23T13-47-20-583-96c7b2", which fresh readers couldn't tell
  // was a timestamp+hash. It now renders as "YYYY-MM-DD HH:MM:SS UTC ·
  // <tag>" with the raw value preserved on hover (title=) and reachable
  // via a one-click copy button.
  describe('runId parsing and copy affordance', () => {
    it('parseRunId returns iso + tag for canonical input', () => {
      expect(parseRunId('2026-05-23T13-47-20-583-96c7b2')).toEqual({
        iso: '2026-05-23T13:47:20.583Z',
        tag: '96c7b2',
      })
    })

    it.each([
      ['empty string', ''],
      ['legacy id', 'legacy-run-id'],
      ['date only', '2026-05-23'],
      ['date + time but no tag', '2026-05-23T13-47-20-583'],
      ['non-hex tag', '2026-05-23T13-47-20-583-zzz999'],
      ['whitespace around canonical', '  2026-05-23T13-47-20-583-96c7b2  '],
    ])('parseRunId returns null for malformed input (%s)', (_label, input) => {
      expect(parseRunId(input)).toBeNull()
    })

    it('runId field renders the wallclock and tag instead of the raw composite when input matches', async () => {
      renderWithProof({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' })

      const el = await waitFor(() => screen.getByTestId('hedge-runid'))
      expect(el.textContent).toMatch(/2026-05-23 13:47:20 UTC/)
      expect(el.textContent).toMatch(/96c7b2/)
      expect(el.textContent).not.toMatch(/T13-47-20-583/)
    })

    it('runId field renders the raw string when input does not match the canonical pattern', async () => {
      renderWithProof({ ...PROOF_NO_OP, runId: 'legacy-run-id' })

      const el = await waitFor(() => screen.getByTestId('hedge-runid'))
      expect(el.textContent).toBe('legacy-run-id')
    })

    it.each([
      ['canonical', '2026-05-23T13-47-20-583-96c7b2'],
      ['legacy', 'legacy-run-id'],
    ])(
      'runId field surfaces the raw value (%s) as the title tooltip in both branches',
      async (_label, raw) => {
        renderWithProof({ ...PROOF_NO_OP, runId: raw })

        const el = await waitFor(() => screen.getByTestId('hedge-runid'))
        expect(el.getAttribute('title')).toBe(raw)
      },
    )

    it('copy button writes the raw runId to the clipboard and updates aria-label', async () => {
      const writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      })

      const raw = '2026-05-23T13-47-20-583-96c7b2'
      renderWithProof({ ...PROOF_NO_OP, runId: raw })

      const button = await waitFor(() => screen.getByTestId('hedge-runid-copy'))
      expect(button.tagName).toBe('BUTTON')
      expect(button.getAttribute('type')).toBe('button')
      expect(button.getAttribute('aria-label')).toMatch(/copy raw runid/i)

      await act(async () => {
        fireEvent.click(button)
      })

      expect(writeText).toHaveBeenCalledWith(raw)
      await waitFor(() => {
        expect(screen.getByTestId('hedge-runid-copy').getAttribute('aria-label')).toMatch(
          /copied/i,
        )
      })
    })

    it('clipboard rejection is swallowed silently — no console error, no thrown promise', async () => {
      const writeText = vi.fn(() => Promise.reject(new Error('insecure origin')))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      })

      renderWithProof({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' })

      const button = await waitFor(() => screen.getByTestId('hedge-runid-copy'))
      await act(async () => {
        fireEvent.click(button)
      })

      expect(writeText).toHaveBeenCalled()
      // aria-label stays in its initial "copy" state since the write
      // never settled successfully.
      expect(button.getAttribute('aria-label')).toMatch(/copy raw runid/i)
      // The component must not have console.errored the clipboard failure
      // (the tooltip is the user's fallback path).
      const clipboardError = consoleErrorSpy.mock.calls.find((c: unknown[]) =>
        String(c.join(' ')).toLowerCase().includes('insecure origin'),
      )
      expect(clipboardError).toBeUndefined()
    })
  })
})
