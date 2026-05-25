import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatKRW } from '@/lib/utils'
import type { StockRecommendation } from '@/types/stock'

const riskConfig = {
  low: { label: '저위험', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  medium: { label: '중위험', className: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  high: { label: '고위험', className: 'border-red-500/40 bg-red-500/10 text-red-400' },
}

const rankColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600']

type Props = {
  stock: StockRecommendation
  rank: number
}

export function StockCard({ stock, rank }: Props) {
  const risk = riskConfig[stock.riskLevel]
  const upside1 = ((stock.target1Price - stock.entryPrice) / stock.entryPrice) * 100
  const upside2 = ((stock.target2Price - stock.entryPrice) / stock.entryPrice) * 100
  const downside = ((stock.stopLossPrice - stock.entryPrice) / stock.entryPrice) * 100
  const rrRatio = Math.abs(upside1 / downside)

  return (
    <Card className="flex flex-col border-border bg-card transition-colors hover:border-border/80 hover:bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('text-sm font-black tabular-nums', rankColors[rank - 1] ?? 'text-muted-foreground')}>
              #{rank}
            </span>
            <Link href={`/stock/${stock.ticker}`} className="min-w-0 group">
              <p className="truncate text-base font-bold group-hover:underline underline-offset-4">
                {stock.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{stock.ticker}</p>
            </Link>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" className={cn('text-xs', risk.className)}>
              {risk.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stock.theme}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-4">
        {/* 진입가 강조 */}
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">진입가</span>
            <span className="font-mono text-lg font-black tracking-tight">
              {formatKRW(stock.entryPrice)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">강제 매도</span>
            <span className="font-mono text-sm font-semibold text-orange-400">{stock.forceSellTime}</span>
          </div>
        </div>

        {/* 가격 레벨 */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/20">
            <span className="text-xs text-muted-foreground">2차 익절</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-emerald-400">{formatKRW(stock.target2Price)}</span>
              <span className="w-14 text-right font-mono text-xs text-emerald-500">+{upside2.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/20">
            <span className="text-xs text-muted-foreground">1차 익절</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-emerald-400">{formatKRW(stock.target1Price)}</span>
              <span className="w-14 text-right font-mono text-xs text-emerald-500">+{upside1.toFixed(1)}%</span>
            </div>
          </div>

          <Separator className="my-1 opacity-30" />

          <div className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/20">
            <span className="text-xs text-muted-foreground">손절가</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-red-400">{formatKRW(stock.stopLossPrice)}</span>
              <span className="w-14 text-right font-mono text-xs text-red-500">{downside.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 손익비 */}
        <div className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">손익비 (RR)</span>
          <span className={cn('font-mono text-sm font-bold', rrRatio >= 2 ? 'text-emerald-400' : rrRatio >= 1.5 ? 'text-yellow-400' : 'text-muted-foreground')}>
            1 : {rrRatio.toFixed(1)}
          </span>
        </div>

        <Separator className="opacity-30" />

        {/* 분석 */}
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">추천 이유</p>
            <p className="leading-relaxed">{stock.reason}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">거래량 분석</p>
            <p className="leading-relaxed text-muted-foreground">{stock.volumeAnalysis}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">뉴스 분석</p>
            <p className="leading-relaxed text-muted-foreground">{stock.newsAnalysis}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
