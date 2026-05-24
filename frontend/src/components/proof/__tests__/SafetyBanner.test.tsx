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

  it('clears the recovery interval on unmount when still in error state (#0071)', async () => {
    // After #0071, the steady-state SAFE branch cancels its interval as
    // soon as the first safe response lands — there's nothing left to
    // clear at unmount. Cleanup only matters when the recovery
    // interval is still alive (error/unsafe state). Pin that contract.
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')))

    const { unmount } = render(<SafetyBanner intervalMs={5_000} />)
    await vi.waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Safety state unverified/i),
    )

    const callsBefore = clearIntervalSpy.mock.calls.length
    unmount()
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  // #0048 — the SafetyBanner was the only top-level container on
  // /live-prices-proof still wearing `rounded-xl` (12 px). Every
  // neighbouring section (reviewer callout, both pipeline banners,
  // pipeline flow diagram, all four data panels) uses `rounded-2xl`
  // (16 px). Align the outlier so the page reads as one stack of
  // consistently-cornered containers.
  describe('outer container radius (#0048)', () => {
    function assertRoundedTwoXL(el: HTMLElement) {
      const tokens = el.className.split(/\s+/)
      expect(tokens).toContain('rounded-2xl')
      expect(tokens).not.toContain('rounded-xl')
    }

    it('loading state outer div uses rounded-2xl, not rounded-xl', () => {
      globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof globalThis.fetch
      render(<SafetyBanner />)
      assertRoundedTwoXL(screen.getByLabelText(/Loading safety state/i))
    })

    it('error state outer div uses rounded-2xl, not rounded-xl', async () => {
      globalThis.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')))
      render(<SafetyBanner />)
      const alert = await screen.findByRole('alert')
      assertRoundedTwoXL(alert)
    })

    it('refusal state outer div uses rounded-2xl, not rounded-xl', async () => {
      mockFetchResponse({ realTradingEnabled: true, etoroMode: 'real', version: 1 })
      render(<SafetyBanner />)
      const alert = await screen.findByRole('alert')
      assertRoundedTwoXL(alert)
    })

    it('safe state outer div uses rounded-2xl, not rounded-xl', async () => {
      mockFetchResponse({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 })
      render(<SafetyBanner />)
      await waitFor(() => expect(screen.getByText(/Safe/i)).toBeInTheDocument())
      const status = screen.getByRole('status')
      assertRoundedTwoXL(status)
    })
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

  // Task #0071 — stop polling /api/safety-state once a safe response
  // lands. The two fields the banner reads are server-side build/boot
  // constants and cannot change without restarting the process; the
  // 240 requests/hour the previous 15s cadence emitted were pure waste.
  describe('cadence after first safe response (#0071)', () => {
    function setHidden(hidden: boolean) {
      Object.defineProperty(document, 'hidden', {
        value: hidden,
        configurable: true,
        writable: true,
      })
      Object.defineProperty(document, 'visibilityState', {
        value: hidden ? 'hidden' : 'visible',
        configurable: true,
        writable: true,
      })
    }

    it('stops polling after the first safe ok — no extra fetches over multiple intervals', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }),
        } as Response),
      )
      globalThis.fetch = fetchMock as typeof globalThis.fetch

      render(<SafetyBanner intervalMs={1_000} />)

      await vi.waitFor(() => expect(screen.getByText(/Safe/i)).toBeInTheDocument())

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000)
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(screen.getByText(/Safe/i)).toBeInTheDocument()
    })

    it('re-fetches once on visibilitychange after the first safe ok', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }),
        } as Response),
      )
      globalThis.fetch = fetchMock as typeof globalThis.fetch

      render(<SafetyBanner intervalMs={1_000} />)
      await vi.waitFor(() => expect(screen.getByText(/Safe/i)).toBeInTheDocument())

      // Simulate the user hiding the tab — no extra fetch.
      await act(async () => {
        setHidden(true)
        document.dispatchEvent(new Event('visibilitychange'))
        await vi.advanceTimersByTimeAsync(1_000)
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Tab regains focus — exactly one recheck.
      await act(async () => {
        setHidden(false)
        document.dispatchEvent(new Event('visibilitychange'))
        await vi.advanceTimersByTimeAsync(0)
      })
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

      // Subsequent intervals should not recur — still no recurring poll
      // once both responses are safe.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000)
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('keeps polling on a first-fetch error so the page can recover from a transient outage', async () => {
      vi.useFakeTimers()
      let call = 0
      const fetchMock = vi.fn(() => {
        call++
        if (call === 1) return Promise.reject(new Error('Failed to fetch'))
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }),
        } as Response)
      })
      globalThis.fetch = fetchMock as typeof globalThis.fetch

      render(<SafetyBanner intervalMs={1_000} />)

      await vi.waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(/Safety state unverified/i),
      )

      // The recovery interval keeps firing — 1s tick → first recovery
      // fetch, which now resolves safe and silences the timer.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000)
      })
      await vi.waitFor(() => expect(screen.getByText(/Safe/i)).toBeInTheDocument())
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)

      // Now-safe state cancels recurring polls.
      const settled = fetchMock.mock.calls.length
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000)
      })
      expect(fetchMock.mock.calls.length).toBe(settled)
    })

    it('keeps polling while the response is unsafe (REFUSAL state can recover via env restart)', async () => {
      vi.useFakeTimers()
      let call = 0
      const fetchMock = vi.fn(() => {
        call++
        const body =
          call <= 2
            ? { realTradingEnabled: true, etoroMode: 'real', version: 1 }
            : { realTradingEnabled: false, etoroMode: 'sandbox', version: 1 }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(body),
        } as Response)
      })
      globalThis.fetch = fetchMock as typeof globalThis.fetch

      render(<SafetyBanner intervalMs={1_000} />)
      await vi.waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(/REFUSAL/i),
      )

      // Recovery interval keeps polling through the unsafe response.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000)
      })
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })
})
