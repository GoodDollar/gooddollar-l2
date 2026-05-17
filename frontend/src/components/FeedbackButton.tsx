'use client'

import { useState, useCallback } from 'react'

const FEEDBACK_TYPES = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'ux', label: '💡 UX Issue' },
  { value: 'feature', label: '✨ Feature Request' },
  { value: 'other', label: '💬 Other' },
] as const

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('bug')
  const [desc, setDesc] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = useCallback(async () => {
    if (!desc.trim()) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description: desc,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setDesc('')
        setType('bug')
      }, 2000)
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }, [type, desc])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-accent hover:bg-accent/80 text-dark font-semibold px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
        aria-label="Send feedback"
      >
        <span>💬</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-dark-50 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
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
        <div className="p-6 text-center">
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
          />

          {/* Submit */}
          <button
            onClick={submit}
            disabled={!desc.trim() || sending}
            className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-dark font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {sending ? 'Sending...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
