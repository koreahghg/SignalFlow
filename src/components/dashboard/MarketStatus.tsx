'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type MarketState = 'pre' | 'open' | 'closed'

function getMarketState(now: Date): MarketState {
  const h = now.getHours()
  const m = now.getMinutes()
  const total = h * 60 + m
  if (total < 9 * 60) return 'pre'
  if (total < 15 * 60 + 30) return 'open'
  return 'closed'
}

function getSecondsUntilOpen(now: Date): number {
  const open = new Date(now)
  open.setHours(9, 0, 0, 0)
  if (now >= open) return 0
  return Math.floor((open.getTime() - now.getTime()) / 1000)
}

function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}시간 ${m.toString().padStart(2, '0')}분 ${s.toString().padStart(2, '0')}초`
  return `${m.toString().padStart(2, '0')}분 ${s.toString().padStart(2, '0')}초`
}

export function MarketStatus() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return (
      <div className="h-14 rounded-xl border border-border bg-card/50 animate-pulse" />
    )
  }

  const state = getMarketState(now)
  const secsLeft = state === 'pre' ? getSecondsUntilOpen(now) : 0

  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border px-4 py-3',
        state === 'open'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : state === 'pre'
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : 'border-border bg-card/50'
      )}
    >
      <div className="flex items-center gap-3">
        {state === 'open' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">장중</span>
              <span className="text-xs text-muted-foreground">KOSPI · KOSDAQ</span>
            </div>
          </>
        ) : state === 'pre' ? (
          <>
            <Clock className="h-4 w-4 text-yellow-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-yellow-400">장 시작 전</span>
              <span className="text-xs text-muted-foreground">개장까지</span>
              <span className="font-mono text-sm font-semibold text-yellow-300">
                {formatCountdown(secsLeft)}
              </span>
            </div>
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">장 마감</span>
            <span className="text-xs text-muted-foreground">내일 09:00 개장</span>
          </>
        )}
      </div>

      <span className="font-mono text-xs text-muted-foreground">{timeStr}</span>
    </div>
  )
}
