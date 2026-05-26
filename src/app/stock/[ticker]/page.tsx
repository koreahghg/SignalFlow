import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatDate, formatKRW, formatPercent } from '@/lib/utils'
import type { StockRecommendation } from '@/types/stock'
import StockChart from '@/components/stock/StockChart'

const riskConfig = {
  low: { label: '저위험', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  medium: { label: '중위험', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: '고위험', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

// TODO: API 연동 후 제거
const mockStockHistory: Record<string, StockRecommendation[]> = {
  '005930': [
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
      reason: '반도체 업황 개선 기대감 + 외국인 순매수 3일 연속. 전일 거래대금 1조 돌파 후 눌림목 진입 구간.',
      theme: '반도체',
      volumeAnalysis: '전일 거래대금 1.2조, 5일 평균 대비 2.3배. 기관 매수 집중.',
      newsAnalysis: 'HBM4 수주 기대 뉴스 + AI 서버 수요 확대 보도. 외신 긍정적 언급.',
      riskLevel: 'medium',
    },
    {
      id: '7',
      date: '2026-05-20',
      ticker: '005930',
      name: '삼성전자',
      entryPrice: 73000,
      stopLossPrice: 71500,
      target1Price: 75000,
      target2Price: 77000,
      forceSellTime: '14:00',
      reason: '52주 저점 근처 반등 시도. 외국인 4일 연속 순매수.',
      theme: '반도체',
      volumeAnalysis: '전일 거래대금 8,700억. 5일 평균 대비 1.6배.',
      newsAnalysis: '파운드리 수주 확대 가능성 보도.',
      riskLevel: 'low',
    },
  ],
}

type Props = {
  params: Promise<{ ticker: string }>
}

export default async function StockDetailPage({ params }: Props) {
  const { ticker } = await params

  // TODO: API 연동 → const recs = await getStockRecommendations(ticker)
  const recs = mockStockHistory[ticker] ?? []
  const latest = recs[0]

  if (!latest) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">종목 정보를 찾을 수 없습니다.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  const risk = riskConfig[latest.riskLevel]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{latest.name}</h1>
            <span className="text-sm text-muted-foreground">{latest.ticker}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            최근 추천: {formatDate(latest.date)} · 총 {recs.length}회 추천
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className={cn('text-xs', risk.className)}>
            {risk.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {latest.theme}
          </Badge>
        </div>
      </div>

      {/* 차트 */}
      <StockChart
        ticker={latest.ticker}
        entryPrice={latest.entryPrice}
        stopLossPrice={latest.stopLossPrice}
        target1Price={latest.target1Price}
        target2Price={latest.target2Price}
      />

      {/* 최근 추천 상세 */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            최근 추천 상세 · {formatDate(latest.date)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 가격 정보 */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">가격 정보</p>
              <div className="rounded-md bg-muted/30 px-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">진입가</span>
                  <span className="text-sm font-semibold">{formatKRW(latest.entryPrice)}</span>
                </div>
                <Separator className="opacity-30" />
                <PriceRow label="손절가" price={latest.stopLossPrice} base={latest.entryPrice} highlight="red" />
                <PriceRow label="1차 익절" price={latest.target1Price} base={latest.entryPrice} highlight="green" />
                <PriceRow label="2차 익절" price={latest.target2Price} base={latest.entryPrice} highlight="green" />
                <Separator className="opacity-30" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">강제 매도</span>
                  <span className="text-sm font-medium text-orange-400">{latest.forceSellTime}</span>
                </div>
              </div>
            </div>

            {/* 분석 */}
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">추천 이유</p>
                <p className="text-sm leading-relaxed">{latest.reason}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">거래량 분석</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{latest.volumeAnalysis}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">뉴스 분석</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{latest.newsAnalysis}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추천 이력 */}
      {recs.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">추천 이력</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {recs.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 px-4 py-3">
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatDate(rec.date)}
                </span>
                <span className="text-sm font-medium">{formatKRW(rec.entryPrice)}</span>
                <span className="hidden flex-1 truncate text-xs text-muted-foreground sm:block">
                  손절 {formatKRW(rec.stopLossPrice)} · 1차 {formatKRW(rec.target1Price)}
                </span>
                <div className="ml-auto shrink-0">
                  <Badge variant="outline" className={cn('text-xs', riskConfig[rec.riskLevel].className)}>
                    {riskConfig[rec.riskLevel].label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/history" className="inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← 추천 내역으로
      </Link>
    </div>
  )
}

function PriceRow({
  label,
  price,
  base,
  highlight,
}: {
  label: string
  price: number
  base: number
  highlight?: 'green' | 'red'
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium',
            highlight === 'green' && 'text-emerald-400',
            highlight === 'red' && 'text-red-400'
          )}
        >
          {formatKRW(price)}
        </span>
        <span className={cn('text-xs', price >= base ? 'text-emerald-400' : 'text-red-400')}>
          {formatPercent(price, base)}
        </span>
      </div>
    </div>
  )
}
