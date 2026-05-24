/**
 * sessionAnchor — pure helpers that answer "when was the price's as-of
 * timestamp?" for non-open US-equity sessions.
 *
 *   - `lastSessionAnchorMs(state, now)` synthesizes a sensible anchor when
 *     the oracle quote does not carry one yet (closed → most-recent
 *     weekday 16:00 ET; after-hours → today's 16:00 ET; pre-market →
 *     today's 04:00 ET; halted/open/unknown → null).
 *   - `formatSessionAsOf(state, asOfMs)` renders the user-facing clause
 *     ("At close · May 22, 20:00 EDT", "Halted since 14:32 EDT", …).
 *
 * Both helpers are timezone-explicit: the format uses
 * `'America/New_York'` so a user in any region sees the US-equity
 * session anchor in the canonical Eastern Time label.
 */

const NEW_YORK_TZ = 'America/New_York'

function nyParts(ms: number): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  // Use Intl to obtain the calendar fields in America/New_York. Weekday is 0
  // for Sunday … 6 for Saturday so we can iterate to the previous business
  // day without re-implementing DST math.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false, weekday: 'short',
  })
  const parts = fmt.formatToParts(new Date(ms))
  const get = (t: string): string => parts.find(p => p.type === t)?.value ?? ''
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  }
}

// Build a UTC ms for a given calendar Y-M-D and the given Eastern Time
// hour, accounting for the current EDT/EST offset by binary-searching the
// ±1h slack window. The "correct" UTC for "10:00 ET on date D" is whichever
// candidate `Intl.formatToParts` round-trips back to that same wall-clock.
function newYorkWallClockToUtcMs(year: number, month: number, day: number, hour: number, minute: number): number {
  // Try an approximate UTC (assume EST = UTC−5, EDT = UTC−4) and adjust.
  // First-guess offset is −4 hours (EDT) — within ±1h regardless of DST.
  let guessMs = Date.UTC(year, month - 1, day, hour + 4, minute)
  // Refine by reading the Intl parts and walking back the actual offset.
  const probe = nyParts(guessMs)
  const wantedKey = `${year}-${month}-${day}-${hour}-${minute}`
  const probeKey = `${probe.year}-${probe.month}-${probe.day}-${probe.hour}-${probe.minute}`
  if (probeKey === wantedKey) return guessMs
  // DST: try ±1h.
  for (const deltaHours of [-1, 1]) {
    const candidate = guessMs + deltaHours * 3_600_000
    const probe2 = nyParts(candidate)
    if (`${probe2.year}-${probe2.month}-${probe2.day}-${probe2.hour}-${probe2.minute}` === wantedKey) {
      return candidate
    }
  }
  // No exact round-trip (e.g. DST spring-forward gap) — return the
  // best-effort EDT guess. This branch is unreachable for the
  // 04:00/16:00 ET anchors we synthesize.
  return guessMs
}

function mostRecentWeekdayCloseMs(ms: number): number {
  const parts = nyParts(ms)
  // Walk back day-by-day until we find a weekday whose 16:00 ET is <= now.
  for (let back = 0; back < 7; back++) {
    const trial = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - back, 12, 0))
    const trialParts = nyParts(trial.getTime())
    if (trialParts.weekday === 0 || trialParts.weekday === 6) continue
    const closeMs = newYorkWallClockToUtcMs(trialParts.year, trialParts.month, trialParts.day, 16, 0)
    if (closeMs <= ms) return closeMs
  }
  // Fallback: today's 16:00 ET even if it sits in the future. Practically
  // unreachable but keeps the return type non-nullable for callers.
  return newYorkWallClockToUtcMs(parts.year, parts.month, parts.day, 16, 0)
}

export function lastSessionAnchorMs(state: string, now: number = Date.now()): number | null {
  switch (state) {
    case 'closed':
      return mostRecentWeekdayCloseMs(now)
    case 'after-hours': {
      const p = nyParts(now)
      return newYorkWallClockToUtcMs(p.year, p.month, p.day, 16, 0)
    }
    case 'pre-market': {
      const p = nyParts(now)
      return newYorkWallClockToUtcMs(p.year, p.month, p.day, 4, 0)
    }
    default:
      return null
  }
}

const NY_DATETIME_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: NEW_YORK_TZ,
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short',
})

const NY_TIME_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: NEW_YORK_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short',
})

function formatNyDateTime(ms: number): string {
  // Intl typically prints "May 22, 20:00 EDT".
  return NY_DATETIME_FMT.format(new Date(ms))
}

function formatNyTime(ms: number): string {
  return NY_TIME_FMT.format(new Date(ms))
}

export function formatSessionAsOf(state: string, asOfMs: number): string | null {
  switch (state) {
    case 'closed':
      return `At close · ${formatNyDateTime(asOfMs)}`
    case 'after-hours':
      return `After hours since ${formatNyTime(asOfMs)}`
    case 'pre-market':
      return `Pre-market since ${formatNyTime(asOfMs)}`
    case 'halted':
      return `Halted since ${formatNyTime(asOfMs)}`
    default:
      return null
  }
}
