'use client'

import { useEffect, useRef, useMemo } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, type IChartApi, ColorType, type Time } from 'lightweight-charts'
import { type OHLCData } from '@/lib/chartData'
import { calculateSMA, calculateEMA, type ActiveIndicators, DEFAULT_INDICATORS } from '@/lib/indicators'

interface PriceChartProps {
  data: OHLCData[]
  height?: number
  indicators?: ActiveIndicators
}

export function PriceChart({ data, height = 400, indicators = DEFAULT_INDICATORS }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const volumeRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const smaRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const emaRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)

  const smaData = useMemo(() => calculateSMA(data, 20), [data])
  const emaData = useMemo(() => calculateEMA(data, 50), [data])

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
      priceScaleId: 'vol',
    })
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    const smaSeries = chart.addSeries(LineSeries, {
      color: '#FBBF24',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    const emaSeries = chart.addSeries(LineSeries, {
      color: '#A78BFA',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    chartRef.current = chart
    candleRef.current = candleSeries
    volumeRef.current = volumeSeries
    smaRef.current = smaSeries
    emaRef.current = emaSeries

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
    if (!candleRef.current || !volumeRef.current || data.length === 0) return

    candleRef.current.setData(
      data.map(d => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    )

    volumeRef.current.setData(
      data.map(d => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      }))
    )

    chartRef.current?.timeScale().fitContent()
  }, [data])

  useEffect(() => {
    if (!volumeRef.current) return
    volumeRef.current.applyOptions({
      visible: indicators.vol,
    })
  }, [indicators.vol])

  useEffect(() => {
    if (!smaRef.current) return
    if (indicators.sma20 && smaData.length > 0) {
      smaRef.current.setData(smaData.map(p => ({ time: p.time as Time, value: p.value })))
      smaRef.current.applyOptions({ visible: true })
    } else {
      smaRef.current.applyOptions({ visible: false })
    }
  }, [indicators.sma20, smaData])

  useEffect(() => {
    if (!emaRef.current) return
    if (indicators.ema50 && emaData.length > 0) {
      emaRef.current.setData(emaData.map(p => ({ time: p.time as Time, value: p.value })))
      emaRef.current.applyOptions({ visible: true })
    } else {
      emaRef.current.applyOptions({ visible: false })
    }
  }, [indicators.ema50, emaData])

  return <div ref={containerRef} className="w-full" />
}
