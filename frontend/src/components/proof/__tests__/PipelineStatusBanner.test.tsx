import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
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

import { useReadContract } from 'wagmi'
import { PipelineStatusBanner } from '../PipelineStatusBanner'
import {
  ProofPipelineAxesProvider,
  type ProofPipelineAxesProviderProps,
} from '../ProofPipelineAxesProvider'

const useReadContractMock = vi.mocked(useReadContract)

/**
 * Render the banner inside the shared provider so the hook drives the
 * fetch/mocked-wagmi paths. The provider props mirror the legacy
 * `PipelineStatusBanner` prop set (intervalMs, priceServiceUrl, ...).
 */
function renderBanner(opts: Omit<ProofPipelineAxesProviderProps, 'children'> = {}) {
  return render(
    <ProofPipelineAxesProvider {...opts}>
      <PipelineStatusBanner />
    </ProofPipelineAxesProvider>,
  )
}

const QUOTES_OK = {
  quotes: {
    AAPL: {
      symbol: 'AAPL',
      bid: 178.5,
      ask: 178.7,
      mid: 178.6,
      cacheAge: 1_000,
      sessionState: 'Open',
    },
  },
  timestamp: Date.now(),
}

const PROOF_ENVELOPE_OK = {
  source: 'qa-proof/evidence/latest.json',
  proof: { dryRun: true, orderId: 'noop', symbol: 'AAPL' },
}

type FetchMockEntry = { ok: boolean; status: number; body: unknown }
type FetchMockHandler = (input: string) => Promise<FetchMockEntry> | FetchMockEntry

function installFetchMock(handler: FetchMockHandler) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input)
    const r = await handler(url)
    return {
      ok: r.ok,
      status: r.status,
      json: () => Promise.resolve(r.body),
    } as Response
  }) as typeof globalThis.fetch
}

