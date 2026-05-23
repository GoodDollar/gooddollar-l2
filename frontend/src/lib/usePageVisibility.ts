/**
 * Shared page-visibility helper for polling hooks.
 *
 * A single module-level listener fans out to N subscribers — avoids each
 * polling hook registering its own document/window event handlers and lets
 * hidden tabs pause cleanly without bookkeeping per consumer.
 *
 * Returns a primitive boolean (hidden vs not) instead of the full
 * visibilityState string, because consumers only need to gate "should I do
 * work right now". Treats anything other than 'visible' (including
 * 'prerender') as hidden.
 *
 * Listens to both `document.visibilitychange` (desktop tab switch) and
 * `window.pagehide`/`pageshow` (mobile Safari/Firefox bfcache).
 */

type Listener = (hidden: boolean) => void

const subscribers = new Set<Listener>()
let attached = false

function readHidden(): boolean {
  if (typeof document === 'undefined') return false
  if (typeof document.visibilityState === 'string') {
    return document.visibilityState !== 'visible'
  }
  return Boolean(document.hidden)
}

function notify(): void {
  const hidden = readHidden()
  for (const fn of subscribers) fn(hidden)
}

function attach(): void {
  if (attached || typeof document === 'undefined') return
  document.addEventListener('visibilitychange', notify)
  window.addEventListener('pageshow', notify)
  window.addEventListener('pagehide', notify)
  attached = true
}

function detach(): void {
  if (!attached || typeof document === 'undefined') return
  document.removeEventListener('visibilitychange', notify)
  window.removeEventListener('pageshow', notify)
  window.removeEventListener('pagehide', notify)
  attached = false
}

export function subscribePageVisibility(fn: Listener): () => void {
  subscribers.add(fn)
  attach()
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) detach()
  }
}

export function isPageHidden(): boolean {
  return readHidden()
}

export function __resetPageVisibilityForTests(): void {
  subscribers.clear()
  detach()
}
