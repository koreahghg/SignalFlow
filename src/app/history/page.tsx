import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, formatKRW } from '@/lib/utils'
import { getHistory } from '@/lib/api'
import type { DailyRecommendation } from '@/types/stock'

const riskConfig = {
  low: { label: '저위험', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  medium: { label: '중위험', className: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  high: { label: '고위험', className: 'border-red-500/40 bg-red-500/10 text-red-400' },
}

const rankColors = [
  { dot: 'bg-yellow-400', text: 'text-yellow-400' },
  { dot: 'bg-slate-400', text: 'text-slate-400' },
  { dot: 'bg-amber-600', text: 'text-amber-600' },
]

export default async function HistoryPage() {
  let history: DailyRecommendation[] = []
  try {
    history = await getHistory()
  } catch {
    // FastAPI 서버 미실행 또는 오류 시 빈 배열로 처리
  }

  const totalStocks = history.reduce((s, d) => s + d.stocks.length, 0)

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">History</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">추천 내역</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">최근 {history.length}일 기록</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">총 추천</p>
          <p className="text-2xl font-bold">{totalStocks}건</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">추천 내역이 없습니다</p>
        </div>
      ) : (
        /* 날짜별 그룹 */
        history.map((day) => (
          <section key={day.date} className="space-y-3">
            {/* 날짜 헤더 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-primary" />
                <h2 className="text-base font-bold">{formatDate(day.date)}</h2>
              </div>
              {day.marketCondition && (
                <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {day.marketCondition}
                </span>
              )}
            </div>

            {/* 종목 목록 */}
            <div className="space-y-2">
              {day.stocks.map((stock, i) => {
                const rank = rankColors[i] ?? { dot: 'bg-muted-foreground', text: 'text-muted-foreground' }
                const upside1 = ((stock.target1Price - stock.entryPrice) / stock.entryPrice) * 100
                const downside = ((stock.stopLossPrice - stock.entryPrice) / stock.entryPrice) * 100

                return (
                  <Link
                    key={stock.id}
                    href={`/stock/${stock.ticker}`}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-border/60 hover:bg-card/80"
                  >
                    {/* 순위 */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                      <span className={cn('text-sm font-black tabular-nums', rank.text)}>#{i + 1}</span>
                    </div>

                    {/* 종목 정보 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold group-hover:underline underline-offset-4">{stock.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{stock.ticker}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{stock.reason}</p>
                    </div>

                    {/* 가격 정보 */}
                    <div className="hidden sm:flex items-center gap-5 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">진입가</p>
                        <p className="font-mono text-sm font-bold">{formatKRW(stock.entryPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">1차 익절</p>
                        <p className="font-mono text-sm font-semibold text-emerald-400">
                          +{upside1.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">손절</p>
                        <p className="font-mono text-sm font-semibold text-red-400">
                          {downside.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* 배지 */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge variant="outline" className={cn('text-xs', riskConfig[stock.riskLevel].className)}>
                        {riskConfig[stock.riskLevel].label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {stock.theme}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
