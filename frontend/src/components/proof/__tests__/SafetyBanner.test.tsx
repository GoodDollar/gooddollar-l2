import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { SafetyBanner } from '../SafetyBanner'

function mockFetchResponse(body: unknown, status = 200) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response),
  )
}

describe('SafetyBanner', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders the safe pill when both sides report real-trading disabled', async () => {
    mockFetchResponse({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 })

    render(<SafetyBanner />)

    expect(screen.getByRole('status', { hidden: true }) ?? null).toBeTruthy()

    await waitFor(() => {
      expect(screen.getByText(/Safe/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/sandbox/)).toBeInTheDocument()
    expect(screen.getByText(/REAL_TRADING_ENABLED = false/)).toBeInTheDocument()
  })

  it('renders a refusal alert when the server reports realTradingEnabled = true', async () => {
    mockFetchResponse({ realTradingEnabled: true, etoroMode: 'real', version: 1 })

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/REFUSAL/i)
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/real trading flag tripped/i)
  })

  it('renders REFUSAL when etoroMode is "real" even with realTradingEnabled false', async () => {
    mockFetchResponse({ realTradingEnabled: false, etoroMode: 'real', version: 1 })

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/REFUSAL/i)
    })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/ETORO_MODE is outside the allowed demo set/i)
    expect(alert).toHaveTextContent(/allowed: sandbox, demo/i)
    expect(alert).not.toHaveTextContent(/real trading flag tripped/i)
  })

  it('renders REFUSAL when etoroMode is empty/unknown', async () => {
    mockFetchResponse({ realTradingEnabled: false, etoroMode: '', version: 1 })

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/REFUSAL/i)
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/ETORO_MODE is outside the allowed demo set/i)
  })

  it('renders SAFE for etoroMode "demo"', async () => {
    mockFetchResponse({ realTradingEnabled: false, etoroMode: 'demo', version: 1 })

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByText(/Safe/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/demo/)).toBeInTheDocument()
  })

  it('renders unverified copy with no raw status / parser / fetch leak when the endpoint returns 500', async () => {
    mockFetchResponse({}, 500)

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Safety state unverified/i)
    })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(
      /The \/api\/safety-state endpoint did not respond/i,
    )
    expect(alert).not.toHaveTextContent(/safety-state returned/)
    expect(alert).not.toHaveTextContent(/\b\d{3}\b/)
    expect(alert).not.toHaveTextContent(/JSON/i)
    expect(alert).not.toHaveTextContent(/parse/i)
    expect(alert).not.toHaveTextContent(/Failed to fetch/)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[safety-banner] fetch failed',
      expect.anything(),
    )
  })

  it('renders unverified copy when the fetch itself rejects (network drop)', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')))

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Safety state unverified/i)
    })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/did not respond/i)
    expect(alert).not.toHaveTextContent(/Failed to fetch/)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[safety-banner] fetch failed',
      expect.anything(),
    )
  })

  it('polls on an interval and recovers from a transient 500', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }),
      } as Response)
    globalThis.fetch = fetchMock as typeof globalThis.fetch

    render(<SafetyBanner intervalMs={1_000} />)

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Safety state unverified/i)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })

    await vi.waitFor(() => {
      expect(screen.getByText(/Safe/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('clears the interval on unmount', async () => {
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }),
      } as Response),
    )

    const { unmount } = render(<SafetyBanner intervalMs={5_000} />)
    await vi.waitFor(() => expect(screen.getByText(/Safe/i)).toBeInTheDocument())

    const callsBefore = clearIntervalSpy.mock.calls.length
    unmount()
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('does not re-show the loading skeleton between polls', async () => {
    vi.useFakeTimers()
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }),
      } as Response),
    )

    render(<SafetyBanner intervalMs={1_000} />)

    await vi.waitFor(() => expect(screen.getByText(/Safe/i)).toBeInTheDocument())
    expect(screen.queryByLabelText(/Loading safety state/i)).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })

    expect(screen.queryByLabelText(/Loading safety state/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Safe/i)).toBeInTheDocument()
  })
})
