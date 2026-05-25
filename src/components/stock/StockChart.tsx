'use client'

import { useEffect, useRef, useState } from 'react'

interface CandleBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Props {
  ticker: string
  entryPrice?: number
  stopLossPrice?: number
  target1Price?: number
  target2Price?: number
}

function calcMA(candles: CandleBar[], period: number) {
  return candles
    .map((_, i, arr) => {
      if (i < period - 1) return null
      const avg = arr.slice(i - period + 1, i + 1).reduce((s, c) => s + c.close, 0) / period
      return { time: arr[i].date as string, value: Math.round(avg) }
    })
    .filter((x): x is { time: string; value: number } => x !== null)
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function StockChart({ ticker, entryPrice, stopLossPrice, target1Price, target2Price }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    async function init() {
      try {
        const [lc, res] = await Promise.all([
          import('lightweight-charts'),
          fetch(`${API_BASE}/api/stocks/${ticker}/candles?days=60`),
        ])

        if (cancelled) return

        if (!res.ok) {
          setStatus('error')
          return
        }

        const candles: CandleBar[] = await res.json()
        if (cancelled || !containerRef.current || candles.length === 0) {
          setStatus('error')
          return
        }

        const { createChart, ColorType, CrosshairMode, LineStyle } = lc

        const chart = createChart(containerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#09090b' },
            textColor: '#94a3b8',
            fontFamily: 'inherit',
          },
          grid: {
            vertLines: { color: '#1e293b' },
            horzLines: { color: '#1e293b' },
          },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: {
            borderColor: '#1e293b',
            scaleMargins: { top: 0.1, bottom: 0.2 },
          },
          timeScale: {
            borderColor: '#1e293b',
            timeVisible: true,
            fixLeftEdge: true,
            fixRightEdge: true,
          },
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })

        chartRef.current = chart as any

        // 캔들스틱
        const candleSeries = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })
        candleSeries.setData(
          candles.map(c => ({ time: c.date as any, open: c.open, high: c.high, low: c.low, close: c.close }))
        )

        // 거래량 (별도 스케일)
        const volumeSeries = chart.addHistogramSeries({
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        })
        chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
        volumeSeries.setData(
          candles.map(c => ({
            time: c.date as any,
            value: c.volume,
            color: c.close >= c.open ? '#22c55e33' : '#ef444433',
          }))
        )

        // MA5 (단기 — 노란색)
        const ma5Series = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
          title: 'MA5',
        })
        ma5Series.setData(calcMA(candles, 5) as any)

        // MA20 (중기 — 보라색)
        const ma20Series = chart.addLineSeries({
          color: '#818cf8',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
          title: 'MA20',
        })
        ma20Series.setData(calcMA(candles, 20) as any)

        // 추천 가격선
        if (entryPrice) {
          candleSeries.createPriceLine({
            price: entryPrice,
            color: '#3b82f6',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '진입가',
          })
        }
        if (stopLossPrice) {
          candleSeries.createPriceLine({
            price: stopLossPrice,
            color: '#ef4444',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '손절',
          })
        }
        if (target1Price) {
          candleSeries.createPriceLine({
            price: target1Price,
            color: '#22c55e',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '1차 익절',
          })
        }
        if (target2Price) {
          candleSeries.createPriceLine({
            price: target2Price,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '2차 익절',
          })
        }

        chart.timeScale().fitContent()

        // 반응형 리사이즈
        observerRef.current = new ResizeObserver(() => {
          if (containerRef.current) {
            chart.applyOptions({ width: containerRef.current.clientWidth })
          }
        })
        observerRef.current.observe(containerRef.current)

        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    init()

    return () => {
      cancelled = true
      observerRef.current?.disconnect()
      observerRef.current = null
      chartRef.current?.remove()
      chartRef.current = null
    }
  }, [ticker, entryPrice, stopLossPrice, target1Price, target2Price])

  return (
    <div className="relative w-full rounded-lg border border-border bg-[#09090b]">
      {/* 범례 */}
      <div className="absolute left-3 top-2 z-10 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-amber-400" />
          MA5
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-indigo-400" />
          MA20
        </span>
      </div>

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">차트 로딩 중...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            차트 데이터를 불러올 수 없습니다 — 백엔드 연결을 확인하세요
          </p>
        </div>
      )}

      {/* 모바일: 300px / 데스크탑: 460px */}
      <div ref={containerRef} className="h-[300px] w-full md:h-[460px]" />
    </div>
  )
}
