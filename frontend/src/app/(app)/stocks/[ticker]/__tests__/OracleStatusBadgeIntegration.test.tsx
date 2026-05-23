import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { OracleStatusBadge } from '@/components/OracleStatusBadge'

// Mock the primary quotes-status hook so we can simulate the production scenario
// where the quotes endpoint is unreachable from the browser (the case we
// observed during iteration 2 product review on 2026-05-20).
vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
  getSessionLabel: vi.fn(() => 'Market Open'),
  getDominantSession: vi.fn(() => 'open'),
}))

const { usePriceServiceStatus } = await import('@/lib/usePriceServiceStatus')

// These tests lock in the stocks/[ticker] detail-page behavior to prevent the
// "Oracle offline next to a live price" regression from coming back. They live
// under the [ticker] route's __tests__ folder so the failure mode names the
// surface the user actually sees.
describe('Stock detail page OracleStatusBadge integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows Live on the detail variant when primary quote status is down but stocks-keeper is healthy (default fallback ON)', async () => {
    // Simulate the production failure mode: quotes status endpoint unreachable.
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
      nextRetryAt: null,
    })
    // Fallback `/api/status` is healthy via the stocks-keeper service.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [
            { name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() },
          ],
        }),
        { status: 200 },
      ),
    )

    // Note: no explicit `useStocksFallback` prop — relies on the new default
    // (`true`) so the detail variant matches the listing-page behavior.
    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.queryByText('Oracle offline')).not.toBeInTheDocument()
  })

  it('shows Live on the detail variant when callers also pass useStocksFallback explicitly (defense in depth)', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
      nextRetryAt: null,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [
            { name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() },
          ],
        }),
        { status: 200 },
      ),
    )

    // Exactly what [ticker]/page.tsx will pass after the fix.
    render(<OracleStatusBadge variant="detail" symbol="AAPL" useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.queryByText('Oracle offline')).not.toBeInTheDocument()
  })

  it('does not flash Oracle offline before fallback health resolves (rapid route churn guard)', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
      nextRetryAt: null,
    })

    let resolveFetch: ((value: Response) => void) | null = null
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )

    render(<OracleStatusBadge variant="detail" symbol="AAPL" useStocksFallback />)

    expect(screen.getByText('Checking oracle...')).toBeInTheDocument()
    expect(screen.queryByText('Oracle offline')).not.toBeInTheDocument()

    resolveFetch!(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
        }),
        { status: 200 },
      ),
    )

    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.queryByText('Oracle offline')).not.toBeInTheDocument()
  })

  it('still surfaces Oracle offline when both the primary quote status and stocks-keeper fallback fail', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
      nextRetryAt: null,
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    await waitFor(() => expect(screen.getByText('Oracle offline')).toBeInTheDocument())
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
  })

  it('allows explicit opt-out via useStocksFallback={false} to preserve the legacy path for callers that want it', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
      nextRetryAt: null,
    })
    // Even though /api/status would return healthy, opting out must NOT fetch
    // it and must render the legacy "Oracle offline" copy.
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            overall: 'healthy',
            services: [
              { name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() },
            ],
          }),
          { status: 200 },
        ),
      )

    render(<OracleStatusBadge variant="detail" symbol="AAPL" useStocksFallback={false} />)
    await waitFor(() => expect(screen.getByText('Oracle offline')).toBeInTheDocument())
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
