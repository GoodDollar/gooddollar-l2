import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LastDemoHedgePanel } from '../LastDemoHedgePanel'
import { NO_OP_ORDER_ID, type HedgeProof } from '@/lib/hedgeProof'
import { parseRunId } from '@/lib/parseRunId'

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

function mockFetchOk(body: unknown) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response),
  )
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
    mockFetchOk(envelope({ ...PROOF_NO_OP, timestamp: T_PROOF }))

    render(<LastDemoHedgePanel intervalMs={5 * 60_000} />)

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
    mockFetchOk(envelope({ ...PROOF_NO_OP, timestamp: T_PROOF }))

    render(<LastDemoHedgePanel intervalMs={5 * 60_000} />)

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
    mockFetchOk(envelope({ ...PROOF_NO_OP, timestamp }))

    render(<LastDemoHedgePanel intervalMs={5 * 60_000} />)

    await waitFor(() => {
      expect(screen.getByTestId('hedge-timestamp')).toBeInTheDocument()
    })
    expect(screen.getByTestId('hedge-timestamp').textContent).toBe('—')
  })

  it('relative phrase updates at the 30s ticker without a fresh fetch', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(T0))
    mockFetchOk(envelope({ ...PROOF_NO_OP, timestamp: T_PROOF }))

    render(<LastDemoHedgePanel intervalMs={10 * 60_000} />)

    const initial = await vi.waitFor(() => {
      const t = screen.getByTestId('hedge-timestamp').textContent ?? ''
      expect(t).toMatch(/m ago/i)
      return t
    })
    const initialMatch = initial.match(/(\d+)m ago/i)
    expect(initialMatch).not.toBeNull()
    const initialMinutes = Number(initialMatch![1])

    const fetchSpy = globalThis.fetch as ReturnType<typeof vi.fn>
    const fetchCallsBefore = fetchSpy.mock.calls.length

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
    })

    const after = screen.getByTestId('hedge-timestamp').textContent ?? ''
    const afterMatch = after.match(/(\d+)m ago/i)
    expect(afterMatch).not.toBeNull()
    const afterMinutes = Number(afterMatch![1])
    expect(afterMinutes).toBeGreaterThan(initialMinutes)
    expect(fetchSpy.mock.calls.length).toBe(fetchCallsBefore)
  })

  it('renders the outer section with the stable jump-target id', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
    const { container } = render(<LastDemoHedgePanel intervalMs={60_000} />)
    expect(container.querySelector('section[id="panel-last-hedge"]')).not.toBeNull()
  })

  it('outer section uses flex flex-col h-full so it fills its grid cell row height (#0039)', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
    const { container } = render(<LastDemoHedgePanel intervalMs={60_000} />)
    const section = container.querySelector('section[id="panel-last-hedge"]') as HTMLElement
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/\bh-full\b/)
    expect(section.className).toMatch(/\bflex\b/)
    expect(section.className).toMatch(/\bflex-col\b/)
    const body = section.querySelector(':scope > div.flex-1')
    expect(body, 'expected a flex-1 body wrapper inside the panel').not.toBeNull()
  })

  it('renders the no-op sentinel as a "below-threshold tick" card without a BUY badge', async () => {
    mockFetchOk(envelope(PROOF_NO_OP))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

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
    mockFetchOk(envelope(PROOF_DRY_RUN))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })
    expect(screen.getByText(/^buy$/i)).toBeInTheDocument()
    expect(screen.getByText('$250.00')).toBeInTheDocument()
    expect(screen.getByText(/DRY-RUN/)).toBeInTheDocument()
    expect(screen.queryByText(/Below-threshold tick/i)).not.toBeInTheDocument()
    expect(screen.getByText(/qa-proof\/hedges\/latest\.json/)).toBeInTheDocument()
  })

  it('renders a live demo hedge with the side badge but no DRY-RUN chip', async () => {
    mockFetchOk(envelope(PROOF_LIVE))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

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
    mockFetchOk(envelope(PROOF_NO_OP))
    render(<LastDemoHedgePanel intervalMs={60_000} />)

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
    mockFetchOk(envelope(PROOF_DRY_RUN))
    render(<LastDemoHedgePanel intervalMs={60_000} />)

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
    mockFetchOk(envelope(PROOF_NO_OP))
    render(<LastDemoHedgePanel intervalMs={60_000} />)

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
    mockFetchOk(envelope(PROOF_DRY_RUN))
    render(<LastDemoHedgePanel intervalMs={60_000} />)

    const dollar = await screen.findByText('$250.00')
    const cls = dollar.className
    expect(cls).toMatch(/\bfont-mono\b/)
    expect(cls).toMatch(/\btext-xs\b/)
    expect(cls).toMatch(/\btext-gray-100\b/)
    expect(cls).not.toMatch(/\btext-sm\b/)
  })

  it('renders the missing-proof state on a 404', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'no_proof' }),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/No proof yet/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/hedge:demo/)).toBeInTheDocument()
  })

  it('renders the canned sanitised message from a 500 body without leaking debug strings', async () => {
    const cannedMessage = 'Hedge proof file is present but unreadable.'
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: 'read_failed',
            code: 'PROOF_UNREADABLE',
            message: cannedMessage,
          }),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(cannedMessage)).toBeInTheDocument()
    expect(screen.queryByText(/JSON/)).not.toBeInTheDocument()
    expect(screen.queryByText(/parse/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/home\//)).not.toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
  })

  it('falls back to a generic HTTP message when the 500 body is not JSON', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('not json')),
      } as Response),
    )

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/HTTP 502/)).toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()
  })

  it('renders the canned shape-mismatch message when the 200 body has no proof field', async () => {
    mockFetchOk({ source: RELATIVE_SOURCE })

    render(<LastDemoHedgePanel intervalMs={60_000} />)

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
    mockFetchOk({
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
    })

    render(<LastDemoHedgePanel intervalMs={60_000} />)

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

  it('renders the canned unreachable message when fetch itself rejects', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')))

    render(<LastDemoHedgePanel intervalMs={60_000} />)

    await waitFor(() => {
      expect(screen.getByText(/Hedge proof unavailable/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Hedge proof endpoint is unreachable/i)).toBeInTheDocument()
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument()

    const tagged = consoleErrorSpy.mock.calls.find(
      (c: unknown[]) => c[0] === '[proof-panel]' && c[1] === 'hedge-proof',
    )
    expect(tagged).toBeDefined()
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
      mockFetchOk(envelope({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' }))

      render(<LastDemoHedgePanel intervalMs={60_000} />)

      const el = await waitFor(() => screen.getByTestId('hedge-runid'))
      expect(el.textContent).toMatch(/2026-05-23 13:47:20 UTC/)
      expect(el.textContent).toMatch(/96c7b2/)
      expect(el.textContent).not.toMatch(/T13-47-20-583/)
    })

    it('runId field renders the raw string when input does not match the canonical pattern', async () => {
      mockFetchOk(envelope({ ...PROOF_NO_OP, runId: 'legacy-run-id' }))

      render(<LastDemoHedgePanel intervalMs={60_000} />)

      const el = await waitFor(() => screen.getByTestId('hedge-runid'))
      expect(el.textContent).toBe('legacy-run-id')
    })

    it.each([
      ['canonical', '2026-05-23T13-47-20-583-96c7b2'],
      ['legacy', 'legacy-run-id'],
    ])(
      'runId field surfaces the raw value (%s) as the title tooltip in both branches',
      async (_label, raw) => {
        mockFetchOk(envelope({ ...PROOF_NO_OP, runId: raw }))

        render(<LastDemoHedgePanel intervalMs={60_000} />)

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
      mockFetchOk(envelope({ ...PROOF_NO_OP, runId: raw }))

      render(<LastDemoHedgePanel intervalMs={60_000} />)

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

      mockFetchOk(envelope({ ...PROOF_NO_OP, runId: '2026-05-23T13-47-20-583-96c7b2' }))

      render(<LastDemoHedgePanel intervalMs={60_000} />)

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
