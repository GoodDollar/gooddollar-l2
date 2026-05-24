'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  useSwapSettings,
  SWAP_SETTINGS_DEFAULTS,
  classifySlippageInput,
  MIN_USEFUL_SLIPPAGE,
  MAX_SLIPPAGE,
  type SlippageDecision,
} from '@/lib/useSwapSettings'

const PRESETS = [0.1, 0.5, 1.0]

export function SwapSettings() {
  const {
    slippage,
    deadline,
    setSlippage,
    setDeadline,
    suggestion,
    applySuggestion,
  } = useSwapSettings()
  const [open, setOpen] = useState(false)
  const [customSlippage, setCustomSlippage] = useState('')
  // Task 0049 — `decision` is the single source of truth for what the
  // visible custom-slippage input "means". Renderer dispatches off
  // `decision.kind` for border colour, warning text, preset highlight,
  // and whether to call `setSlippage`.
  const [decision, setDecision] = useState<SlippageDecision>({ kind: 'blank' })
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Reset the local decision when the popover closes so reopening starts
  // from a clean state — otherwise a stale "invalid-zero" warning could
  // hang around.
  useEffect(() => {
    if (!open) {
      setDecision({ kind: 'blank' })
      setCustomSlippage('')
    }
  }, [open])

  const handleSlippageChange = useCallback((raw: string) => {
    const next = classifySlippageInput(raw)
    setDecision(next)
    switch (next.kind) {
      case 'blank':
        setCustomSlippage('')
        return
      case 'invalid-zero':
        // Keep whatever the user typed visible (e.g. "0", "0.00") so the
        // mismatch with the green preset chip is obvious. We do NOT
        // call `setSlippage` — the preset stays unchanged in storage.
        setCustomSlippage(raw)
        return
      case 'clamped-max':
        setCustomSlippage(String(MAX_SLIPPAGE))
        setSlippage(MAX_SLIPPAGE)
        return
      case 'low':
      case 'ok':
      case 'high-risk':
        setCustomSlippage(raw)
        setSlippage(next.value)
        return
    }
  }, [setSlippage])

  // Preset chip stays highlighted only when the stored value matches AND
  // the user has not typed an invalid-zero into the custom field.
  const isPreset = PRESETS.includes(slippage)
  const presetActive = isPreset && decision.kind !== 'invalid-zero'

  // Task 0048 — non-default detection drives the small accent dot on the
  // gear icon and the descriptive aria-label so users (and screen
  // readers) can tell at a glance whether their settings differ from the
  // defaults without opening the popover.
  const isNonDefault =
    slippage !== SWAP_SETTINGS_DEFAULTS.slippage ||
    deadline !== SWAP_SETTINGS_DEFAULTS.deadline
  const minutesLabel = deadline === 1 ? 'minute' : 'minutes'
  const ariaLabel = `Swap settings — slippage ${slippage}%, deadline ${deadline} ${minutesLabel}`

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {isNonDefault && (
          <span
            data-testid="settings-non-default-dot"
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-goodgreen"
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-100 border border-gray-700/50 rounded-xl shadow-2xl z-50 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Transaction Settings</h3>

          <div className="mb-4">
            <label htmlFor="slippage-custom" className="text-xs text-gray-400 mb-2 block">Slippage Tolerance</label>
            <div className="flex gap-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSlippage(p)
                    setCustomSlippage('')
                    setDecision({ kind: 'blank' })
                  }}
                  aria-pressed={presetActive && slippage === p}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none ${
                    slippage === p && presetActive
                      ? 'bg-goodgreen/10 text-goodgreen border border-goodgreen/40'
                      : 'bg-dark-50 text-gray-300 border border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  {p}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  id="slippage-custom"
                  type="text"
                  inputMode="decimal"
                  placeholder="Custom"
                  aria-label="Custom slippage tolerance percentage"
                  aria-invalid={decision.kind === 'invalid-zero'}
                  value={customSlippage}
                  onChange={e => handleSlippageChange(e.target.value)}
                  className={`w-full py-1.5 px-2 rounded-lg text-sm text-right bg-dark-50 border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${
                    decision.kind === 'invalid-zero'
                      ? 'border-amber-500/50 text-amber-300'
                      : decision.kind === 'clamped-max'
                        ? 'border-orange-500/50 text-orange-300'
                        : !isPreset && slippage > 0
                          ? 'border-goodgreen/40 text-goodgreen'
                          : 'border-gray-700/50 text-gray-300'
                  }`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
              </div>
            </div>

            {/* Inline warning row immediately below the input — driven off
                the decision so visible value and stored value always agree
                or surface an explicit reason for the mismatch. */}
            {decision.kind === 'invalid-zero' && (
              <p
                role="alert"
                data-testid="slippage-invalid-zero-warning"
                className="text-xs text-amber-400 mt-1.5"
              >
                Slippage must be greater than 0 — choose a preset or enter a value &gt; 0.
              </p>
            )}
            {decision.kind === 'low' && (
              <p
                role="status"
                data-testid="slippage-low-warning"
                className="text-xs text-yellow-400 mt-1.5"
              >
                Slippage below {MIN_USEFUL_SLIPPAGE}% — most trades will fail. Did you mean 0.5%?
              </p>
            )}
            {decision.kind === 'high-risk' && (
              <p className="text-xs text-yellow-400 mt-1.5">High slippage increases risk of front-running</p>
            )}
            {decision.kind === 'clamped-max' && (
              <p className="text-xs text-orange-400 mt-1.5">Maximum slippage is {MAX_SLIPPAGE}%</p>
            )}
            {/* Existing high-risk-from-stored-state branch — keeps the
                warning visible when the user previously saved >5% and
                hasn't touched the input this session. */}
            {decision.kind === 'blank' && slippage > 5 && (
              <p className="text-xs text-yellow-400 mt-1.5">High slippage increases risk of front-running</p>
            )}

            {/* Smart Suggestion lives below the warning row so it never
                gets lost behind a max-warning when the two co-occur. */}
            {suggestion && decision.kind !== 'clamped-max' && (
              <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-300 flex-1">{suggestion}</p>
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="ml-2 px-2 py-1 text-xs text-blue-300 hover:text-white border border-blue-500/30 rounded hover:bg-blue-500/20 transition-colors focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:outline-none"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="deadline-minutes" className="text-xs text-gray-400 mb-2 block">Transaction Deadline</label>
            <div className="flex items-center gap-2">
              <input
                id="deadline-minutes"
                type="text"
                inputMode="numeric"
                placeholder="1–180"
                aria-label="Transaction deadline in minutes"
                value={deadline}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  if (!raw) return
                  const num = parseInt(raw, 10)
                  if (!isNaN(num)) setDeadline(num)
                }}
                className="w-16 py-1.5 px-2 rounded-lg text-sm text-center bg-dark-50 border border-gray-700/50 text-white outline-none focus:border-goodgreen/40 focus-visible:ring-2 focus-visible:ring-goodgreen/50 transition-colors"
              />
              <span className="text-xs text-gray-400">minutes</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Min 1, max 180 minutes</p>
          </div>
        </div>
      )}
    </div>
  )
}
