'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { runBacktest } from '@/lib/api'
import type { BacktestResult, EquityPoint } from '@/types/stock'

const PATTERN_LABEL: Record<string, string> = {
  breakout: '돌파',
  pullback: '눌림목',
  volume_surge: '거래량급증',
}

const EXIT_LABEL: Record<string, string> = {
  target2: '2차 익절',
  target1: '1차 익절',
  trailing_stop: '트레일링',
  stop_loss: '손절',
  force_sell: '강제매도',
}

const EXIT_COLOR: Record<string, string> = {
  target2: 'bg-emerald-500',
  target1: 'bg-emerald-400',
  trailing_stop: 'bg-blue-400',
  stop_loss: 'bg-red-500',
  force_sell: 'bg-zinc-400',
}

const EXIT_TEXT: Record<string, string> = {
  target2: 'text-emerald-400',
  target1: 'text-emerald-300',
  trailing_stop: 'text-blue-400',
  stop_loss: 'text-red-400',
  force_sell: 'text-zinc-400',
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

function defaultDates() {
  const end = new Date()
  end.setDate(end.getDate() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - 13)
  return { start: fmt(start), end: fmt(end) }
}

// ── 에쿼티 커브 SVG ───────────────────────────────────────────────────────────

function EquityCurve({ data }: { data: EquityPoint[] }) {
  if (data.length < 2) return null

  const W = 420
  const H = 160
  const PL = 46, PR = 50, PT = 12, PB = 20
  const iW = W - PL - PR
  const iH = H - PT - PB

  const vals = data.map((d) => d.cum_return)
  const rawMin = Math.min(...vals)
  const rawMax = Math.max(...vals)
  const min = Math.min(0, rawMin)
  const max = Math.max(0, rawMax)
  const range = max - min || 1

  const toX = (i: number) => PL + iW * (i / (data.length - 1))
  const toY = (v: number) => PT + iH * (1 - (v - min) / range)
  const zeroY = toY(0)

  // line path
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.cum_return)}`).join(' ')

  // area path (closed at zero line)
  const area =
    `M ${toX(0)} ${zeroY} ` +
    data.map((d, i) => `L ${toX(i)} ${toY(d.cum_return)}`).join(' ') +
    ` L ${toX(data.length - 1)} ${zeroY} Z`

  const last = data[data.length - 1].cum_return
  const isPos = last >= 0
  const stroke = isPos ? '#10b981' : '#ef4444'
  const fill = isPos ? '#10b98126' : '#ef444420'

  // Y axis tick labels
  const yLabels = [max, max / 2, 0, min / 2, min].filter(
    (v, i, arr) => arr.indexOf(v) === i && Math.abs(v) > 0.05,
  )

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="에쿼티 커브">
      {/* Y grid lines + labels */}
      {yLabels.map((v) => (
        <g key={v}>
          <line
            x1={PL}
            y1={toY(v)}
            x2={W - PR}
            y2={toY(v)}
            stroke="#ffffff10"
            strokeWidth="1"
          />
          <text
            x={PL - 6}
            y={toY(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="11"
            fill="#71717a"
          >
            {v >= 0 ? '+' : ''}
            {v.toFixed(1)}%
          </text>
        </g>
      ))}

      {/* Zero line */}
      <line
        x1={PL}
        y1={zeroY}
        x2={W - PR}
        y2={zeroY}
        stroke="#52525b"
        strokeDasharray="4 3"
        strokeWidth="1"
      />

      {/* Area fill */}
      <path d={area} fill={fill} />

      {/* Curve line */}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />

      {/* Last value label */}
      <text
        x={toX(data.length - 1) + 5}
        y={toY(last)}
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
        fill={stroke}
      >
        {last >= 0 ? '+' : ''}
        {last.toFixed(2)}%
      </text>

      {/* X axis: first / last date */}
      <text x={PL} y={H - 4} fontSize="11" fill="#71717a">
        {data[0].date.slice(5)}
      </text>
      <text x={W - PR} y={H - 4} textAnchor="end" fontSize="11" fill="#71717a">
        {data[data.length - 1].date.slice(5)}
      </text>
    </svg>
  )
}

// ── 메트릭 카드 ───────────────────────────────────────────────────────────────

function Metric({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-2xl font-bold tabular-nums', color ?? 'text-foreground')}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function BacktestPage() {
  const { start: defStart, end: defEnd } = defaultDates()
  const [startDate, setStartDate] = useState(defStart)
  const [endDate, setEndDate] = useState(defEnd)
  const [market, setMarket] = useState<'KOSPI' | 'KOSDAQ' | 'ALL'>('KOSPI')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await runBacktest({ startDate, endDate, market })
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '백테스트 실행 실패')
    } finally {
      setLoading(false)
    }
  }

  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000,
  )

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Backtest
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">전략 백테스트</h1>
      </div>

      {/* 설정 카드 */}
      <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">시장</label>
            <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
              {(['KOSPI', 'KOSDAQ', 'ALL'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-medium transition-all',
                    market === m
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {days > 0 ? `선택 기간: ${days}일` : ''}
            {days > 30 && (
              <span className="ml-2 text-red-400">최대 30일까지 가능합니다</span>
            )}
            {days > 0 && days <= 30 && (
              <span className="ml-2 opacity-60">· 예상 소요: {Math.ceil(days * 2)}~{Math.ceil(days * 4)}초</span>
            )}
          </p>
          <button
            onClick={handleRun}
            disabled={loading || days <= 0 || days > 30}
            className={cn(
              'rounded-lg px-6 py-2 text-sm font-semibold transition-all',
              loading || days <= 0 || days > 30
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {loading ? '실행 중...' : '백테스트 실행'}
          </button>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            데이터 수집 및 백테스트 실행 중...
          </p>
          <p className="text-xs text-muted-foreground opacity-60">
            FinanceDataReader로 과거 데이터를 가져오는 중입니다
          </p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <p className="mt-1 text-xs text-red-400/60">
            백엔드 서버가 실행 중인지 확인하세요 (uvicorn main:app)
          </p>
        </div>
      )}

      {/* 결과 */}
      {result && !loading && (
        <div className="space-y-5">
          {result.total_trades === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                해당 기간에 조건을 충족한 거래가 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Metric label="총 거래수" value={`${result.total_trades}건`} />
                <Metric
                  label="승률"
                  value={`${result.win_rate.toFixed(1)}%`}
                  color={result.win_rate >= 60 ? 'text-emerald-400' : result.win_rate >= 45 ? 'text-yellow-400' : 'text-red-400'}
                />
                <Metric
                  label="평균 수익률"
                  value={`${result.avg_return >= 0 ? '+' : ''}${result.avg_return.toFixed(2)}%`}
                  color={result.avg_return >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <Metric
                  label="누적 수익률"
                  value={`${result.total_return >= 0 ? '+' : ''}${result.total_return.toFixed(2)}%`}
                  color={result.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <Metric
                  label="MDD"
                  value={`${result.max_drawdown.toFixed(2)}%`}
                  color="text-red-400"
                />
                <Metric
                  label="평균 손익비"
                  value={`1 : ${result.rr_stats.avg_rr1.toFixed(2)}`}
                  sub={`1차 2.0 이상 ${result.rr_stats.pct_rr1_above_2.toFixed(0)}%`}
                  color="text-primary"
                />
              </div>

              {/* 에쿼티 커브 */}
              {result.equity_curve.length >= 2 && (
                <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-2">
                  <p className="text-sm font-semibold">누적 수익률 커브</p>
                  <EquityCurve data={result.equity_curve} />
                </div>
              )}

              {/* 상세 탭 */}
              <Tabs defaultValue="pattern">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="pattern">패턴별 성과</TabsTrigger>
                  <TabsTrigger value="exit">청산 사유</TabsTrigger>
                  <TabsTrigger value="trades">거래 내역</TabsTrigger>
                </TabsList>

                {/* 패턴별 */}
                <TabsContent value="pattern" className="mt-4 space-y-3">
                  {Object.entries(result.by_pattern).length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-xs text-muted-foreground">
                            <th className="px-4 py-3 text-left font-medium">패턴</th>
                            <th className="px-4 py-3 text-right font-medium">거래수</th>
                            <th className="px-4 py-3 text-right font-medium">승률</th>
                            <th className="px-4 py-3 text-right font-medium">평균 수익률</th>
                            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">승률 바</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {Object.entries(result.by_pattern)
                            .sort((a, b) => b[1].win_rate - a[1].win_rate)
                            .map(([pattern, stats]) => (
                              <tr key={pattern} className="hover:bg-muted/10">
                                <td className="px-4 py-3 font-medium">
                                  {PATTERN_LABEL[pattern] ?? pattern}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                  {stats.trades}건
                                </td>
                                <td className={cn(
                                  'px-4 py-3 text-right tabular-nums font-bold',
                                  stats.win_rate >= 60 ? 'text-emerald-400' : stats.win_rate >= 45 ? 'text-yellow-400' : 'text-red-400',
                                )}>
                                  {stats.win_rate.toFixed(1)}%
                                </td>
                                <td className={cn(
                                  'px-4 py-3 text-right tabular-nums font-medium',
                                  stats.avg_return >= 0 ? 'text-emerald-400' : 'text-red-400',
                                )}>
                                  {stats.avg_return >= 0 ? '+' : ''}{stats.avg_return.toFixed(2)}%
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted/30">
                                    <div
                                      className={cn('h-full rounded-full', stats.win_rate >= 60 ? 'bg-emerald-500' : stats.win_rate >= 45 ? 'bg-yellow-400' : 'bg-red-500')}
                                      style={{ width: `${stats.win_rate}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* 청산 사유 */}
                <TabsContent value="exit" className="mt-4">
                  <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-4">
                    {/* 분포 바 */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">청산 사유 분포</p>
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/20">
                        {Object.entries(EXIT_COLOR).map(([reason, cls]) => {
                          const count = result.exit_breakdown[reason] ?? 0
                          const pct = (count / result.total_trades) * 100
                          return pct > 0 ? (
                            <div key={reason} className={cn('h-full transition-all', cls)} style={{ width: `${pct}%` }} />
                          ) : null
                        })}
                      </div>
                    </div>

                    {/* 범례 + 수치 */}
                    <div className="space-y-2.5">
                      {Object.entries(EXIT_COLOR)
                        .filter(([r]) => (result.exit_breakdown[r] ?? 0) > 0)
                        .map(([reason, bgCls]) => {
                          const count = result.exit_breakdown[reason] ?? 0
                          const pct = (count / result.total_trades) * 100
                          return (
                            <div key={reason} className="flex items-center gap-3">
                              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', bgCls)} />
                              <span className="w-20 text-sm text-muted-foreground">
                                {EXIT_LABEL[reason] ?? reason}
                              </span>
                              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted/20">
                                <div className={cn('h-full rounded-full', bgCls)} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-8 text-right text-sm font-medium tabular-nums">
                                {count}
                              </span>
                              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          )
                        })}
                    </div>

                    {/* 손익비 통계 */}
                    <div className="mt-2 border-t border-border pt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                      {[
                        { label: '평균 1차 손익비', value: `1 : ${result.rr_stats.avg_rr1.toFixed(2)}` },
                        { label: '평균 2차 손익비', value: `1 : ${result.rr_stats.avg_rr2.toFixed(2)}` },
                        { label: '1:2 이상 비율', value: `${result.rr_stats.pct_rr1_above_2.toFixed(1)}%` },
                        { label: '1:3.5 이상 비율', value: `${result.rr_stats.pct_rr2_above_35.toFixed(1)}%` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="mt-0.5 font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* 거래 내역 */}
                <TabsContent value="trades" className="mt-4">
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-xs text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium">날짜</th>
                          <th className="px-4 py-3 text-left font-medium">종목</th>
                          <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">패턴</th>
                          <th className="px-4 py-3 text-right font-medium hidden md:table-cell">진입가</th>
                          <th className="px-4 py-3 text-right font-medium hidden md:table-cell">청산가</th>
                          <th className="px-4 py-3 text-left font-medium">청산 사유</th>
                          <th className="px-4 py-3 text-right font-medium">수익률</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {result.trades.map((t, i) => (
                          <tr key={i} className="hover:bg-muted/10">
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                              {t.date.slice(5)}
                            </td>
                            <td className="px-4 py-2.5 font-medium">{t.name}</td>
                            <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-muted-foreground">
                              {PATTERN_LABEL[t.pattern] ?? t.pattern}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-xs text-muted-foreground hidden md:table-cell">
                              {t.entry_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-xs text-muted-foreground hidden md:table-cell">
                              {t.exit_price.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                t.exit_reason === 'target2' ? 'bg-emerald-500/15 text-emerald-400' :
                                t.exit_reason === 'target1' ? 'bg-emerald-500/10 text-emerald-300' :
                                t.exit_reason === 'trailing_stop' ? 'bg-blue-500/15 text-blue-400' :
                                t.exit_reason === 'stop_loss' ? 'bg-red-500/15 text-red-400' :
                                'bg-zinc-500/15 text-zinc-400',
                              )}>
                                {EXIT_LABEL[t.exit_reason] ?? t.exit_reason}
                              </span>
                            </td>
                            <td className={cn(
                              'px-4 py-2.5 text-right font-mono text-xs font-bold',
                              EXIT_TEXT[t.exit_reason] ?? (t.pnl_pct >= 0 ? 'text-emerald-400' : 'text-red-400'),
                            )}>
                              {t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </div>
  )
}
