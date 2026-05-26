'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { VolumeSurgeCard } from '@/components/volume/VolumeSurgeCard'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { VolumeAlert, AlertLevel } from '@/types/volume'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const MARKET_OPTIONS = [
  { value: '0', label: '전체' },
  { value: '1', label: '코스피' },
  { value: '2', label: '코스닥' },
]

const LEVEL_OPTIONS: { value: AlertLevel | 'all'; label: string }[] = [
  { value: 'all',      label: '전체' },
  { value: 'critical', label: '급등' },
  { value: 'alert',    label: '경보' },
  { value: 'caution',  label: '주의' },
  { value: 'watch',    label: '관찰' },
]

const levelOrder: Record<AlertLevel, number> = {
  critical: 0, alert: 1, caution: 2, watch: 3,
}

export default function VolumePage() {
  const [alerts, setAlerts] = useState<VolumeAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [market, setMarket] = useState('0')
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all')

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/volume/surge?market=${market}&limit=30`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `서버 오류 (${res.status})`)
      }
      const data: VolumeAlert[] = await res.json()
      setAlerts(data)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }, [market])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const filtered = useMemo(
    () => alerts.filter(a => levelFilter === 'all' || a.alertLevel === levelFilter),
    [alerts, levelFilter]
  )

  const counts = useMemo(
    () => alerts.reduce<Record<AlertLevel, number>>(
      (acc, a) => { acc[a.alertLevel] = (acc[a.alertLevel] ?? 0) + 1; return acc },
      { critical: 0, alert: 0, caution: 0, watch: 0 }
    ),
    [alerts]
  )

  const sortedAlerts = useMemo(
    () => [...filtered].sort((a, b) => levelOrder[a.alertLevel] - levelOrder[b.alertLevel] || b.surgeScore - a.surgeScore),
    [filtered]
  )

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">거래량 급등 탐지</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            평균 대비 거래량·거래대금 급증 종목 실시간 스캔
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} 기준
            </span>
          )}
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className={cn(
              'rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors',
              'hover:bg-muted disabled:opacity-50'
            )}
          >
            {loading ? '스캔 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3">
        {/* 시장 필터 */}
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {MARKET_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMarket(opt.value)}
              className={cn(
                'px-3 py-1.5 font-medium transition-colors',
                market === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 경보 단계 필터 */}
        <div className="flex flex-wrap gap-1">
          {LEVEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLevelFilter(opt.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                levelFilter === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
              )}
            >
              {opt.label}
              {opt.value !== 'all' && counts[opt.value as AlertLevel] > 0 && (
                <span className="ml-1 font-mono">{counts[opt.value as AlertLevel]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 배지 */}
      {!loading && !error && alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counts.critical > 0 && (
            <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400">
              급등 {counts.critical}
            </Badge>
          )}
          {counts.alert > 0 && (
            <Badge variant="outline" className="border-orange-500/40 bg-orange-500/10 text-orange-400">
              경보 {counts.alert}
            </Badge>
          )}
          {counts.caution > 0 && (
            <Badge variant="outline" className="border-yellow-500/40 bg-yellow-500/10 text-yellow-400">
              주의 {counts.caution}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            이상탐지 {alerts.filter(a => a.isAbnormal).length}건
          </Badge>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg border border-border bg-muted/20" />
          ))}
        </div>
      )}

      {/* 결과 */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAlerts.map(alert => (
              <VolumeSurgeCard key={alert.ticker} alert={alert} />
            ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && alerts.length > 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          해당 조건의 종목이 없습니다.
        </p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          새로고침 버튼을 눌러 스캔을 시작하세요.
        </p>
      )}
    </div>
  )
}
