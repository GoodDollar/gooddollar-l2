'use client'

import { useState, useCallback, useEffect } from 'react'
import { sanitizeNumericInput } from './format'

const STORAGE_KEY = 'goodswap-settings'
const HISTORY_KEY = 'goodswap-transaction-history'

interface SwapSettings {
  slippage: number
  deadline: number
}

interface TransactionRecord {
  settings: SwapSettings
  success: boolean
  timestamp: number
  tokenPair: string
  amount: number
}

interface UserPreferences {
  settings: SwapSettings
  history: TransactionRecord[]
  suggestions?: {
    recommendedSlippage?: number
    confidence?: number
  }
}

/**
 * Public default settings — exported so the UI can detect "non-default"
 * configurations and surface a small accent dot on the gear icon
 * (task 0048). Internal helpers below still reference `DEFAULTS` by name.
 */
export const SWAP_SETTINGS_DEFAULTS: SwapSettings = {
  slippage: 0.5,
  deadline: 30,
}

const DEFAULTS = SWAP_SETTINGS_DEFAULTS

function loadPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { settings: DEFAULTS, history: [] }
  }

  try {
    // Load current settings
    const settingsRaw = localStorage.getItem(STORAGE_KEY)
    const settings = settingsRaw ? JSON.parse(settingsRaw) : DEFAULTS

    // Load transaction history
    const historyRaw = localStorage.getItem(HISTORY_KEY)
    const history = historyRaw ? JSON.parse(historyRaw) : []

    // Clean old history (keep last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentHistory = history.filter((record: TransactionRecord) =>
      record.timestamp > thirtyDaysAgo
    )

    return {
      settings: {
        slippage: typeof settings.slippage === 'number' ? settings.slippage : DEFAULTS.slippage,
        deadline: typeof settings.deadline === 'number' ? settings.deadline : DEFAULTS.deadline,
      },
      history: recentHistory,
      suggestions: analyzeUserPreferences(recentHistory)
    }
  } catch {
    return { settings: DEFAULTS, history: [] }
  }
}

function analyzeUserPreferences(history: TransactionRecord[]): { recommendedSlippage?: number; confidence?: number } {
  if (history.length < 3) return {} // Need at least 3 transactions for patterns

  // Group by success rate for different slippage ranges
  const slippageGroups = {
    low: history.filter(r => r.settings.slippage <= 0.5),
    medium: history.filter(r => r.settings.slippage > 0.5 && r.settings.slippage <= 1.0),
    high: history.filter(r => r.settings.slippage > 1.0),
  }

  // Calculate success rates
  const successRates = Object.entries(slippageGroups).map(([range, records]) => ({
    range,
    successRate: records.length > 0 ? records.filter(r => r.success).length / records.length : 0,
    count: records.length,
    avgSlippage: records.length > 0 ? records.reduce((sum, r) => sum + r.settings.slippage, 0) / records.length : 0
  })).filter(group => group.count >= 2) // Only consider groups with at least 2 transactions

  if (successRates.length === 0) return {}

  // Find the range with best success rate
  const bestRange = successRates.reduce((best, current) =>
    current.successRate > best.successRate ? current : best
  )

  // Only suggest if there's a clear pattern (>80% success rate with reasonable sample size)
  if (bestRange.successRate >= 0.8 && bestRange.count >= 3) {
    return {
      recommendedSlippage: Math.round(bestRange.avgSlippage * 10) / 10, // Round to 1 decimal
      confidence: Math.min(0.95, bestRange.successRate * (bestRange.count / 10)) // Higher confidence with more data
    }
  }

  return {}
}

function clampSlippage(val: number): number {
  return Math.max(0, Math.min(50, val))
}

// ─── Slippage input classification (task 0049) ───────────────────────────────
//
// The custom slippage input previously had three silent failure modes:
// `0`, blank, and garbage all skipped `setSlippage` without telling the user
// the typed value was discarded. Visible value ≠ stored value, no warning.
// This tagged-union classifier replaces the ad-hoc if-chain so every input
// class has an explicit decision and the renderer is a pure dispatch on
// `decision.kind`.
//
// Boundaries:
//   - MIN_USEFUL_SLIPPAGE  (0.05%)  — below this almost every trade will
//     fail to settle. Yellow warning, but the value IS accepted.
//   - HIGH_SLIPPAGE_THRESHOLD (5%) — above this the existing high-risk
//     copy fires. Yellow warning, value accepted.
//   - MAX_SLIPPAGE  (50%)         — clamped to 50, orange warning.

