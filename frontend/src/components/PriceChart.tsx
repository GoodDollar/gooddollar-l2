'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, type IChartApi, ColorType, type Time } from 'lightweight-charts'
import { type OHLCData, computeSMA } from '@/lib/chartData'

interface PriceChartProps {
  data: OHLCData[]
  height?: number
}

interface CrosshairData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toFixed(0)
}

type Indicator = 'sma20' | 'sma50' | 'rsi'

const INDICATOR_OPTIONS: { id: Indicator; label: string }[] = [
  { id: 'sma20', label: 'SMA 20' },
  { id: 'sma50', label: 'SMA 50' },
  { id: 'rsi', label: 'RSI 14' },
]

function computeRSI(data: OHLCData[], period = 14): { time: string | number; value: number }[] {
  if (data.length < period + 1) return []
  const result: { time: string | number; value: number }[] = []
  let avgGain = 0
  let avgLoss = 0

  for (let i = 1; i <= period; i++) {
    const delta = data[i].close - data[i - 1].close
    if (delta > 0) avgGain += delta
    else avgLoss += Math.abs(delta)
  }
  avgGain /= period
  avgLoss /= period

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  result.push({ time: data[period].time, value: 100 - 100 / (1 + rs) })

  for (let i = period + 1; i < data.length; i++) {
    const delta = data[i].close - data[i - 1].close
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? Math.abs(delta) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    const rsI = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({ time: data[i].time, value: 100 - 100 / (1 + rsI) })
  }
  return result
}

export function PriceChart({ data, height = 400 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rsiContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const rsiChartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const volumeRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const sma20Ref = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const sma50Ref = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const rsiSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)

  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['sma20']))
  const [crosshair, setCrosshair] = useState<CrosshairData | null>(null)

  const toggleIndicator = useCallback((id: Indicator) => {
    setActiveIndicators(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const showRSI = activeIndicators.has('rsi')

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(107, 114, 128, 0.1)' },
        horzLines: { color: 'rgba(107, 114, 128, 0.1)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 176, 160, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0, 176, 160, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: 'rgba(107, 114, 128, 0.2)' },
      timeScale: { borderColor: 'rgba(107, 114, 128, 0.2)', timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#22C55E',
      wickDownColor: '#EF4444',
      wickUpColor: '#22C55E',
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(0, 176, 160, 0.15)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    const sma20Series = chart.addSeries(LineSeries, {
      color: '#F59E0B',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshair(null)
        return
      }
      const candle = param.seriesData.get(candleSeries)
      if (!candle || !('open' in candle)) {
        setCrosshair(null)
        return
      }
      const vol = param.seriesData.get(volumeSeries)
      const c = candle as { open: number; high: number; low: number; close: number }
      const change = c.close - c.open
      setCrosshair({
        time: String(param.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: (vol && 'value' in vol) ? (vol as { value: number }).value : 0,
        change,
        changePercent: c.open !== 0 ? (change / c.open) * 100 : 0,
      })
    })

    chartRef.current = chart
    candleRef.current = candleSeries
    volumeRef.current = volumeSeries
    sma20Ref.current = sma20Series
    sma50Ref.current = sma50Series

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [height])

  useEffect(() => {
    if (!rsiContainerRef.current || !showRSI) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove()
        rsiChartRef.current = null
        rsiSeriesRef.current = null
      }
      return
    }

    const rsiChart = createChart(rsiContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(107, 114, 128, 0.05)' },
        horzLines: { color: 'rgba(107, 114, 128, 0.1)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 176, 160, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0, 176, 160, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(107, 114, 128, 0.2)',
        autoScale: false,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: { visible: false },
      width: rsiContainerRef.current.clientWidth,
      height: 80,
    })

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#06B6D4',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    rsiChartRef.current = rsiChart
    rsiSeriesRef.current = rsiSeries

    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && rsiChartRef.current) {
          rsiChartRef.current.timeScale().setVisibleLogicalRange(range)
        }
      })
    }

    const handleResize = () => {
      if (rsiContainerRef.current) {
        rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      rsiChart.remove()
      rsiChartRef.current = null
      rsiSeriesRef.current = null
    }
  }, [showRSI])

  useEffect(() => {
    if (!candleRef.current || !volumeRef.current || data.length === 0) return

    const timeData = data.map(d => ({ ...d, time: d.time as Time }))

    candleRef.current.setData(
      timeData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    )

    volumeRef.current.setData(
      timeData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      }))
    )

    if (sma20Ref.current) {
      if (activeIndicators.has('sma20')) {
        const sma20 = computeSMA(data, 20)
        sma20Ref.current.setData(sma20.map(s => ({ time: s.time as Time, value: s.value })))
        sma20Ref.current.applyOptions({ visible: true })
      } else {
        sma20Ref.current.setData([])
        sma20Ref.current.applyOptions({ visible: false })
      }
    }

    if (sma50Ref.current) {
      if (activeIndicators.has('sma50')) {
        const sma50 = computeSMA(data, 50)
        sma50Ref.current.setData(sma50.map(s => ({ time: s.time as Time, value: s.value })))
        sma50Ref.current.applyOptions({ visible: true })
      } else {
        sma50Ref.current.setData([])
        sma50Ref.current.applyOptions({ visible: false })
      }
    }

    if (rsiSeriesRef.current && showRSI) {
      const rsiData = computeRSI(data, 14)
      rsiSeriesRef.current.setData(rsiData.map(r => ({ time: r.time as Time, value: r.value })))
    }

    chartRef.current?.timeScale().fitContent()
    rsiChartRef.current?.timeScale().fitContent()
  }, [data, activeIndicators, showRSI])

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {INDICATOR_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => toggleIndicator(opt.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                activeIndicators.has(opt.id)
                  ? opt.id === 'sma20' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : opt.id === 'sma50' ? 'border-violet-500/40 bg-violet-500/10 text-violet-400'
                    : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                  : 'border-gray-700/30 text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {crosshair && (
        <div className="absolute top-8 left-2 z-10 flex items-center gap-3 text-[11px] font-mono pointer-events-none">
          <span className="text-gray-400">O</span>
          <span className="text-white">{crosshair.open.toFixed(2)}</span>
          <span className="text-gray-400">H</span>
          <span className="text-white">{crosshair.high.toFixed(2)}</span>
          <span className="text-gray-400">L</span>
          <span className="text-white">{crosshair.low.toFixed(2)}</span>
          <span className="text-gray-400">C</span>
          <span className={crosshair.change >= 0 ? 'text-green-400' : 'text-red-400'}>
            {crosshair.close.toFixed(2)}
          </span>
          <span className={crosshair.change >= 0 ? 'text-green-400' : 'text-red-400'}>
            {crosshair.change >= 0 ? '+' : ''}{crosshair.changePercent.toFixed(2)}%
          </span>
          <span className="text-gray-400">Vol</span>
          <span className="text-white">{formatVolume(crosshair.volume)}</span>
        </div>
      )}

      <div ref={containerRef} className="w-full" />

      {showRSI && (
        <div className="mt-0.5 border-t border-gray-700/20">
          <div className="flex items-center gap-2 px-1 py-0.5">
            <span className="text-[10px] font-medium text-cyan-400">RSI(14)</span>
            <span className="text-[10px] text-gray-600">70</span>
            <div className="flex-1 h-px bg-gray-700/20" />
            <span className="text-[10px] text-gray-600">30</span>
          </div>
          <div ref={rsiContainerRef} className="w-full" />
        </div>
      )}
    </div>
  )
}
