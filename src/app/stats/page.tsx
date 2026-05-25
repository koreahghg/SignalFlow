'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

type ExitType = 'target2' | 'target1' | 'stop_loss'
type Period = 'all' | '1y' | '6m' | '1m' | '1w'

type Trade = {
  date: string
  name: string
  theme: string
  risk: 'low' | 'medium' | 'high'
  exitType: ExitType
  returnPct: number
}

const RAW: [string, string, string, 'low' | 'medium' | 'high', ExitType, number][] = [
  ['2026-05-23', '삼성전자', '반도체', 'medium', 'target1', 2.7],
  ['2026-05-23', '에코프로비엠', '2차전지', 'high', 'stop_loss', -2.7],
  ['2026-05-23', 'NAVER', 'AI/플랫폼', 'low', 'target2', 5.2],
  ['2026-05-22', 'SK하이닉스', '반도체', 'medium', 'target2', 6.1],
  ['2026-05-22', '셀트리온', '바이오', 'high', 'stop_loss', -2.4],
  ['2026-05-22', '한화에어로스페이스', '방산', 'medium', 'target1', 3.1],
  ['2026-05-21', '카카오', 'AI/플랫폼', 'low', 'target1', 2.3],
  ['2026-05-21', 'LG에너지솔루션', '2차전지', 'high', 'stop_loss', -3.1],
  ['2026-05-21', 'HD현대일렉트릭', '에너지', 'medium', 'target2', 4.8],
  ['2026-05-20', '삼성전자', '반도체', 'medium', 'stop_loss', -2.0],
  ['2026-05-20', '크래프톤', '게임', 'low', 'target1', 2.9],
  ['2026-05-20', '하이브', '엔터', 'medium', 'target2', 5.5],
  ['2026-05-19', 'SK하이닉스', '반도체', 'medium', 'target1', 3.5],
  ['2026-05-19', '에코프로비엠', '2차전지', 'high', 'target1', 3.8],
  ['2026-05-19', 'NAVER', 'AI/플랫폼', 'low', 'stop_loss', -1.8],
  ['2026-05-16', '삼성전자', '반도체', 'medium', 'target2', 5.8],
  ['2026-05-16', '셀트리온', '바이오', 'high', 'stop_loss', -3.2],
  ['2026-05-16', '카카오', 'AI/플랫폼', 'low', 'target1', 2.1],
  ['2026-05-14', 'SK하이닉스', '반도체', 'medium', 'target1', 3.3],
  ['2026-05-14', 'LG에너지솔루션', '2차전지', 'high', 'target2', 7.2],
  ['2026-05-14', '한화에어로스페이스', '방산', 'medium', 'stop_loss', -2.2],
  ['2026-05-12', 'HD현대일렉트릭', '에너지', 'medium', 'target1', 2.6],
  ['2026-05-12', '하이브', '엔터', 'medium', 'stop_loss', -1.9],
  ['2026-05-12', '크래프톤', '게임', 'low', 'target2', 4.3],
  ['2026-05-09', '삼성전자', '반도체', 'medium', 'stop_loss', -2.5],
  ['2026-05-09', 'NAVER', 'AI/플랫폼', 'low', 'target1', 2.8],
  ['2026-05-09', '에코프로비엠', '2차전지', 'high', 'target2', 6.4],
  ['2026-05-07', '셀트리온', '바이오', 'high', 'stop_loss', -2.9],
  ['2026-05-07', 'SK하이닉스', '반도체', 'medium', 'target1', 3.7],
  ['2026-05-07', '카카오', 'AI/플랫폼', 'low', 'target2', 5.1],
  ['2026-05-02', '한화에어로스페이스', '방산', 'medium', 'target1', 2.4],
  ['2026-05-02', 'LG에너지솔루션', '2차전지', 'high', 'stop_loss', -3.0],
  ['2026-05-02', 'HD현대일렉트릭', '에너지', 'medium', 'target2', 4.9],
  ['2026-04-30', '삼성전자', '반도체', 'medium', 'target1', 2.2],
  ['2026-04-30', '크래프톤', '게임', 'low', 'stop_loss', -1.7],
  ['2026-04-30', '하이브', '엔터', 'medium', 'target1', 3.0],
  ['2026-04-28', 'SK하이닉스', '반도체', 'medium', 'target2', 6.8],
  ['2026-04-28', '에코프로비엠', '2차전지', 'high', 'stop_loss', -2.8],
  ['2026-04-28', 'NAVER', 'AI/플랫폼', 'low', 'target1', 2.5],
  ['2026-04-23', '셀트리온', '바이오', 'high', 'target2', 5.7],
  ['2026-04-23', '삼성전자', '반도체', 'medium', 'target1', 3.2],
  ['2026-04-23', '카카오', 'AI/플랫폼', 'low', 'stop_loss', -2.1],
  ['2026-04-09', 'SK하이닉스', '반도체', 'medium', 'stop_loss', -2.3],
  ['2026-04-09', 'LG에너지솔루션', '2차전지', 'high', 'target1', 4.0],
  ['2026-04-09', 'HD현대일렉트릭', '에너지', 'medium', 'target2', 5.3],
  ['2026-03-25', '한화에어로스페이스', '방산', 'medium', 'target2', 7.4],
  ['2026-03-25', '하이브', '엔터', 'medium', 'stop_loss', -2.6],
  ['2026-03-25', 'NAVER', 'AI/플랫폼', 'low', 'target1', 2.9],
  ['2026-03-11', '삼성전자', '반도체', 'medium', 'target1', 3.6],
  ['2026-03-11', '에코프로비엠', '2차전지', 'high', 'stop_loss', -3.4],
  ['2026-03-11', '크래프톤', '게임', 'low', 'target2', 4.6],
  ['2026-02-25', 'SK하이닉스', '반도체', 'medium', 'target2', 6.2],
  ['2026-02-25', '셀트리온', '바이오', 'high', 'target1', 3.8],
  ['2026-02-25', '카카오', 'AI/플랫폼', 'low', 'stop_loss', -1.6],
  ['2026-02-11', 'LG에너지솔루션', '2차전지', 'high', 'target2', 7.0],
  ['2026-02-11', 'HD현대일렉트릭', '에너지', 'medium', 'stop_loss', -2.0],
  ['2026-02-11', 'NAVER', 'AI/플랫폼', 'low', 'target1', 2.7],
  ['2026-01-28', '삼성전자', '반도체', 'medium', 'stop_loss', -2.2],
  ['2026-01-28', '한화에어로스페이스', '방산', 'medium', 'target1', 3.4],
  ['2026-01-28', '에코프로비엠', '2차전지', 'high', 'target2', 5.9],
  ['2026-01-14', 'SK하이닉스', '반도체', 'medium', 'target1', 2.8],
  ['2026-01-14', '하이브', '엔터', 'medium', 'stop_loss', -2.4],
  ['2026-01-14', '크래프톤', '게임', 'low', 'target2', 4.1],
  ['2025-12-24', '셀트리온', '바이오', 'high', 'stop_loss', -3.0],
  ['2025-12-24', '카카오', 'AI/플랫폼', 'low', 'target1', 2.3],
  ['2025-12-24', 'LG에너지솔루션', '2차전지', 'high', 'target2', 6.7],
  ['2025-12-10', 'HD현대일렉트릭', '에너지', 'medium', 'target1', 3.1],
  ['2025-12-10', 'NAVER', 'AI/플랫폼', 'low', 'stop_loss', -1.9],
  ['2025-12-10', '삼성전자', '반도체', 'medium', 'target2', 5.4],
  ['2025-11-12', 'SK하이닉스', '반도체', 'medium', 'target1', 3.9],
  ['2025-11-12', '에코프로비엠', '2차전지', 'high', 'stop_loss', -2.7],
  ['2025-11-12', '한화에어로스페이스', '방산', 'medium', 'target2', 6.5],
  ['2025-10-22', '셀트리온', '바이오', 'high', 'target1', 3.5],
  ['2025-10-22', '카카오', 'AI/플랫폼', 'low', 'target2', 4.7],
  ['2025-10-22', 'LG에너지솔루션', '2차전지', 'high', 'stop_loss', -3.1],
  ['2025-10-01', '삼성전자', '반도체', 'medium', 'target2', 5.6],
  ['2025-10-01', '하이브', '엔터', 'medium', 'stop_loss', -2.0],
  ['2025-10-01', 'HD현대일렉트릭', '에너지', 'medium', 'target1', 2.9],
  ['2025-09-10', 'NAVER', 'AI/플랫폼', 'low', 'target1', 2.4],
  ['2025-09-10', 'SK하이닉스', '반도체', 'medium', 'stop_loss', -2.1],
  ['2025-09-10', '크래프톤', '게임', 'low', 'target2', 4.4],
  ['2025-08-20', '에코프로비엠', '2차전지', 'high', 'target2', 7.1],
  ['2025-08-20', '셀트리온', '바이오', 'high', 'stop_loss', -2.5],
  ['2025-08-20', '한화에어로스페이스', '방산', 'medium', 'target1', 3.3],
  ['2025-07-30', '삼성전자', '반도체', 'medium', 'stop_loss', -1.8],
  ['2025-07-30', '카카오', 'AI/플랫폼', 'low', 'target1', 2.6],
  ['2025-07-30', 'LG에너지솔루션', '2차전지', 'high', 'target2', 6.3],
  ['2025-07-09', 'HD현대일렉트릭', '에너지', 'medium', 'target2', 5.1],
  ['2025-07-09', 'NAVER', 'AI/플랫폼', 'low', 'stop_loss', -1.5],
  ['2025-07-09', '하이브', '엔터', 'medium', 'target1', 3.0],
  ['2025-06-18', 'SK하이닉스', '반도체', 'medium', 'target1', 3.7],
  ['2025-06-18', '에코프로비엠', '2차전지', 'high', 'stop_loss', -2.9],
  ['2025-06-18', '크래프톤', '게임', 'low', 'target2', 4.2],
]