export const MIN_USEFUL_SLIPPAGE = 0.05
export const HIGH_SLIPPAGE_THRESHOLD = 5
export const MAX_SLIPPAGE = 50

export type SlippageDecision =
  | { kind: 'blank' }
  | { kind: 'invalid-zero' }
  | { kind: 'low'; value: number }
  | { kind: 'ok'; value: number }
  | { kind: 'high-risk'; value: number }
  | { kind: 'clamped-max' }

/**
 * Pure classifier — given a raw input string from the slippage textbox,
 * return the single source of truth for what the input "means". Renderer
 * branches off `decision.kind` so visible value, border colour, warning
 * text, and `setSlippage(value)` all stay consistent.
 *
 * This file's contract is: NEVER emit a decision whose stored slippage
 * differs from what the visible input value says, without also signalling
 * that mismatch via an explicit `kind` (e.g. `clamped-max`, `invalid-zero`).
 */
export function classifySlippageInput(raw: string): SlippageDecision {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '.') return { kind: 'blank' }
  if (trimmed.startsWith('-')) return { kind: 'invalid-zero' }
  const cleaned = sanitizeNumericInput(raw).trim()
  if (!cleaned || cleaned === '.') return { kind: 'blank' }
  const num = parseFloat(cleaned)
  if (!Number.isFinite(num)) return { kind: 'blank' }
  if (num <= 0) return { kind: 'invalid-zero' }
  if (num > MAX_SLIPPAGE) return { kind: 'clamped-max' }
  if (num < MIN_USEFUL_SLIPPAGE) return { kind: 'low', value: num }
  if (num > HIGH_SLIPPAGE_THRESHOLD) return { kind: 'high-risk', value: num }
  return { kind: 'ok', value: num }
}

export function useSwapSettings() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.settings))
      if (preferences.history.length > 0) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(preferences.history))
      }
    } catch { /* quota exceeded or SSR */ }
  }, [preferences])

  const setSlippage = useCallback((val: number) => {
    setPreferences(prev => ({
      ...prev,
      settings: { ...prev.settings, slippage: clampSlippage(val) }
    }))
  }, [])

  const setDeadline = useCallback((val: number) => {
    setPreferences(prev => ({
      ...prev,
      settings: { ...prev.settings, deadline: Math.max(1, Math.min(180, val)) }
    }))
  }, [])

  const recordTransaction = useCallback((
    success: boolean,
    tokenPair: string,
    amount: number
  ) => {
    const record: TransactionRecord = {
      settings: { ...preferences.settings },
      success,
      timestamp: Date.now(),
      tokenPair,
      amount
    }

    setPreferences(prev => {
      const newHistory = [...prev.history, record]
      return {
        ...prev,
        history: newHistory,
        suggestions: analyzeUserPreferences(newHistory)
      }
    })
  }, [preferences.settings])

  const applySuggestion = useCallback(() => {
    if (preferences.suggestions?.recommendedSlippage) {
      setSlippage(preferences.suggestions.recommendedSlippage)
    }
  }, [preferences.suggestions?.recommendedSlippage, setSlippage])

  const getSuggestionText = useCallback((): string | null => {
    const { suggestions } = preferences
    if (!suggestions?.recommendedSlippage || !suggestions.confidence) return null

    const currentSlippage = preferences.settings.slippage
    const recommended = suggestions.recommendedSlippage
    const confidence = Math.round(suggestions.confidence * 100)

    if (Math.abs(currentSlippage - recommended) < 0.1) return null // Already using optimal setting

    if (recommended < currentSlippage) {
      return `Try ${recommended}% slippage for better success rate (${confidence}% confidence)`
    } else {
      return `Consider ${recommended}% slippage for fewer failed trades (${confidence}% confidence)`
    }
  }, [preferences])

  return {
    slippage: preferences.settings.slippage,
    deadline: preferences.settings.deadline,
    setSlippage,
    setDeadline,
    recordTransaction,
    applySuggestion,
    suggestion: getSuggestionText(),
    hasLearning: preferences.history.length >= 3,
  }
}
