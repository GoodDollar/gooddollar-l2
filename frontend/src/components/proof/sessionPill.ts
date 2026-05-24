/**
 * sessionPill — case-insensitive lookup that maps an instrument's
 * sessionState string to a Tailwind class string for its on-page chip.
 *
 * The price-service feed emits lowercase strings (`open`, `closed`)
 * while the on-chain oracle decoder uses capitalised labels
 * (`Open`, `Closed`, `Halted`, `PreMarket`, `AfterHours`). Lower-case
 * the input so the two callers share one source of truth, and so
 * minor punctuation variants (`pre-market`, `after-hours`) still map
 * to the right colour.
 *
 * Colour vocabulary matches the page's existing semantic ramp:
 * green for live, neutral gray for closed, yellow for pre/after,
 * red for halted (a trading-alarm condition).
 */

export function sessionPillClass(session: string): string {
  const s = session.toLowerCase()
  if (s === 'open') return 'bg-green-500/10 text-green-300 ring-1 ring-green-500/20'
  if (s === 'closed') return 'bg-white/5 text-gray-400 ring-1 ring-white/10'
  if (s === 'premarket' || s === 'pre-market' || s === 'afterhours' || s === 'after-hours') {
    return 'bg-yellow-500/10 text-yellow-200 ring-1 ring-yellow-500/20'
  }
  if (s === 'halted') return 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30'
  return 'bg-white/5 text-gray-300 ring-1 ring-white/10'
}
