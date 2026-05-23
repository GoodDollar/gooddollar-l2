import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  beforeEach(() => {
    vi.restoreAllMocks()
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

  it('renders an inline error when the safety-state endpoint fails', async () => {
    mockFetchResponse({}, 500)

    render(<SafetyBanner />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Safety state unavailable/i)
    })
  })
})
