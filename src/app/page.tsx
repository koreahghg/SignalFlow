import { unstable_cache } from 'next/cache'
import { MarketStatus } from '@/components/dashboard/MarketStatus'
import { AllocationCalculator } from '@/components/dashboard/AllocationCalculator'
import { NewNoticeBanner } from '@/components/dashboard/NewNoticeBanner'
import { StockCard } from '@/components/stock/StockCard'
import { formatDate } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { ShieldAlert } from 'lucide-react'
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

// TODO: API 연동 후 제거
const mockStocks: StockRecommendation[] = [
  {
    id: '1',
    date: '2026-05-25',
    ticker: '005930',
    name: '삼성전자',
    entryPrice: 75000,
    stopLossPrice: 73500,
    target1Price: 77000,
    target2Price: 79000,
    forceSellTime: '14:00',
    reason: '반도체 업황 개선 기대감 + 외국인 순매수 3일 연속. 전일 거래대금 1조 돌파 후 눌림목 진입 구간.',
    theme: '반도체',
    volumeAnalysis: '전일 거래대금 1.2조, 5일 평균 대비 2.3배. 기관 매수 집중.',
    newsAnalysis: 'HBM4 수주 기대 뉴스 + AI 서버 수요 확대 보도. 외신 긍정적 언급.',
    riskLevel: 'medium',
  },
  {
    id: '2',
    date: '2026-05-25',
    ticker: '247540',
    name: '에코프로비엠',
    entryPrice: 185000,
    stopLossPrice: 180000,
    target1Price: 192000,
    target2Price: 200000,
    forceSellTime: '13:30',
    reason: '2차전지 테마 재부각 + 전일 장 마감 후 공시 호재. 갭 상승 후 눌림목 매수 전략.',
    theme: '2차전지',
    volumeAnalysis: '전일 거래대금 8,500억. 개인 순매수 전환, 공매도 비중 감소.',
    newsAnalysis: '유럽 배터리 수주 계약 관련 공시. 북미 고객사 추가 소식.',
    riskLevel: 'high',
  },
  {
    id: '3',
    date: '2026-05-25',
    ticker: '035720',
    name: '카카오',
    entryPrice: 42000,
    stopLossPrice: 41000,
    target1Price: 43500,
    target2Price: 45000,
    forceSellTime: '14:30',
    reason: 'AI 서비스 출시 기대감 + 52주 신저가 반등 구간. 거래량 급증 후 안정화.',
    theme: 'AI/플랫폼',
    volumeAnalysis: '전일 거래대금 3,200억. 평균 대비 1.8배, 저점 매집 패턴.',
    newsAnalysis: '카카오 AI 어시스턴트 베타 출시 예정 보도. 광고 매출 회복 전망.',
    riskLevel: 'low',
  },
]

const today = new Date().toISOString().split('T')[0]

export default async function HomePage() {
  const [session, recentNotice] = await Promise.all([auth(), getRecentNotice()])

  if (session?.user?.id) {
    const rows = await prisma.$queryRaw<{ status: string; suspendedUntil: Date | null; suspendReason: string | null }[]>`
      SELECT status, "suspendedUntil", "suspendReason" FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    const user = rows[0] ?? null

    const isSuspended =
      user?.status === 'suspended' &&
      (!user.suspendedUntil || new Date(user.suspendedUntil) > new Date())

    if (isSuspended) {
      return (
        <div className="space-y-6">
          {recentNotice && <NewNoticeBanner id={recentNotice.id} title={recentNotice.title} />}
          <MarketStatus />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-16 text-center">
            <ShieldAlert className="mb-4 h-12 w-12 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">서비스 이용이 정지되었습니다</h2>
            {user.suspendedUntil ? (
              <p className="mt-2 text-sm text-muted-foreground">
                정지 해제일: {new Date(user.suspendedUntil).toLocaleDateString('ko-KR')}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">관리자에 의해 영구 정지된 계정입니다.</p>
            )}
            {user.suspendReason && (
              <p className="mt-1 text-sm text-muted-foreground">사유: {user.suspendReason}</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">문의사항은 고객센터로 연락해주세요.</p>
          </div>
        </div>
      )
    }
  }

  const avgUpside =
    mockStocks.reduce((sum, s) => {
      return sum + ((s.target1Price - s.entryPrice) / s.entryPrice) * 100
    }, 0) / mockStocks.length

  const avgDownside =
    mockStocks.reduce((sum, s) => {
      return sum + ((s.stopLossPrice - s.entryPrice) / s.entryPrice) * 100
    }, 0) / mockStocks.length

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
            <p className="text-lg font-bold">{mockStocks.length} / 3</p>
          </div>
        </div>
      </div>

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
          <p className="text-sm font-bold">{mockStocks.length} / 3</p>
        </div>
      </div>

      {/* 종목 카드 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockStocks.map((stock, i) => (
          <StockCard key={stock.id} stock={stock} rank={i + 1} />
        ))}
      </div>

      {/* 자금 배분 계산기 */}
      <AllocationCalculator stocks={mockStocks} />

      {/* 면책 고지 */}
      <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
        본 정보는 투자 참고용이며, 투자 손익에 대한 책임은 투자자 본인에게 있습니다.
      </p>
    </div>
  )
}
