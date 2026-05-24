import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatKRW, formatPercent } from '@/lib/utils'
import type { StockRecommendation } from '@/types/stock'

const riskConfig = {
  low: { label: '저위험', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  medium: { label: '중위험', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: '고위험', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

type PriceRowProps = {
  label: string
  price: number
  base: number
  highlight?: 'green' | 'red'
}

function PriceRow({ label, price, base, highlight }: PriceRowProps) {
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
        <span
          className={cn(
            'text-xs',
            price >= base ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {formatPercent(price, base)}
        </span>
      </div>
    </div>
  )
}

type Props = {
  stock: StockRecommendation
  rank: number
}

export function StockCard({ stock, rank }: Props) {
  const risk = riskConfig[stock.riskLevel]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
            <div>
              <CardTitle className="text-base">{stock.name}</CardTitle>
              <span className="text-xs text-muted-foreground">{stock.ticker}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={cn('text-xs', risk.className)}>
              {risk.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stock.theme}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 가격 정보 */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">가격 정보</p>
          <div className="rounded-md bg-muted/30 px-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">진입가</span>
              <span className="text-sm font-semibold">{formatKRW(stock.entryPrice)}</span>
            </div>
            <Separator className="opacity-30" />
            <PriceRow label="손절가" price={stock.stopLossPrice} base={stock.entryPrice} highlight="red" />
            <PriceRow label="1차 익절" price={stock.target1Price} base={stock.entryPrice} highlight="green" />
            <PriceRow label="2차 익절" price={stock.target2Price} base={stock.entryPrice} highlight="green" />
            <Separator className="opacity-30" />
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">강제 매도</span>
              <span className="text-sm font-medium text-orange-400">{stock.forceSellTime}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* 분석 */}
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">추천 이유</p>
            <p className="text-sm leading-relaxed">{stock.reason}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">거래량 분석</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{stock.volumeAnalysis}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">뉴스 분석</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{stock.newsAnalysis}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
