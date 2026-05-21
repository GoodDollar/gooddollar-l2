import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Helper: reset the in-memory module + LocalStorage between tests.
// We use dynamic imports so we can reset module state and re-trigger `init()`.
async function freshModule() {
  vi.resetModules()
  return await import('@/lib/watchlist')
}

describe('watchlist (lib/watchlist.ts) — task 0034', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('starts empty when LocalStorage has no entry', async () => {
    const wl = await freshModule()
    expect(wl.getWatchlist()).toEqual([])
    expect(wl.isWatched('AAPL')).toBe(false)
  })

  it('addToWatchlist persists and upper-cases the ticker', async () => {
    const wl = await freshModule()
    wl.addToWatchlist('aapl')
    expect(wl.isWatched('AAPL')).toBe(true)
    expect(wl.isWatched('aapl')).toBe(true) // case-insensitive read
    expect(wl.getWatchlist()).toEqual(['AAPL'])
    expect(localStorage.getItem('gooddollar.stocks.watchlist.v1')).toBe(
      JSON.stringify(['AAPL']),
    )
  })

  it('addToWatchlist is idempotent', async () => {
    const wl = await freshModule()
    wl.addToWatchlist('AAPL')
    wl.addToWatchlist('AAPL')
    wl.addToWatchlist('aapl')
    expect(wl.getWatchlist()).toEqual(['AAPL'])
  })

  it('removeFromWatchlist removes an existing ticker', async () => {
    const wl = await freshModule()
    wl.addToWatchlist('AAPL')
    wl.addToWatchlist('NVDA')
    wl.removeFromWatchlist('AAPL')
    expect(wl.isWatched('AAPL')).toBe(false)
    expect(wl.isWatched('NVDA')).toBe(true)
    expect(wl.getWatchlist()).toEqual(['NVDA'])
  })

  it('removeFromWatchlist is a no-op for an absent ticker', async () => {
    const wl = await freshModule()
    wl.addToWatchlist('AAPL')
    wl.removeFromWatchlist('TSLA') // not present — should not throw
    expect(wl.getWatchlist()).toEqual(['AAPL'])
  })

  it('toggleWatchlist adds then removes', async () => {
    const wl = await freshModule()
    wl.toggleWatchlist('TSLA')
    expect(wl.isWatched('TSLA')).toBe(true)
    wl.toggleWatchlist('TSLA')
    expect(wl.isWatched('TSLA')).toBe(false)
    expect(wl.getWatchlist()).toEqual([])
  })

  it('getWatchlist returns tickers sorted alphabetically (stable UI)', async () => {
    const wl = await freshModule()
    wl.addToWatchlist('NVDA')
    wl.addToWatchlist('AAPL')
    wl.addToWatchlist('TSLA')
    expect(wl.getWatchlist()).toEqual(['AAPL', 'NVDA', 'TSLA'])
  })

  it('persists across module reloads (LocalStorage rehydrate)', async () => {
    // First module instance: write some state.
    const wlA = await freshModule()
    wlA.addToWatchlist('AAPL')
    wlA.addToWatchlist('NVDA')

    // Second module instance (simulated fresh page-load): should rehydrate.
    vi.resetModules()
    const wlB = await import('@/lib/watchlist')
    expect(wlB.getWatchlist()).toEqual(['AAPL', 'NVDA'])
    expect(wlB.isWatched('AAPL')).toBe(true)
    expect(wlB.isWatched('NVDA')).toBe(true)
  })

  it('tolerates malformed LocalStorage payloads (defaults to empty list)', async () => {
    localStorage.setItem('gooddollar.stocks.watchlist.v1', '{not-json')
    const wl = await freshModule()
    expect(wl.getWatchlist()).toEqual([])
    // And subsequent writes still succeed.
    wl.addToWatchlist('AAPL')
    expect(wl.getWatchlist()).toEqual(['AAPL'])
  })

  it('subscribeWatchlist invokes subscribers on mutation and unsubscribe stops them', async () => {
    const wl = await freshModule()
    const fn = vi.fn()
    const unsub = wl.subscribeWatchlist(fn)
    wl.addToWatchlist('AAPL')
    wl.toggleWatchlist('NVDA')
    expect(fn).toHaveBeenCalledTimes(2)
    unsub()
    wl.addToWatchlist('TSLA')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('SSR-safe: helpers do not throw when window is undefined', async () => {
    // Save originals
    const origWindow = globalThis.window
    const origLocalStorage = globalThis.localStorage
    // Simulate SSR: remove window + localStorage from globalThis
    // @ts-expect-error — deliberately removing for SSR simulation
    delete globalThis.window
    // @ts-expect-error — deliberately removing for SSR simulation
    delete globalThis.localStorage

    try {
      const wl = await freshModule()
      // None of these should throw in SSR. In-memory state may still mutate
      // (which is harmless during render), but no LocalStorage access happens.
      expect(() => wl.getWatchlist()).not.toThrow()
      expect(() => wl.isWatched('AAPL')).not.toThrow()
      expect(() => wl.addToWatchlist('AAPL')).not.toThrow()
      expect(() => wl.removeFromWatchlist('AAPL')).not.toThrow()
      expect(() => wl.toggleWatchlist('AAPL')).not.toThrow()
    } finally {
      globalThis.window = origWindow
      globalThis.localStorage = origLocalStorage
    }
  })
})
