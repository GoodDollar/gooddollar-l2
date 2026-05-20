// Local watchlist storage for the Stocks UX — task 0034.
//
// Pure client-side, LocalStorage-backed, with a tiny pub/sub so multiple React
// components on the same page can stay in sync when one toggles a ticker.
//
// SSR-safe: every `window`/`localStorage` access is guarded.

const KEY = 'gooddollar.stocks.watchlist.v1'

// Module-scoped state. Survives across `useWatchlist` instances within a single
// page-load and is hydrated from LocalStorage on first access.
const tickers = new Set<string>()
const listeners = new Set<() => void>()

let initialized = false

/** True when the runtime has access to `window` + `localStorage`. */
function hasStorage(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

/**
 * Lazy, idempotent hydration from LocalStorage. Safe to call from any helper.
 * Tolerates malformed JSON by silently defaulting to an empty list — we never
 * want a corrupt entry to crash the page.
 */
function init(): void {
  if (initialized) return
  initialized = true
  if (!hasStorage()) return
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      for (const t of parsed) {
        if (typeof t === 'string' && t.length > 0) {
          tickers.add(t.toUpperCase())
        }
      }
    }
  } catch {
    // Malformed payload — leave the set empty. Next write will overwrite.
  }
}

function persist(): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...tickers]))
  } catch {
    // Quota or privacy-mode failures: tolerate silently. In-memory state stays
    // correct for the rest of the session.
  }
}

function notify(): void {
  for (const fn of listeners) fn()
}

/**
 * Returns a snapshot of the watchlist, sorted alphabetically for stable UI.
 */
export function getWatchlist(): string[] {
  init()
  return [...tickers].sort()
}

/** Case-insensitive watchlist membership check. */
export function isWatched(ticker: string): boolean {
  init()
  return tickers.has(ticker.toUpperCase())
}

/** Adds a ticker to the watchlist (idempotent). Persists + notifies on change. */
export function addToWatchlist(ticker: string): void {
  init()
  const t = ticker.toUpperCase()
  if (tickers.has(t)) return
  tickers.add(t)
  persist()
  notify()
}

/** Removes a ticker. No-op when not present. Persists + notifies on change. */
export function removeFromWatchlist(ticker: string): void {
  init()
  const t = ticker.toUpperCase()
  if (!tickers.has(t)) return
  tickers.delete(t)
  persist()
  notify()
}

/** Toggles a ticker in/out of the watchlist. */
export function toggleWatchlist(ticker: string): void {
  init()
  const t = ticker.toUpperCase()
  if (tickers.has(t)) {
    tickers.delete(t)
  } else {
    tickers.add(t)
  }
  persist()
  notify()
}

/**
 * Subscribes a listener to watchlist mutations. Returns an unsubscribe fn.
 * Used by `useWatchlist` so multiple components stay in sync within a tab.
 */
export function subscribeWatchlist(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
