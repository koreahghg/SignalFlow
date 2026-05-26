import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, formatKRW } from '@/lib/utils'
import { checkSuspension } from '@/lib/checkSuspension'
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

const mockHistory: DailyRecommendation[] = [
  {
    date: '2026-05-24',
    marketCondition: '코스피 +0.8% · 외국인 순매수 2,400억',
    stocks: [
      {
        id: '1', date: '2026-05-24', ticker: '005930', name: '삼성전자',
        entryPrice: 75000, stopLossPrice: 73500, target1Price: 77000, target2Price: 79000,
        forceSellTime: '14:00', reason: '반도체 업황 개선 기대감 + 외국인 순매수',
        theme: '반도체', volumeAnalysis: '전일 거래대금 1.2조', newsAnalysis: 'HBM4 수주 기대', riskLevel: 'medium',
      },
      {
        id: '2', date: '2026-05-24', ticker: '247540', name: '에코프로비엠',
        entryPrice: 185000, stopLossPrice: 180000, target1Price: 192000, target2Price: 200000,
        forceSellTime: '13:30', reason: '2차전지 테마 재부각',
        theme: '2차전지', volumeAnalysis: '전일 거래대금 8,500억', newsAnalysis: '유럽 배터리 수주 계약', riskLevel: 'high',
      },
      {
        id: '3', date: '2026-05-24', ticker: '035720', name: '카카오',
        entryPrice: 42000, stopLossPrice: 41000, target1Price: 43500, target2Price: 45000,
        forceSellTime: '14:30', reason: 'AI 서비스 출시 기대감',
        theme: 'AI/플랫폼', volumeAnalysis: '전일 거래대금 3,200억', newsAnalysis: '카카오 AI 어시스턴트 베타 출시', riskLevel: 'low',
      },
    ],
  },
  {
    date: '2026-05-23',
    marketCondition: '코스피 -0.3% · 기관 순매도',
    stocks: [
      {
        id: '4', date: '2026-05-23', ticker: '000660', name: 'SK하이닉스',
        entryPrice: 198000, stopLossPrice: 193000, target1Price: 205000, target2Price: 212000,
        forceSellTime: '14:00', reason: 'HBM3E 공급 확대 기대감',
        theme: '반도체', volumeAnalysis: '전일 거래대금 9,800억', newsAnalysis: '엔비디아 공급망 확대 보도', riskLevel: 'medium',
      },
      {
        id: '5', date: '2026-05-23', ticker: '035420', name: 'NAVER',
        entryPrice: 195000, stopLossPrice: 191000, target1Price: 200000, target2Price: 207000,
        forceSellTime: '14:30', reason: 'AI 검색 서비스 글로벌 확장 발표',
        theme: 'AI/플랫폼', volumeAnalysis: '전일 거래대금 2,100억', newsAnalysis: '하이퍼클로바X 해외 출시 소식', riskLevel: 'low',
      },
      {
        id: '6', date: '2026-05-23', ticker: '068270', name: '셀트리온',
        entryPrice: 172000, stopLossPrice: 168000, target1Price: 178000, target2Price: 185000,
        forceSellTime: '13:00', reason: '바이오시밀러 FDA 승인 기대감',
        theme: '바이오', volumeAnalysis: '전일 거래대금 4,500억', newsAnalysis: '짐펜트라 미국 매출 성장 보도', riskLevel: 'high',
      },
    ],
  },
  {
    date: '2026-05-22',
    marketCondition: '코스피 +1.2% · 외국인·기관 동반 매수',
    stocks: [
      {
        id: '7', date: '2026-05-22', ticker: '012450', name: '한화에어로스페이스',
        entryPrice: 680000, stopLossPrice: 664000, target1Price: 700000, target2Price: 720000,
        forceSellTime: '14:00', reason: '방산 수출 계약 기대감',
        theme: '방산', volumeAnalysis: '전일 거래대금 6,200억', newsAnalysis: '폴란드 추가 계약 협상 보도', riskLevel: 'medium',
      },
      {
        id: '8', date: '2026-05-22', ticker: '373220', name: 'LG에너지솔루션',
        entryPrice: 320000, stopLossPrice: 312000, target1Price: 330000, target2Price: 342000,
        forceSellTime: '13:30', reason: '전기차 배터리 수주 확대',
        theme: '2차전지', volumeAnalysis: '전일 거래대금 5,800억', newsAnalysis: 'GM 배터리 공급 확대 계약', riskLevel: 'high',
      },
      {
        id: '9', date: '2026-05-22', ticker: '267260', name: 'HD현대일렉트릭',
        entryPrice: 295000, stopLossPrice: 288000, target1Price: 305000, target2Price: 315000,
        forceSellTime: '14:30', reason: '전력기기 수출 호조',
        theme: '에너지', volumeAnalysis: '전일 거래대금 3,900억', newsAnalysis: '미국 전력망 투자 확대 수혜 보도', riskLevel: 'low',
      },
    ],
  },
]

export default async function HistoryPage() {
  await checkSuspension()
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">History</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">추천 내역</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">최근 {mockHistory.length}일 기록</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">총 추천</p>
          <p className="text-2xl font-bold">{mockHistory.reduce((s, d) => s + d.stocks.length, 0)}건</p>
        </div>
      </div>

      {/* 날짜별 그룹 */}
      {mockHistory.map((day) => (
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
      ))}
    </div>
  )
}
