'use client'

import { useEffect, useRef, useState } from 'react'
import { useStockPrices } from '@/hooks/useStockPrices'
import { cn, formatKRW } from '@/lib/utils'

type RecommendationStatus =
  | 'active'
  | 'target1_hit'
  | 'target2_hit'
  | 'stop_loss'

const statusLabel: Record<RecommendationStatus, string> = {
  active: '',
  target1_hit: '1차 달성',
  target2_hit: '2차 달성',
  stop_loss: '손절',
}

const statusColor: Record<RecommendationStatus, string> = {
  active: '',
  target1_hit: 'text-emerald-400',
  target2_hit: 'text-emerald-300',
  stop_loss: 'text-red-400',
}

interface LivePriceProps {
  ticker: string
  entryPrice: number
  target1Price: number
  target2Price: number
  stopLossPrice: number
}

export function LivePrice({
  ticker,
  entryPrice,
  target1Price,
  target2Price,
  stopLossPrice,
}: LivePriceProps) {
  const prices = useStockPrices([ticker])
  const data = prices[ticker]
  const prevPriceRef = useRef<number | null>(null)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (!data) return
    const prev = prevPriceRef.current
    if (prev !== null && prev !== data.currentPrice) {
      const dir = data.currentPrice > prev ? 'up' : 'down'
      setFlash(dir)
      const t = setTimeout(() => setFlash(null), 600)
      prevPriceRef.current = data.currentPrice
      return () => clearTimeout(t)
    }
    prevPriceRef.current = data.currentPrice
  }, [data?.currentPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null

  const { currentPrice, changeRate } = data

  const status: RecommendationStatus =
    currentPrice <= stopLossPrice
      ? 'stop_loss'
      : currentPrice >= target2Price
        ? 'target2_hit'
        : currentPrice >= target1Price
          ? 'target1_hit'
          : 'active'

  const pctFromEntry = ((currentPrice - entryPrice) / entryPrice) * 100

  const priceColor =
    flash === 'up'
      ? 'text-emerald-400'
      : flash === 'down'
        ? 'text-red-400'
        : changeRate > 0
          ? 'text-emerald-400'
          : changeRate < 0
            ? 'text-red-400'
            : 'text-foreground'

  return (
    <div className="mt-2 flex items-center justify-between rounded-md border border-border/50 bg-muted/10 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs text-muted-foreground">현재가</span>
        {status !== 'active' && (
          <span className={cn('text-xs font-semibold', statusColor[status])}>
            {statusLabel[status]}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-mono text-sm font-bold transition-colors duration-300',
            priceColor,
          )}
        >
          {formatKRW(currentPrice)}
        </span>
        <span
          className={cn(
            'font-mono text-xs tabular-nums',
            pctFromEntry >= 0 ? 'text-emerald-500' : 'text-red-500',
          )}
        >
          {pctFromEntry >= 0 ? '+' : ''}
          {pctFromEntry.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}
