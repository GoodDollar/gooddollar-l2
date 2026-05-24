'use client'

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/**
 * Stable identifier for each retryable proof panel. Using a string
 * union — not a free-form string — means the page-level "Refresh all"
 * button cannot accidentally drop a panel as the panel set evolves;
 * adding a new panel forces an exhaustive update at the type-checker.
 */
export type ProofPanelKey = 'quotes' | 'onChain' | 'oracleEvents' | 'hedgeProof'

export interface ProofPanelActionsState {
  /**
   * Register a panel's `retry` callback. Returns an unregister function
   * suitable for `useEffect` cleanup. Re-registering the same key
   * replaces the previous callback so a hot-reload or prop-change
   * during development does not leak stale closures.
   */
  registerPanelRetry: (key: ProofPanelKey, fn: () => Promise<void> | void) => () => void
  /**
   * Fire ONE registered panel's retry, tracking its busy state in the
   * central in-flight set so the panel's own busy chrome and the
   * page-level "any retrying" flag stay in sync. No-op when the panel
   * hasn't registered yet.
   */
  retryPanel: (key: ProofPanelKey) => Promise<void>
  /**
   * Fire every registered retry callback in parallel. Resolves once all
   * have settled (whether they succeeded or rejected) so the UI's
   * "any retrying" disabled state can lift cleanly.
   */
  refreshAll: () => Promise<void>
  /** True iff the panel identified by {@link key} is currently mid-retry. */
  isRetrying: (key: ProofPanelKey) => boolean
  /** True iff any panel — page-wide or single — is currently mid-retry. */
  anyRetrying: boolean
}

const NOOP_STATE: ProofPanelActionsState = {
  registerPanelRetry: () => () => undefined,
  retryPanel: () => Promise.resolve(),
  refreshAll: () => Promise.resolve(),
  isRetrying: () => false,
  anyRetrying: false,
}

const ProofPanelActionsContext = createContext<ProofPanelActionsState | null>(null)

/**
 * Centralises the cross-panel retry plumbing that powers the page-level
 * `Refresh all panels` button and the per-panel `Retry now` busy state.
 *
 * Each panel registers its own retry function in a `useEffect` and
 * unregisters on unmount. The button row above the data grid calls
 * {@link ProofPanelActionsState.refreshAll} which fan-outs to every
 * registered fn in parallel via `Promise.allSettled`, so a single slow
 * panel cannot block the page-level button from re-enabling.
 *
 * See task lane6-degraded-panels-offer-no-retry-or-open-url-or-next-poll-
 * countdown (0060).
 */
export function ProofPanelActionsProvider({ children }: PropsWithChildren) {
  const retriesRef = useRef<Map<ProofPanelKey, () => Promise<void> | void>>(new Map())
  const [retryingSet, setRetryingSet] = useState<ReadonlySet<ProofPanelKey>>(new Set())

  const markRetrying = useCallback((key: ProofPanelKey, value: boolean) => {
    setRetryingSet((prev) => {
      if (value === prev.has(key)) return prev
      const next = new Set(prev)
      if (value) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const registerPanelRetry = useCallback(
    (key: ProofPanelKey, fn: () => Promise<void> | void) => {
      retriesRef.current.set(key, fn)
      return () => {
        if (retriesRef.current.get(key) === fn) {
          retriesRef.current.delete(key)
        }
      }
    },
    [],
  )

  const retryPanel = useCallback(
    async (key: ProofPanelKey) => {
      const fn = retriesRef.current.get(key)
      if (!fn) return
      markRetrying(key, true)
      try {
        await fn()
      } finally {
        markRetrying(key, false)
      }
    },
    [markRetrying],
  )

  const refreshAll = useCallback(async () => {
    const keys = Array.from(retriesRef.current.keys())
    await Promise.allSettled(keys.map((k) => retryPanel(k)))
  }, [retryPanel])

  const isRetrying = useCallback((key: ProofPanelKey) => retryingSet.has(key), [retryingSet])

  const value = useMemo<ProofPanelActionsState>(
    () => ({
      registerPanelRetry,
      retryPanel,
      refreshAll,
      isRetrying,
      anyRetrying: retryingSet.size > 0,
    }),
    [registerPanelRetry, retryPanel, refreshAll, isRetrying, retryingSet],
  )

  return (
    <ProofPanelActionsContext.Provider value={value}>
      {children}
    </ProofPanelActionsContext.Provider>
  )
}

/**
 * Read the cross-panel actions state.
 *
 * Returns a no-op state when consumed outside the provider so panels
 * remain trivially usable in unit tests and storybook setups that
 * mount only `ProofPipelineAxesProvider`. The page-level button only
 * renders inside the provider, so its real refresh-all wiring is
 * unaffected.
 */
export function useProofPanelActionsContext(): ProofPanelActionsState {
  return useContext(ProofPanelActionsContext) ?? NOOP_STATE
}

export interface UsePanelRetry {
  /** True iff this panel's retry is in flight via the cross-panel registry. */
  busy: boolean
  /** Bound trigger that calls `retryPanel(key)` and tracks busy state. */
  fire: () => Promise<void>
}

/**
 * Bind a panel's `retry` callback to the cross-panel actions registry.
 *
 * Every panel needs the same three-line incantation: register on mount,
 * unregister on unmount, mirror the central `isRetrying` flag, and
 * expose a thin `fire` for header buttons. Consolidating it here keeps
 * the panel components free of registry plumbing.
 *
 * Pass a stable callback via `useCallback` — registration runs only
 * when {@link key} or the callback identity changes.
 */
export function usePanelRetry(
  key: ProofPanelKey,
  retry: () => Promise<void> | void,
): UsePanelRetry {
  const { registerPanelRetry, retryPanel, isRetrying } = useProofPanelActionsContext()
  useEffect(() => registerPanelRetry(key, retry), [registerPanelRetry, key, retry])
  const busy = isRetrying(key)
  const fire = useCallback(() => retryPanel(key), [retryPanel, key])
  return { busy, fire }
}
