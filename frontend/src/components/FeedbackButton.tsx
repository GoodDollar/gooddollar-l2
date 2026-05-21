'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAccount } from 'wagmi'

import { buildFeedbackPayload, type FeedbackType } from '@/lib/feedbackContext'

import { readConsoleBuffer } from './ConsoleErrorCapture'

const FEEDBACK_TYPES: ReadonlyArray<{ value: FeedbackType; label: string }> = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'ux', label: '💡 UX Issue' },
  { value: 'feature', label: '✨ Feature Request' },
  { value: 'other', label: '💬 Other' },
]

/**
 * Lazily-allocated session id, cached in `sessionStorage` so it persists
 * across SPA navigations within a single tab. Falling back to a random id
 * means we never crash a private-mode browser that disallows storage.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const k = 'gd_feedback_sid'
    const existing = window.sessionStorage.getItem(k)
    if (existing) return existing
    const fresh =
      'sid_' +
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
        : Math.random().toString(36).slice(2, 18))
    window.sessionStorage.setItem(k, fresh)
    return fresh
  } catch {
    return 'sid_' + Math.random().toString(36).slice(2, 18)
  }
}

function getBuildSha(): string {
  return process.env.NEXT_PUBLIC_BUILD_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev'
}

function isStocksRoute(pathname: string): boolean {
  return pathname === '/stocks' || pathname.startsWith('/stocks/')
}

export function getFeedbackButtonClasses(pathname: string): { button: string; dialog: string; label: string } {
  const stocks = isStocksRoute(pathname)
  if (!stocks) {
    return {
      button: 'fixed bottom-6 right-6 z-50 bg-accent hover:bg-accent/80 text-dark font-semibold px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm',
      dialog: 'fixed bottom-6 right-6 z-50 w-80 bg-dark-50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
      label: 'hidden sm:inline',
    }
  }
  return {
    button: 'fixed bottom-4 right-3 sm:bottom-5 sm:right-4 z-50 bg-accent hover:bg-accent/80 text-dark font-semibold px-3.5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm',
    dialog: 'fixed bottom-4 right-3 sm:bottom-5 sm:right-4 z-50 w-[min(20rem,calc(100vw-1.5rem))] sm:w-80 bg-dark-50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
    label: 'hidden xl:inline',
  }
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [desc, setDesc] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname() ?? '/'
  const { address } = useAccount()
  const classes = getFeedbackButtonClasses(pathname)

  const submit = useCallback(async () => {
    if (!desc.trim()) return
    setSending(true)
    setError(null)
    try {
      const payload = buildFeedbackPayload(type, desc, {
        pathname,
        wallet: address ?? null,
        viewport: {
          w: typeof window !== 'undefined' ? window.innerWidth : 0,
          h: typeof window !== 'undefined' ? window.innerHeight : 0,
          dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        },
        sessionId: getSessionId(),
        buildSha: getBuildSha(),
        recentConsole: readConsoleBuffer(),
      })
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        setError('Failed to submit. Please try again.')
        return
      }
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setDesc('')
        setType('bug')
      }, 2000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }, [type, desc, pathname, address])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={classes.button}
        aria-label="Send feedback"
        data-testid="feedback-open"
      >
        <span>💬</span>
        <span className={classes.label}>Feedback</span>
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-label="Send feedback"
      className={classes.dialog}
      data-testid="feedback-dialog"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-semibold text-sm">Send Feedback</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close feedback"
        >
          ✕
        </button>
      </div>

      {sent ? (
        <div className="p-6 text-center" data-testid="feedback-sent">
          <p className="text-accent text-lg font-semibold">Thanks! 🎉</p>
          <p className="text-gray-400 text-sm mt-1">Your feedback has been recorded.</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  type === value
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
                data-testid={`feedback-type-${value}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Description */}
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the issue or suggestion..."
            rows={4}
            className="w-full bg-dark border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-accent/50 resize-none"
            data-testid="feedback-description"
            aria-label="Feedback description"
          />

          {error && (
            <p className="text-red-400 text-xs" role="alert" data-testid="feedback-error">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={!desc.trim() || sending}
            className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-dark font-semibold py-2 rounded-lg text-sm transition-colors"
            data-testid="feedback-submit"
          >
            {sending ? 'Sending...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
