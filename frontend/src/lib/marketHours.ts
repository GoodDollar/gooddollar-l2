export type MarketState = 'open' | 'pre-market' | 'after-hours' | 'closed'

export interface MarketSession {
  label: string
  state: MarketState
  color: string
  dotColor: string
  nextEventLabel: string
  nextEventDate: Date | null
}

const ET_OFFSET = -5

function toET(utc: Date): Date {
  const d = new Date(utc)
  d.setHours(d.getHours() + ET_OFFSET)
  return d
}

function hhmm(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

const US_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
  '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07',
  '2026-11-26', '2026-12-25',
]

function isUSHoliday(et: Date): boolean {
  const iso = `${et.getUTCFullYear()}-${String(et.getUTCMonth() + 1).padStart(2, '0')}-${String(et.getUTCDate()).padStart(2, '0')}`
  return US_HOLIDAYS_2026.includes(iso)
}

export function getMarketSession(now = new Date()): MarketSession {
  const et = toET(now)
  const day = et.getUTCDay()
  const min = hhmm(et)

  const isWeekend = day === 0 || day === 6
  const isHoliday = isUSHoliday(et)

  if (isWeekend || isHoliday) {
    return {
      label: 'Market Closed',
      state: 'closed',
      color: 'text-gray-400',
      dotColor: 'bg-gray-400',
      nextEventLabel: 'Opens Mon',
      nextEventDate: null,
    }
  }

  const PRE_OPEN = 4 * 60
  const OPEN = 9 * 60 + 30
  const CLOSE = 16 * 60
  const AFTER_CLOSE = 20 * 60

  if (min >= OPEN && min < CLOSE) {
    return {
      label: 'Market Open',
      state: 'open',
      color: 'text-green-400',
      dotColor: 'bg-green-400',
      nextEventLabel: 'Closes 4:00 PM ET',
      nextEventDate: null,
    }
  }

  if (min >= PRE_OPEN && min < OPEN) {
    return {
      label: 'Pre-Market',
      state: 'pre-market',
      color: 'text-yellow-400',
      dotColor: 'bg-yellow-400',
      nextEventLabel: 'Opens 9:30 AM ET',
      nextEventDate: null,
    }
  }

  if (min >= CLOSE && min < AFTER_CLOSE) {
    return {
      label: 'After-Hours',
      state: 'after-hours',
      color: 'text-yellow-400',
      dotColor: 'bg-yellow-400',
      nextEventLabel: 'Closes 8:00 PM ET',
      nextEventDate: null,
    }
  }

  return {
    label: 'Market Closed',
    state: 'closed',
    color: 'text-gray-400',
    dotColor: 'bg-gray-400',
    nextEventLabel: min < PRE_OPEN ? 'Pre-market 4:00 AM ET' : 'Opens tomorrow',
    nextEventDate: null,
  }
}
