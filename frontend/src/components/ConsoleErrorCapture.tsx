'use client'

import { useEffect } from 'react'

import type { ConsoleEntry } from '@/lib/feedbackContext'

/**
 * Mounts once at the root of the app and patches `console.error` /
 * `console.warn` so the last N entries are accessible to the feedback
 * dialog via `window.__feedbackConsoleBuffer`.
 *
 * Design notes:
 *   - Patching, not subscribing: there is no DOM API for "subscribe to
 *     console messages", and a global `error` listener only catches uncaught
 *     exceptions, not the dev/runtime warnings we actually care about
 *     (e.g. wagmi or RainbowKit complaints).
 *   - Bounded ring buffer (capped at 20 entries) so a noisy page cannot
 *     leak memory.
 *   - Idempotent: re-mounting (React 18 dev double-effects, fast refresh)
 *     never installs the patch twice.
 *   - Side-effect-free for server-rendering: the effect only runs in the
 *     browser.
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0040-iter29-feedback-pipeline.md
 */

const MAX_ENTRIES = 20

declare global {
  interface Window {
    __feedbackConsoleBuffer?: ConsoleEntry[]
    __feedbackConsolePatched?: boolean
  }
}

export function ConsoleErrorCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.__feedbackConsolePatched) return

    const buffer: ConsoleEntry[] = window.__feedbackConsoleBuffer ?? []
    window.__feedbackConsoleBuffer = buffer
    window.__feedbackConsolePatched = true

    const origError = console.error.bind(console)
    const origWarn = console.warn.bind(console)

    const stringifyArgs = (args: unknown[]): string => {
      try {
        return args
          .map((a) => {
            if (a instanceof Error) return a.message
            if (typeof a === 'string') return a
            try {
              return JSON.stringify(a)
            } catch {
              return String(a)
            }
          })
          .join(' ')
      } catch {
        return '[unserializable console args]'
      }
    }

    const push = (level: 'error' | 'warn', args: unknown[]) => {
      buffer.push({ level, message: stringifyArgs(args), at: new Date().toISOString() })
      if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES)
    }

    console.error = (...args: unknown[]) => {
      push('error', args)
      origError(...args)
    }
    console.warn = (...args: unknown[]) => {
      push('warn', args)
      origWarn(...args)
    }
    // Intentionally no teardown: the patch outlives the mount, otherwise
    // React dev mode's double-effect cycle would reinstall it twice.
  }, [])

  return null
}

/**
 * Reads a defensive snapshot of the current console ring buffer.
 * Safe to call from any client component; returns `[]` on the server.
 */
export function readConsoleBuffer(): ConsoleEntry[] {
  if (typeof window === 'undefined') return []
  const buf = window.__feedbackConsoleBuffer
  return buf ? buf.slice() : []
}