const MOCK_TRADES: Trade[] = RAW.map(([date, name, theme, risk, exitType, returnPct]) => ({
  date, name, theme, risk, exitType, returnPct,
}))

const PERIODS: { key: Period; label: string }[] = [
  { key: 'all', label: '누적' },
  { key: '1y', label: '1년' },
  { key: '6m', label: '6개월' },
  { key: '1m', label: '1개월' },
  { key: '1w', label: '1주일' },
]

const EXIT_LABEL: Record<ExitType, string> = {
  target2: '2차 익절',
  target1: '1차 익절',
  stop_loss: '손절',
}

const RISK_LABEL = { low: '저위험', medium: '중위험', high: '고위험' }
const RISK_COLOR = { low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-red-400' }
const WEEKDAYS = ['월', '화', '수', '목', '금']

function cutoffDate(period: Period): string {
  const d = new Date('2026-05-25')
  if (period === 'all') return '1900-01-01'
  if (period === '1y') { d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0] }
  if (period === '6m') { d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0] }
  if (period === '1m') { d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0] }
  d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('all')

  const trades = useMemo(() => {
    const cutoff = cutoffDate(period)
    return MOCK_TRADES.filter((t) => t.date >= cutoff)
  }, [period])

  const total = trades.length
  const wins = trades.filter((t) => t.exitType !== 'stop_loss')
  const losses = trades.filter((t) => t.exitType === 'stop_loss')
  const target2 = trades.filter((t) => t.exitType === 'target2')
  const target1 = trades.filter((t) => t.exitType === 'target1')
  const successRate = total ? (wins.length / total) * 100 : 0
  const avgWinReturn = avg(wins.map((t) => t.returnPct))
  const avgLossReturn = avg(losses.map((t) => t.returnPct))
  const avgAllReturn = avg(trades.map((t) => t.returnPct))

  const themes = [...new Set(trades.map((t) => t.theme))].sort()
  const themeStats = themes.map((th) => {
    const g = trades.filter((t) => t.theme === th)
    const w = g.filter((t) => t.exitType !== 'stop_loss')
    return { theme: th, total: g.length, wins: w.length, rate: g.length ? (w.length / g.length) * 100 : 0 }
  }).sort((a, b) => b.rate - a.rate)

  const riskStats = (['low', 'medium', 'high'] as const).map((r) => {
    const g = trades.filter((t) => t.risk === r)
    const w = g.filter((t) => t.exitType !== 'stop_loss')
    return { risk: r, total: g.length, wins: w.length, rate: g.length ? (w.length / g.length) * 100 : 0 }
  })

  const weekdayStats = WEEKDAYS.map((day, i) => {
    const g = trades.filter((t) => new Date(t.date).getDay() - 1 === i)
    const w = g.filter((t) => t.exitType !== 'stop_loss')
    return { day, total: g.length, rate: g.length ? (w.length / g.length) * 100 : 0 }
  })

  const sorted = [...trades].sort((a, b) => b.returnPct - a.returnPct)
  const best3 = sorted.slice(0, 3)
  const worst3 = sorted.slice(-3).reverse()

  let maxStreak = 0, maxLossStreak = 0, curW = 0, curL = 0
  for (const t of [...trades].sort((a, b) => a.date.localeCompare(b.date))) {
    if (t.exitType !== 'stop_loss') { curW++; curL = 0; maxStreak = Math.max(maxStreak, curW) }
    else { curL++; curW = 0; maxLossStreak = Math.max(maxLossStreak, curL) }
  }

  const rateColor = (r: number) => r >= 65 ? 'text-emerald-400' : r >= 50 ? 'text-yellow-400' : 'text-red-400'
  const barColor = (r: number) => r >= 65 ? 'bg-emerald-500' : r >= 50 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Performance</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">통계</h1>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/20 p-1 w-fit">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
              period === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">해당 기간에 데이터가 없습니다</p>
        </div>
      ) : (
        <>
          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card px-4 py-4">
              <p className="text-xs text-muted-foreground">총 추천</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{total}<span className="ml-1 text-base font-medium text-muted-foreground">건</span></p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-4">
              <p className="text-xs text-muted-foreground">성공률</p>
              <p className={cn('mt-2 text-3xl font-bold tabular-nums', rateColor(successRate))}>
                {successRate.toFixed(1)}<span className="ml-0.5 text-base font-medium">%</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{wins.length}성공 / {losses.length}실패</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-4">
              <p className="text-xs text-muted-foreground">평균 수익률</p>
              <p className={cn('mt-2 text-3xl font-bold tabular-nums', avgAllReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {avgAllReturn >= 0 ? '+' : ''}{avgAllReturn.toFixed(2)}<span className="ml-0.5 text-base font-medium">%</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                익절 +{avgWinReturn.toFixed(1)}% · 손절 {avgLossReturn.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-4">
              <p className="text-xs text-muted-foreground">최대 연속</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-primary">
                {maxStreak}<span className="ml-1 text-base font-medium text-muted-foreground">연승</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">최대 {maxLossStreak}연패</p>
            </div>
          </div>

          {/* 결과 분포 */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
            <p className="text-sm font-semibold">결과 분포</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/30">
              <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${(target2.length / total) * 100}%` }} />
              <div className="bg-emerald-400/70 transition-all duration-700" style={{ width: `${(target1.length / total) * 100}%` }} />
              <div className="bg-red-500 transition-all duration-700" style={{ width: `${(losses.length / total) * 100}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                { color: 'bg-emerald-500', label: '2차 익절', count: target2.length },
                { color: 'bg-emerald-400/70', label: '1차 익절', count: target1.length },
                { color: 'bg-red-500', label: '손절', count: losses.length },
              ].map(({ color, label, count }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn('h-2 w-2 rounded-full', color)} />
                  {label} <span className="font-medium text-foreground">{count}건</span>
                  <span>({total ? ((count / total) * 100).toFixed(0) : 0}%)</span>
                </span>
              ))}
            </div>
          </div>

          {/* 테마 + 위험도 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 테마별 */}
            <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
              <p className="text-sm font-semibold">테마별 성공률</p>
              <div className="space-y-2.5">
                {themeStats.map((t) => (
                  <div key={t.theme} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t.theme}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t.total}건</span>
                        <span className={cn('w-10 text-right font-bold', rateColor(t.rate))}>{t.rate.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-700', barColor(t.rate))} style={{ width: `${t.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 위험도 + 요일 */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
                <p className="text-sm font-semibold">위험도별 성공률</p>
                <div className="space-y-2.5">
                  {riskStats.map((r) => (
                    <div key={r.risk} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn('font-medium', RISK_COLOR[r.risk])}>{RISK_LABEL[r.risk]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{r.total}건</span>
                          <span className={cn('w-10 text-right font-bold', rateColor(r.rate))}>{r.rate.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all duration-700', barColor(r.rate))} style={{ width: `${r.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 요일별 */}
              <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
                <p className="text-sm font-semibold">요일별 성공률</p>
                <div className="flex items-end gap-2">
                  {weekdayStats.map((w) => {
                    const height = w.total > 0 ? Math.max(8, w.rate * 0.6) : 8
                    return (
                      <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className={cn('text-xs font-bold tabular-nums', w.total > 0 ? rateColor(w.rate) : 'text-muted-foreground/40')}>
                          {w.total > 0 ? `${w.rate.toFixed(0)}%` : '–'}
                        </span>
                        <div className="relative w-full rounded-md bg-muted/30 overflow-hidden" style={{ height: '56px' }}>
                          {w.total > 0 && (
                            <div
                              className={cn('absolute bottom-0 w-full rounded-md transition-all duration-700', barColor(w.rate), 'opacity-70')}
                              style={{ height: `${height}px` }}
                            />
                          )}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{w.day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 베스트 / 워스트 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: '베스트 종목', items: best3, isWorst: false },
              { title: '워스트 종목', items: worst3, isWorst: true },
            ].map(({ title, items, isWorst }) => (
              <div key={title} className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
                <p className="text-sm font-semibold">{title}</p>
                <div className="space-y-1">
                  {items.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/20">
                      <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{t.date.slice(5)}</span>
                      <span className={cn('w-16 shrink-0 text-right font-mono text-sm font-bold', isWorst ? 'text-red-400' : 'text-emerald-400')}>
                        {t.returnPct >= 0 ? '+' : ''}{t.returnPct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 최근 거래 내역 */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
            <p className="text-sm font-semibold">최근 거래 내역</p>
            <div className="divide-y divide-border/40">
              {[...trades]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 15)
                .map((t, i) => {
                  const isWin = t.exitType !== 'stop_loss'
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="w-18 shrink-0 font-mono text-xs text-muted-foreground">{t.date.slice(5)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{t.name}</span>
                      <span className="hidden sm:block shrink-0 text-xs text-muted-foreground">{t.theme}</span>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                        t.exitType === 'target2' ? 'bg-emerald-500/15 text-emerald-400' :
                        t.exitType === 'target1' ? 'bg-emerald-500/10 text-emerald-300' :
                        'bg-red-500/15 text-red-400'
                      )}>
                        {EXIT_LABEL[t.exitType]}
                      </span>
                      <span className={cn('w-16 shrink-0 text-right font-mono text-xs font-bold', isWin ? 'text-emerald-400' : 'text-red-400')}>
                        {t.returnPct >= 0 ? '+' : ''}{t.returnPct.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
