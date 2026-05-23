'use client'

import { useEffect, useState } from 'react'
import {
  ALLOWED_ETORO_MODES,
  REAL_TRADING_ENABLED,
  isEtoroModeAllowed,
  type SafetyStateResponse,
} from '@/lib/safety'

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; data: SafetyStateResponse }
  | { status: 'error' }

interface SafetyBannerProps {
  /** Optional override for the fetch URL, used by tests. */
  endpoint?: string
}

export function SafetyBanner({ endpoint = '/api/safety-state' }: SafetyBannerProps) {
  const [state, setState] = useState<FetchState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(endpoint, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`safety-state returned ${res.status}`)
        const data = (await res.json()) as SafetyStateResponse
        if (!cancelled) setState({ status: 'ok', data })
      })
      .catch((err: unknown) => {
        console.error('[safety-banner] fetch failed', err)
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [endpoint])

  if (state.status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading safety state"
        className="w-full rounded-xl border border-white/10 bg-dark-50/40 px-4 py-3"
      >
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div
        role="alert"
        className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3"
      >
        <div className="text-sm font-semibold text-red-200">
          Safety state unverified.
        </div>
        <div className="mt-1 text-xs text-red-300/80">
          The /api/safety-state endpoint did not respond. Treat the release
          as unverified until the safety check completes.
        </div>
      </div>
    )
  }

  const apiOk = state.data.realTradingEnabled === false
  const frontendOk = REAL_TRADING_ENABLED === false
  const modeOk = isEtoroModeAllowed(state.data.etoroMode)
  const safe = apiOk && frontendOk && modeOk

  if (!safe) {
    const realTradingTripped = !apiOk || !frontendOk
    const headline = realTradingTripped
      ? 'REFUSAL: real trading flag tripped. This release is NOT safe to ship.'
      : 'REFUSAL: ETORO_MODE is outside the allowed demo set. This release is NOT safe to ship.'
    const allowedList = ALLOWED_ETORO_MODES.join(', ')
    return (
      <div
        role="alert"
        className="w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" aria-hidden />
          {headline}
        </div>
        <div className="mt-1 text-xs text-red-300/80">
          frontend.REAL_TRADING_ENABLED = {String(frontendOk ? false : true)} ·
          server.realTradingEnabled = {String(state.data.realTradingEnabled)} ·
          ETORO_MODE = {state.data.etoroMode || '(unset)'}
        </div>
        {!modeOk && (
          <div className="mt-1 text-xs text-red-300/80">
            failed: ETORO_MODE (allowed: {allowedList})
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      role="status"
      className="w-full rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden />
          Safe
        </span>
        <span className="text-gray-300">
          <code className="text-green-300">REAL_TRADING_ENABLED = false</code> on both sides
        </span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-300">
          ETORO_MODE = <code className="text-accent">{state.data.etoroMode}</code>
        </span>
      </div>
    </div>
  )
}
