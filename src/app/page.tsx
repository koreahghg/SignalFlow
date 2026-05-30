import { unstable_cache } from 'next/cache'
import { MarketStatus } from '@/components/dashboard/MarketStatus'
import { AllocationCalculator } from '@/components/dashboard/AllocationCalculator'
import { NewNoticeBanner } from '@/components/dashboard/NewNoticeBanner'
import { StockCard } from '@/components/stock/StockCard'
import { formatDate } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { checkSuspension } from '@/lib/checkSuspension'
import { getTodayRecommendations } from '@/lib/api'
import type { StockRecommendation } from '@/types/stock'

const getRecentNotice = unstable_cache(
  async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return await prisma.notice.findFirst({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      })
    } catch {
      return null
    }
  },
  ['recent-notice'],
  { revalidate: 300 },
)

const today = new Date().toISOString().split('T')[0]

export default async function HomePage() {
  await checkSuspension()
  const recentNotice = await getRecentNotice()

  let stocks: StockRecommendation[] = []
  try {
    stocks = await getTodayRecommendations()
  } catch {
    // FastAPI 서버 미실행 또는 오류 시 빈 배열로 처리
  }

  const avgUpside = stocks.length
    ? stocks.reduce((sum, s) => sum + ((s.target1Price - s.entryPrice) / s.entryPrice) * 100, 0) / stocks.length
    : 0

  const avgDownside = stocks.length
    ? stocks.reduce((sum, s) => sum + ((s.stopLossPrice - s.entryPrice) / s.entryPrice) * 100, 0) / stocks.length
    : 0

  return (
    <div className="space-y-6">
      {/* 신규 공지 배너 */}
      {recentNotice && <NewNoticeBanner id={recentNotice.id} title={recentNotice.title} />}

      {/* 장 상태 배너 */}
      <MarketStatus />

      {/* 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Daily Picks</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">오늘의 추천 종목</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(today)} 기준</p>
        </div>
        {stocks.length > 0 && (
          <div className="hidden sm:flex items-center gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">평균 목표 수익</p>
              <p className="text-lg font-bold text-emerald-400">+{avgUpside.toFixed(1)}%</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">평균 손절폭</p>
              <p className="text-lg font-bold text-red-400">{avgDownside.toFixed(1)}%</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">종목 수</p>
              <p className="text-lg font-bold">{stocks.length} / 3</p>
            </div>
          </div>
        )}
      </div>

      {stocks.length > 0 ? (
        <>
          {/* 모바일 통계 */}
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div className="rounded-lg border border-border bg-card/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">목표 수익</p>
              <p className="text-sm font-bold text-emerald-400">+{avgUpside.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-card/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">손절폭</p>
              <p className="text-sm font-bold text-red-400">{avgDownside.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-card/50 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">종목 수</p>
              <p className="text-sm font-bold">{stocks.length} / 3</p>
            </div>
          </div>

          {/* 종목 카드 그리드 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stocks.map((stock, i) => (
              <StockCard key={stock.id} stock={stock} rank={i + 1} />
            ))}
          </div>

          {/* 자금 배분 계산기 */}
          <AllocationCalculator stocks={stocks} />
        </>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">오늘의 추천 종목이 없습니다</p>
            <p className="mt-1 text-xs text-muted-foreground">장 시작 전(08:30) 자동으로 생성됩니다</p>
          </div>
        </div>
      )}

      {/* 면책 고지 */}
      <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
        본 정보는 투자 참고용이며, 투자 손익에 대한 책임은 투자자 본인에게 있습니다.
      </p>
    </div>
  )
}