function mockOnChainHealthy() {
  useReadContractMock.mockReturnValue({
    data: {
      price8: 17_860_000_000n,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      session: 0,
      confidence: 95,
      signerCount: 1,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useReadContract>)
}

function mockOnChainDegraded() {
  useReadContractMock.mockReturnValue({
    data: {
      price8: 0n,
      timestamp: 0n,
      session: 3,
      confidence: 0,
      signerCount: 0,
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useReadContract>)
}

describe('PipelineStatusBanner', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useReadContractMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    cleanup()
  })

  it('renders a loading skeleton on first paint with role=status and the loading aria-label', () => {
    mockOnChainHealthy()
    installFetchMock(() => new Promise<FetchMockEntry>(() => {}) as Promise<FetchMockEntry>)

    renderBanner({ offChainIntervalMs: 60_000 })

    const skel = screen.getByRole('status', { name: /Loading pipeline status/i })
    expect(skel).toBeInTheDocument()
    const region = screen.getByTestId('pipeline-status-banner')
    expect(region).toBeInTheDocument()
    expect(region.getAttribute('data-status')).toBe('loading')
  })

  it('renders green when all three axes are healthy', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const region = await screen.findByTestId('pipeline-status-banner')
    await vi.waitFor(() => {
      expect(region.getAttribute('data-status')).toBe('green')
    })
    expect(region).toHaveTextContent(/alive/i)
    expect(region).toHaveTextContent(/live quotes fresh/i)
    expect(region).toHaveTextContent(/on-chain oracle returning data/i)
    expect(region).toHaveTextContent(/hedge-proof artifact present/i)
  })

  it('renders amber and lists degraded axes when one axis is unhealthy', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('ECONNREFUSED 127.0.0.1:9300')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const region = await screen.findByTestId('pipeline-status-banner')
    await vi.waitFor(() => {
      expect(region.getAttribute('data-status')).toBe('amber')
    })
    expect(region).toHaveTextContent(/degraded/i)
    expect(region).toHaveTextContent(/price-service unreachable/i)
    const alert = screen.getByRole('alert')
    expect(region).toContainElement(alert)
  })

  it('renders red when all three axes are unhealthy', async () => {
    mockOnChainDegraded()
    installFetchMock(() => {
      throw new Error('connection refused')
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const region = await screen.findByTestId('pipeline-status-banner')
    await vi.waitFor(() => {
      expect(region.getAttribute('data-status')).toBe('red')
    })
    expect(region).toHaveTextContent(/cold/i)
    expect(region).toHaveTextContent(/all upstreams unreachable/i)
    expect(region).toContainElement(screen.getByRole('alert'))
  })

  it('recovers from amber → green when the failing axis comes back on the next poll', async () => {
    vi.useFakeTimers()
    mockOnChainHealthy()
    let call = 0
    installFetchMock((url) => {
      if (url.includes('/quotes')) {
        call++
        if (call === 1) throw new Error('boom')
        return { ok: true, status: 200, body: QUOTES_OK }
      }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 1_000 })

    const region = await vi.waitFor(() => {
      const el = screen.getByTestId('pipeline-status-banner')
      expect(el.getAttribute('data-status')).toBe('amber')
      return el
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })

    await vi.waitFor(() => {
      expect(region.getAttribute('data-status')).toBe('green')
    })
    expect(
      screen.queryByRole('status', { name: /Loading pipeline status/i }),
    ).not.toBeInTheDocument()
  })

  it('sanitises raw transport errors before display', async () => {
    mockOnChainDegraded()
    installFetchMock(() => {
      throw new Error('ECONNREFUSED 127.0.0.1:9300 (super-secret-host)')
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const region = await screen.findByTestId('pipeline-status-banner')
    await vi.waitFor(() => {
      expect(region.getAttribute('data-status')).toBe('red')
    })
    expect(region).not.toHaveTextContent(/ECONNREFUSED/)
    expect(region).not.toHaveTextContent(/127\.0\.0\.1/)
    expect(region).not.toHaveTextContent(/super-secret-host/)
  })

  it('renders one chip-anchor per degraded axis with the correct href', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: false, status: 500, body: {} }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const liveQuotesChip = await screen.findByTestId('reason-chip-panel-live-quotes')
    expect(liveQuotesChip.getAttribute('href')).toBe('#panel-live-quotes')
    const hedgeChip = await screen.findByTestId('reason-chip-panel-last-hedge')
    expect(hedgeChip.getAttribute('href')).toBe('#panel-last-hedge')
    expect(screen.queryByTestId('reason-chip-panel-onchain-oracle')).not.toBeInTheDocument()
  })

  it('renders zero chips when every axis is healthy', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })
    const region = await screen.findByTestId('pipeline-status-banner')
    await vi.waitFor(() => {
      expect(region.getAttribute('data-status')).toBe('green')
    })
    expect(screen.queryAllByTestId(/^reason-chip-/)).toHaveLength(0)
  })

  it('in red verdict, chips render with the red tone', async () => {
    mockOnChainDegraded()
    installFetchMock(() => {
      throw new Error('connection refused')
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const chips = await vi.waitFor(() => {
      const els = screen.queryAllByTestId(/^reason-chip-/)
      expect(els.length).toBeGreaterThan(0)
      return els
    })
    chips.forEach((chip) => {
      expect(chip.className).toMatch(/text-red-200/)
    })
  })

  it('chips are focusable anchors, not buttons', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const chip = await screen.findByTestId('reason-chip-panel-live-quotes')
    expect(chip.tagName).toBe('A')
    expect(chip.getAttribute('aria-label')).toMatch(/jump to/i)
  })

  it('renders "just now" beneath the green verdict on a fresh all-green poll', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const line = await screen.findByTestId('last-fully-alive')
    expect(line.textContent).toMatch(/just now/i)
  })

  it('amber + never-fully-alive renders a confident statement, not a question', async () => {
    // Updated by lane6-pipeline-status-last-alive-line-asks-user-a-question:
    // the line below the DEGRADED pill used to read
    // "Not yet observed all-green this session, page just loaded?" (a
    // literal question mark addressed at the reader). It now reads a
    // verdict-matched statement with no trailing "?".
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const line = await screen.findByTestId('last-fully-alive')
    await vi.waitFor(() => {
      expect(line.textContent).toMatch(/No all-green observation yet this session/i)
    })
    expect(line.textContent).toMatch(/degraded state since it loaded/i)
    expect(line.textContent?.trim().endsWith('?')).toBe(false)
    expect(line.className).toMatch(/text-yellow/)
  })

  it('red + never-fully-alive renders a cold statement, not a question', async () => {
    // Same task as above; the red variant must use vocabulary that
    // matches the "Cold" pill above the line.
    mockOnChainDegraded()
    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: false, status: 503, body: {} }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    const line = await screen.findByTestId('last-fully-alive')
    await vi.waitFor(() => {
      expect(line.textContent).toMatch(/No all-green observation yet this session/i)
    })
    expect(line.textContent).toMatch(/cold state since it loaded/i)
    expect(line.textContent).not.toMatch(/degraded state/i)
    expect(line.textContent?.trim().endsWith('?')).toBe(false)
    expect(line.className).toMatch(/text-red/)
  })

  it('records the all-green timestamp and surfaces it as HH:MM:SS UTC, Xs ago on subsequent amber polls', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T13:00:00.000Z'))

    mockOnChainHealthy()
    let unhealthy = false
    installFetchMock((url) => {
      if (url.includes('/quotes')) {
        if (unhealthy) throw new Error('boom')
        return { ok: true, status: 200, body: QUOTES_OK }
      }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 1_000 })

    await vi.waitFor(() => {
      const region = screen.getByTestId('pipeline-status-banner')
      expect(region.getAttribute('data-status')).toBe('green')
    })

    unhealthy = true
    await act(async () => {
      vi.setSystemTime(new Date('2026-05-23T13:00:14.000Z'))
      await vi.advanceTimersByTimeAsync(1_000)
    })

    await vi.waitFor(() => {
      const region = screen.getByTestId('pipeline-status-banner')
      expect(region.getAttribute('data-status')).toBe('amber')
    })

    const line = screen.getByTestId('last-fully-alive')
    expect(line.textContent).toMatch(/Last fully alive:\s*13:00:00 UTC/)
    expect(line.textContent).toMatch(/\bago\b/i)
  })

  it('updates the "Xs ago" value at 1s cadence between polls', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T13:00:00.000Z'))

    mockOnChainHealthy()
    let unhealthy = false
    installFetchMock((url) => {
      if (url.includes('/quotes')) {
        if (unhealthy) throw new Error('boom')
        return { ok: true, status: 200, body: QUOTES_OK }
      }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })

    await vi.waitFor(() => {
      const region = screen.getByTestId('pipeline-status-banner')
      expect(region.getAttribute('data-status')).toBe('green')
    })

    unhealthy = true
    await act(async () => {
      vi.setSystemTime(new Date('2026-05-23T13:01:00.000Z'))
      await vi.advanceTimersByTimeAsync(60_000)
    })

    await vi.waitFor(() => {
      const region = screen.getByTestId('pipeline-status-banner')
      expect(region.getAttribute('data-status')).toBe('amber')
    })

    const before = screen.getByTestId('last-fully-alive').textContent ?? ''
    await act(async () => {
      vi.setSystemTime(new Date('2026-05-23T13:01:03.000Z'))
      await vi.advanceTimersByTimeAsync(3_000)
    })
    const after = screen.getByTestId('last-fully-alive').textContent ?? ''
    expect(after).not.toEqual(before)
  })

  it('session timestamp resets to null on remount', async () => {
    mockOnChainHealthy()
    installFetchMock((url) => {
      if (url.includes('/quotes')) return { ok: true, status: 200, body: QUOTES_OK }
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    const { unmount } = renderBanner({ offChainIntervalMs: 60_000 })
    await vi.waitFor(() => {
      const line = screen.getByTestId('last-fully-alive')
      expect(line.textContent).toMatch(/just now/i)
    })
    unmount()

    installFetchMock((url) => {
      if (url.includes('/quotes')) throw new Error('boom')
      if (url.includes('/api/hedge-proof/latest'))
        return { ok: true, status: 200, body: PROOF_ENVELOPE_OK }
      return { ok: false, status: 404, body: {} }
    })

    renderBanner({ offChainIntervalMs: 60_000 })
    await vi.waitFor(() => {
      const line = screen.getByTestId('last-fully-alive')
      // Updated copy (see lane6-pipeline-status-last-alive-line-asks-user-a-question).
      expect(line.textContent).toMatch(/No all-green observation yet this session/i)
    })
  })

  it('clears the interval on unmount', async () => {
    vi.useFakeTimers()
    mockOnChainHealthy()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    installFetchMock(() => ({ ok: true, status: 200, body: QUOTES_OK }))

    const { unmount } = renderBanner({ offChainIntervalMs: 1_000 })

    await vi.waitFor(() => {
      expect(screen.getByTestId('pipeline-status-banner')).toBeInTheDocument()
    })

    const before = clearIntervalSpy.mock.calls.length
    unmount()
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(before)
  })
})
