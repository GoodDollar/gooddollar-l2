import type { OHLCData } from './chartData'

export interface IndicatorPoint {
  time: string | number
  value: number
}

export function calculateSMA(data: OHLCData[], period: number): IndicatorPoint[] {
  if (data.length < period) return []

  const result: IndicatorPoint[] = []
  let sum = 0

  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  result.push({ time: data[period - 1].time, value: sum / period })

  for (let i = period; i < data.length; i++) {
    sum += data[i].close - data[i - period].close
    result.push({ time: data[i].time, value: sum / period })
  }

  return result
}

export function calculateEMA(data: OHLCData[], period: number): IndicatorPoint[] {
  if (data.length < period) return []

  const k = 2 / (period + 1)
  const result: IndicatorPoint[] = []

  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  let ema = sum / period
  result.push({ time: data[period - 1].time, value: ema })

  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k)
    result.push({ time: data[i].time, value: ema })
  }

  return result
}

export type IndicatorId = 'vol' | 'sma20' | 'ema50'

export interface ActiveIndicators {
  vol: boolean
  sma20: boolean
  ema50: boolean
}

export const DEFAULT_INDICATORS: ActiveIndicators = {
  vol: false,
  sma20: false,
  ema50: false,
}
