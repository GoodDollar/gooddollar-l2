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
  '1H': { points: 60, intervalMs: 60_000, useTimestamp: true },
  '4H': { points: 42, intervalMs: 14_400_000, useTimestamp: true },
  '1D': { points: 24, intervalMs: 3_600_000, useTimestamp: true },
  '1W': { points: 28, intervalMs: 6 * 3_600_000, useTimestamp: true },
  '1M': { points: 30, intervalMs: 86_400_000, useTimestamp: false },
  '3M': { points: 90, intervalMs: 86_400_000, useTimestamp: false },
  '1Y': { points: 365, intervalMs: 86_400_000, useTimestamp: false },
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

const CHART_CACHE = new Map<string, Map<string, OHLCData[]>>()

export type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M' | '3M' | '1Y'

export interface SMAPoint {
  time: string | number
  value: number
}

export function computeSMA(data: OHLCData[], period: number): SMAPoint[] {
  if (data.length < period) return []
  const result: SMAPoint[] = []
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close
    if (i >= period) sum -= data[i - period].close
    if (i >= period - 1) {
      result.push({ time: data[i].time, value: sum / period })
    }
  }
  return result
}

function isFinitePositive(n: number): boolean {
  return Number.isFinite(n) && n > 0
}

function updateLastCandle(series: OHLCData[], basePrice: number): void {
  if (series.length === 0) return
  if (!isFinitePositive(basePrice)) return
  const last = series[series.length - 1]
  series[series.length - 1] = {
    ...last,
    close: basePrice,
    high: Math.max(last.high, basePrice),
    low: Math.min(last.low, basePrice),
  }
}

export function getChartData(symbol: string, timeframe: Timeframe, basePrice: number): OHLCData[] {
  if (!CHART_CACHE.has(symbol)) {
    CHART_CACHE.set(symbol, new Map())
  }
  const symbolCache = CHART_CACHE.get(symbol)!
  if (!symbolCache.has(timeframe)) {
    symbolCache.set(timeframe, generateOHLC(basePrice, TIMEFRAME_CONFIG[timeframe]))
  } else {
    updateLastCandle(symbolCache.get(timeframe)!, basePrice)
  }
  return symbolCache.get(timeframe)!.slice()
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
