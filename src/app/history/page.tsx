import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, formatKRW } from '@/lib/utils'
import type { DailyRecommendation } from '@/types/stock'

const riskConfig = {
  low: { label: '저위험', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  medium: { label: '중위험', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: '고위험', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

// TODO: API 연동 후 제거
const mockHistory: DailyRecommendation[] = [
  {
    date: '2026-05-24',
    marketCondition: '코스피 +0.8% · 외국인 순매수 2,400억',
    stocks: [
      {
        id: '1',
        date: '2026-05-24',
        ticker: '005930',
        name: '삼성전자',
        entryPrice: 75000,
        stopLossPrice: 73500,
        target1Price: 77000,
        target2Price: 79000,
        forceSellTime: '14:00',
        reason: '반도체 업황 개선 기대감 + 외국인 순매수',
        theme: '반도체',
        volumeAnalysis: '전일 거래대금 1.2조',
        newsAnalysis: 'HBM4 수주 기대',
        riskLevel: 'medium',
      },
      {
        id: '2',
        date: '2026-05-24',
        ticker: '247540',
        name: '에코프로비엠',
        entryPrice: 185000,
        stopLossPrice: 180000,
        target1Price: 192000,
        target2Price: 200000,
        forceSellTime: '13:30',
        reason: '2차전지 테마 재부각',
        theme: '2차전지',
        volumeAnalysis: '전일 거래대금 8,500억',
        newsAnalysis: '유럽 배터리 수주 계약',
        riskLevel: 'high',
      },
      {
        id: '3',
        date: '2026-05-24',
        ticker: '035720',
        name: '카카오',
        entryPrice: 42000,
        stopLossPrice: 41000,
        target1Price: 43500,
        target2Price: 45000,
        forceSellTime: '14:30',
        reason: 'AI 서비스 출시 기대감',
        theme: 'AI/플랫폼',
        volumeAnalysis: '전일 거래대금 3,200억',
        newsAnalysis: '카카오 AI 어시스턴트 베타 출시',
        riskLevel: 'low',
      },
    ],
  },
  {
    date: '2026-05-23',
    marketCondition: '코스피 -0.3% · 기관 순매도',
    stocks: [
      {
        id: '4',
        date: '2026-05-23',
        ticker: '000660',
        name: 'SK하이닉스',
        entryPrice: 198000,
        stopLossPrice: 193000,
        target1Price: 205000,
        target2Price: 212000,
        forceSellTime: '14:00',
        reason: 'HBM3E 공급 확대 기대감',
        theme: '반도체',
        volumeAnalysis: '전일 거래대금 9,800억',
        newsAnalysis: '엔비디아 공급망 확대 보도',
        riskLevel: 'medium',
      },
      {
        id: '5',
        date: '2026-05-23',
        ticker: '035420',
        name: 'NAVER',
        entryPrice: 195000,
        stopLossPrice: 191000,
        target1Price: 200000,
        target2Price: 207000,
        forceSellTime: '14:30',
        reason: 'AI 검색 서비스 글로벌 확장 발표',
        theme: 'AI/플랫폼',
        volumeAnalysis: '전일 거래대금 2,100억',
        newsAnalysis: '하이퍼클로바X 해외 출시 소식',
        riskLevel: 'low',
      },
      {
        id: '6',
        date: '2026-05-23',
        ticker: '068270',
        name: '셀트리온',
        entryPrice: 172000,
        stopLossPrice: 168000,
        target1Price: 178000,
        target2Price: 185000,
        forceSellTime: '13:00',
        reason: '바이오시밀러 FDA 승인 기대감',
        theme: '바이오',
        volumeAnalysis: '전일 거래대금 4,500억',
        newsAnalysis: '짐펜트라 미국 매출 성장 보도',
        riskLevel: 'high',
      },
    ],
  },
]

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">추천 내역</h1>
        <p className="mt-1 text-sm text-muted-foreground">최근 {mockHistory.length}일 기록</p>
      </div>

      {mockHistory.map((day) => (
        <section key={day.date} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold">{formatDate(day.date)}</h2>
            {day.marketCondition && (
              <span className="text-xs text-muted-foreground">{day.marketCondition}</span>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {day.stocks.map((stock, i) => (
              <Link
                key={stock.id}
                href={`/stock/${stock.ticker}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40',
                  i < day.stocks.length - 1 && 'border-b border-border'
                )}
              >
                <span className="w-4 text-xs font-bold text-muted-foreground">#{i + 1}</span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stock.name}</span>
                    <span className="text-xs text-muted-foreground">{stock.ticker}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{stock.reason}</p>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">진입가</p>
                    <p className="text-sm font-medium">{formatKRW(stock.entryPrice)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={cn('text-xs', riskConfig[stock.riskLevel].className)}>
                      {riskConfig[stock.riskLevel].label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {stock.theme}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
