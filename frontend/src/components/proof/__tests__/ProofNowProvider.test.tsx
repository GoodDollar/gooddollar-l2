import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, renderHook, screen, cleanup } from '@testing-library/react'

import { ProofNowProvider, useProofNow } from '../ProofNowProvider'
import { NextPollCountdown } from '../PanelHeaderControls'

describe('ProofNowProvider — shared 1s tick (#0066)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    cleanup()
  })

  it('useProofNow fallback: returns a stable finite number when no provider is mounted', () => {
    // Capture the value across two re-renders of the same hook instance
    // and assert it does not change — proves the ref-captured fallback
    // is stable so isolated unit tests don't accidentally race the
    // wall clock between renders.
    const { result, rerender } = renderHook(() => useProofNow())
    const first = result.current
    expect(Number.isFinite(first)).toBe(true)
    expect(first).toBeGreaterThan(0)
    rerender()
    expect(result.current).toBe(first)
  })

  it('useProofNow advances by ~1000ms inside the provider when the timer fires', () => {
    vi.useFakeTimers()
    const t0 = new Date('2026-05-23T00:00:00.000Z').getTime()
    vi.setSystemTime(new Date(t0))

    const { result } = renderHook(() => useProofNow(), {
      wrapper: ({ children }) => <ProofNowProvider>{children}</ProofNowProvider>,
    })

    expect(result.current).toBe(t0)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current).toBe(t0 + 1_000)
    act(() => {
      vi.advanceTimersByTime(2_500)
    })
    // Two further ticks land in the same window — assert the value
    // advanced by at least 2_000ms (the third 500ms increment hasn't
    // crossed the next setInterval boundary yet).
    expect(result.current).toBeGreaterThanOrEqual(t0 + 3_000)
  })

  it('three NextPollCountdown captions tick in lockstep inside one ProofNowProvider', () => {
    vi.useFakeTimers()
    const t0 = new Date('2026-05-23T00:00:00.000Z').getTime()
    vi.setSystemTime(new Date(t0))

    render(
      <ProofNowProvider>
        <NextPollCountdown
          lastPollAt={t0}
          intervalMs={5_000}
          testId="cd-a"
        />
        <NextPollCountdown
          lastPollAt={t0}
          intervalMs={5_000}
          testId="cd-b"
        />
        <NextPollCountdown
          lastPollAt={t0}
          intervalMs={5_000}
          testId="cd-c"
        />
      </ProofNowProvider>,
    )

    const initial = [
      screen.getByTestId('cd-a').textContent ?? '',
      screen.getByTestId('cd-b').textContent ?? '',
      screen.getByTestId('cd-c').textContent ?? '',
    ]
    // All three must read the same caption at t=0 (every panel was
    // polled simultaneously).
    expect(new Set(initial).size).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    const afterOne = [
      screen.getByTestId('cd-a').textContent ?? '',
      screen.getByTestId('cd-b').textContent ?? '',
      screen.getByTestId('cd-c').textContent ?? '',
    ]
    // And one second later, still in lockstep.
    expect(new Set(afterOne).size).toBe(1)
    // The caption changed (advanced one second).
    expect(afterOne[0]).not.toBe(initial[0])
  })

  it('mounts exactly one setInterval(1000) for any number of NextPollCountdown consumers', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    render(
      <ProofNowProvider>
        <NextPollCountdown lastPollAt={0} intervalMs={5_000} testId="cd-a" />
        <NextPollCountdown lastPollAt={0} intervalMs={5_000} testId="cd-b" />
        <NextPollCountdown lastPollAt={0} intervalMs={5_000} testId="cd-c" />
      </ProofNowProvider>,
    )

    const oneSecondCalls = setIntervalSpy.mock.calls.filter(
      (call) => call[1] === 1_000,
    )
    expect(oneSecondCalls.length).toBe(1)
  })

  it('rendering NextPollCountdown without a provider does not throw and produces a caption', () => {
    const { container } = render(
      <NextPollCountdown
        lastPollAt={Date.now() - 1_000}
        intervalMs={5_000}
        testId="cd-fallback"
      />,
    )
    expect(container.textContent).toBeTruthy()
    expect(screen.getByTestId('cd-fallback')).toBeInTheDocument()
  })
})
