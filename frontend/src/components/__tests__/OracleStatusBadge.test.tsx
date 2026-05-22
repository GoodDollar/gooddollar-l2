import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'

import { OracleStatusBadge } from '../OracleStatusBadge'

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
  getSessionLabel: vi.fn(() => 'Market Open'),
  getDominantSession: vi.fn(() => 'open'),
}))

const { usePriceServiceStatus } = await import('@/lib/usePriceServiceStatus')

describe('OracleStatusBadge stocks fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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

  it('shows Price feed offline when quote status is unavailable and fallback status fails', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Price feed offline')).toBeInTheDocument())
  })

  it('never shows "oracle" in user-facing text when offline', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const { container } = render(<OracleStatusBadge useStocksFallback />)
    await waitFor(() => expect(screen.getByText('Price feed offline')).toBeInTheDocument())
    expect(container.textContent?.toLowerCase()).not.toContain('oracle')
  })
})

describe('OracleStatusBadge timeout phases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows initial loading state with "Connecting to price feed..."', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    render(<OracleStatusBadge useStocksFallback />)
    expect(screen.getByText('Connecting to price feed...')).toBeInTheDocument()
  })

  it('shows "Price feed connecting..." after 5s timeout', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    render(<OracleStatusBadge useStocksFallback />)
    expect(screen.getByText('Connecting to price feed...')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText('Price feed connecting...')).toBeInTheDocument()
  })

  it('shows "Price feed unavailable" with Retry after 15s timeout', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    render(<OracleStatusBadge useStocksFallback />)

    act(() => { vi.advanceTimersByTime(15000) })
    expect(screen.getByText('Price feed unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retry resets to loading state', () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'quote status unavailable',
    })
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    render(<OracleStatusBadge useStocksFallback />)

    act(() => { vi.advanceTimersByTime(15000) })
    expect(screen.getByText('Price feed unavailable')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(screen.getByText('Connecting to price feed...')).toBeInTheDocument()
  })
})
