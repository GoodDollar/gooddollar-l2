import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { OracleStatusBadge, __resetOracleStatusFallbackForTests } from '../OracleStatusBadge'

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
  getSessionLabel: vi.fn(() => 'Market Open'),
  getDominantSession: vi.fn(() => 'open'),
}))

const { usePriceServiceStatus } = await import('@/lib/usePriceServiceStatus')

describe('OracleStatusBadge stocks fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    __resetOracleStatusFallbackForTests()
  })

  it('shows Live with stocks fallback when quote status is unavailable but stocks-keeper is healthy', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          overall: 'healthy',
          services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
        }),
        { status: 200 },
      ),
    )

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.getByText('stocks-keeper')).toBeInTheDocument()
  })

  it('shows Oracle offline when quote status is unavailable and fallback status fails', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Oracle offline')).toBeInTheDocument())
  })

  it('dedupes fallback status fetches while a request is in flight', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })

    const pending = new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve(
          new Response(
            JSON.stringify({
              overall: 'healthy',
              services: [{ name: 'stocks-keeper', status: 'ok', lastChecked: new Date().toISOString() }],
            }),
            { status: 200 },
          ),
        )
      }, 0)
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(pending as unknown as Promise<Response>)

    render(
      <>
        <OracleStatusBadge useStocksFallback />
        <OracleStatusBadge useStocksFallback />
      </>,
    )

    await waitFor(() => expect(screen.getAllByText('Live').length).toBeGreaterThan(0))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('shows animated skeleton pill instead of plain text while checking oracle', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    expect(screen.queryByText('Checking oracle...')).not.toBeInTheDocument()
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})
