export interface OHLCData {
  time: string | number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface TimeframeConfig {
  points: number
  intervalMs: number
  useTimestamp: boolean
}

const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
  '1D': { points: 24, intervalMs: 3_600_000, useTimestamp: true },
  '1W': { points: 28, intervalMs: 6 * 3_600_000, useTimestamp: true },
  '1M': { points: 30, intervalMs: 86_400_000, useTimestamp: false },
  '3M': { points: 90, intervalMs: 86_400_000, useTimestamp: false },
  '6M': { points: 180, intervalMs: 86_400_000, useTimestamp: false },
  '1Y': { points: 365, intervalMs: 86_400_000, useTimestamp: false },
  // 5Y / ALL are sampled at coarser cadence so candle count stays manageable
  // while the visible time span still reads as multi-year. 260 ≈ weekly bars
  // for 5 years; 240 ≈ monthly bars for 20 years.
  '5Y': { points: 260, intervalMs: 7 * 86_400_000, useTimestamp: false },
  'ALL': { points: 240, intervalMs: 30 * 86_400_000, useTimestamp: false },
}

function generateOHLC(basePrice: number, config: TimeframeConfig, volatility: number = 0.02): OHLCData[] {
  const { points, intervalMs, useTimestamp } = config
  const data: OHLCData[] = []
  const nowMs = Date.now()

  const prices: number[] = [basePrice]
  for (let i = 1; i < points; i++) {
    const prev = prices[0]
    const change = (Math.random() - 0.52) * volatility * prev
    prices.unshift(prev - change)
  }

  for (let i = 0; i < points; i++) {
    const candleMs = nowMs - (points - 1 - i) * intervalMs
    const time: string | number = useTimestamp
      ? Math.floor(candleMs / 1000)
      : new Date(candleMs).toISOString().split('T')[0]

    const close = prices[i]
    const open = i > 0 ? prices[i - 1] : close * (1 + (Math.random() - 0.5) * volatility)
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    const volume = Math.floor(1_000_000 + Math.random() * 50_000_000)

    data.push({ time, open, high, low, close, volume })
  }

  return data
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'

interface LastCandleAnchor {
  time: string | number
  open: number
  volume: number
  // Multiplicative wick factors (≥ 0) used to derive high/low from
  // max(open, close) and min(open, close). Frozen at first generation so
  // the live-tracking last candle keeps a realistic, stable shape.
  wickUp: number
  wickDown: number
  // Fallback close used if a non-finite or non-positive basePrice is passed.
  lastValidClose: number
}

interface CachedSeries {
  // Candles 0..N-2 — frozen history. Never mutated after first generation.
  history: OHLCData[]
  // Per-entry anchor used to recompute the right-most candle from the
  // current live basePrice on every call.
  anchor: LastCandleAnchor
}

const CHART_CACHE = new Map<string, Map<Timeframe, CachedSeries>>()

function buildAnchorFromCandle(candle: OHLCData): LastCandleAnchor {
  const hiBase = Math.max(candle.open, candle.close)
  const loBase = Math.min(candle.open, candle.close)
  // Recover the wick factors that produced this candle so we can reapply
  // them when basePrice changes. Clamp to ≥ 0 so a degenerate generated
  // candle (open === close, no wick) can't poison subsequent recomputes.
  const wickUp = hiBase > 0 ? Math.max(0, candle.high / hiBase - 1) : 0
  const wickDown = loBase > 0 ? Math.max(0, 1 - candle.low / loBase) : 0
  return {
    time: candle.time,
    open: candle.open,
    volume: candle.volume,
    wickUp,
    wickDown,
    lastValidClose: candle.close,
  }
}

function buildLastCandle(anchor: LastCandleAnchor, basePrice: number): OHLCData {
  // Guard against NaN / Infinity / non-positive prices — keep the cached
  // close so the chart never renders a corrupted candle.
  const close = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : anchor.lastValidClose
  const hiBase = Math.max(anchor.open, close)
  const loBase = Math.min(anchor.open, close)
  return {
    time: anchor.time,
    open: anchor.open,
    high: hiBase * (1 + anchor.wickUp),
    low: loBase * (1 - anchor.wickDown),
    close,
    volume: anchor.volume,
  }
}

export function getChartData(symbol: string, timeframe: Timeframe, basePrice: number): OHLCData[] {
  let symbolCache = CHART_CACHE.get(symbol)
  if (!symbolCache) {
    symbolCache = new Map()
    CHART_CACHE.set(symbol, symbolCache)
  }

  let entry = symbolCache.get(timeframe)
  if (!entry) {
    // Use the current basePrice (when finite/positive) as the generation
    // anchor so initial render of the right-most candle matches the live
    // oracle price exactly. Otherwise fall back to 1 to keep generation
    // deterministic-ish and non-degenerate.
    const seedPrice = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : 1
    const generated = generateOHLC(seedPrice, TIMEFRAME_CONFIG[timeframe])
    const lastCandle = generated[generated.length - 1]
    entry = {
      history: generated.slice(0, -1),
      anchor: buildAnchorFromCandle(lastCandle),
    }
    symbolCache.set(timeframe, entry)
  }

  // Refresh the anchor's fallback close so a later invalid basePrice
  // returns the most recent valid close, not a stale generation-time value.
  if (Number.isFinite(basePrice) && basePrice > 0) {
    entry.anchor.lastValidClose = basePrice
  }

  // Return a shallow copy so consumers (charts, memos) can't mutate the
  // cached history and break stability across timeframe switches.
  return [...entry.history, buildLastCandle(entry.anchor, basePrice)]
}

export interface ProbabilityPoint {
  time: string
  value: number
}

export function generateProbabilityHistory(currentProb: number, days: number): ProbabilityPoint[] {
  const data: ProbabilityPoint[] = []
  let prob = 0.3 + Math.random() * 0.4
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const drift = (currentProb - prob) * 0.02
    const noise = (Math.random() - 0.5) * 0.06
    prob = Math.max(0.01, Math.min(0.99, prob + drift + noise))

    data.push({ time: dateStr, value: prob })
  }

  if (data.length > 0) {
    data[data.length - 1].value = currentProb
  }

  return data
}
