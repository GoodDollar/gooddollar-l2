import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import {
  ProofPanelActionsProvider,
  useProofPanelActionsContext,
} from '../ProofPanelActionsProvider'

const wrap = ({ children }: PropsWithChildren) => (
  <ProofPanelActionsProvider>{children}</ProofPanelActionsProvider>
)

describe('ProofPanelActionsProvider', () => {
  it('returns a no-op state when consumed outside the provider', async () => {
    const { result } = renderHook(() => useProofPanelActionsContext())
    expect(result.current.anyRetrying).toBe(false)
    expect(result.current.isRetrying('quotes')).toBe(false)
    // refreshAll resolves cleanly even when no provider is mounted
    await expect(result.current.refreshAll()).resolves.toBeUndefined()
    // registerPanelRetry returns an unregister callback that's safe to call
    expect(typeof result.current.registerPanelRetry('quotes', () => {})).toBe('function')
  })

  it('refreshAll fans out to every registered panel exactly once', async () => {
    const { result } = renderHook(() => useProofPanelActionsContext(), { wrapper: wrap })
    const fnQuotes = vi.fn(() => Promise.resolve())
    const fnOnChain = vi.fn(() => Promise.resolve())
    const fnHedge = vi.fn(() => Promise.resolve())

    act(() => {
      result.current.registerPanelRetry('quotes', fnQuotes)
      result.current.registerPanelRetry('onChain', fnOnChain)
      result.current.registerPanelRetry('hedgeProof', fnHedge)
    })

    await act(async () => {
      await result.current.refreshAll()
    })

    expect(fnQuotes).toHaveBeenCalledTimes(1)
    expect(fnOnChain).toHaveBeenCalledTimes(1)
    expect(fnHedge).toHaveBeenCalledTimes(1)
  })

  it('retryPanel only fires the matching panel — other panels are untouched', async () => {
    const { result } = renderHook(() => useProofPanelActionsContext(), { wrapper: wrap })
    const fnQuotes = vi.fn(() => Promise.resolve())
    const fnOnChain = vi.fn(() => Promise.resolve())

    act(() => {
      result.current.registerPanelRetry('quotes', fnQuotes)
      result.current.registerPanelRetry('onChain', fnOnChain)
    })

    await act(async () => {
      await result.current.retryPanel('quotes')
    })

    expect(fnQuotes).toHaveBeenCalledTimes(1)
    expect(fnOnChain).not.toHaveBeenCalled()
  })

  it('anyRetrying reflects in-flight panels and clears once the retry settles', async () => {
    const { result } = renderHook(() => useProofPanelActionsContext(), { wrapper: wrap })
    let resolveQuotes: () => void = () => undefined
    const fnQuotes = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveQuotes = resolve
        }),
    )

    act(() => {
      result.current.registerPanelRetry('quotes', fnQuotes)
    })

    expect(result.current.anyRetrying).toBe(false)

    let pending: Promise<void>
    act(() => {
      pending = result.current.retryPanel('quotes')
    })

    // Re-render with the new in-flight set
    expect(result.current.isRetrying('quotes')).toBe(true)
    expect(result.current.anyRetrying).toBe(true)

    await act(async () => {
      resolveQuotes()
      await pending
    })

    expect(result.current.isRetrying('quotes')).toBe(false)
    expect(result.current.anyRetrying).toBe(false)
  })

  it('unregister callback removes the retry from the registry', async () => {
    const { result } = renderHook(() => useProofPanelActionsContext(), { wrapper: wrap })
    const fnQuotes = vi.fn(() => Promise.resolve())
    let unregister: () => void = () => undefined

    act(() => {
      unregister = result.current.registerPanelRetry('quotes', fnQuotes)
    })

    act(() => {
      unregister()
    })

    await act(async () => {
      await result.current.refreshAll()
    })

    expect(fnQuotes).not.toHaveBeenCalled()
  })

  it('rejected retries do not leak the busy flag', async () => {
    const { result } = renderHook(() => useProofPanelActionsContext(), { wrapper: wrap })
    const fnQuotes = vi.fn(() => Promise.reject(new Error('boom')))

    act(() => {
      result.current.registerPanelRetry('quotes', fnQuotes)
    })

    await act(async () => {
      await result.current.retryPanel('quotes').catch(() => undefined)
    })

    expect(result.current.anyRetrying).toBe(false)
  })
})
