import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { VolumeAlert, AlertLevel } from '@/types/volume'

const alertConfig: Record<AlertLevel, { label: string; className: string; barColor: string }> = {
  watch:    { label: '관찰',   className: 'border-slate-500/40 bg-slate-500/10 text-slate-400',   barColor: 'bg-slate-500' },
  caution:  { label: '주의',   className: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', barColor: 'bg-yellow-500' },
  alert:    { label: '경보',   className: 'border-orange-500/40 bg-orange-500/10 text-orange-400', barColor: 'bg-orange-500' },
  critical: { label: '급등!',  className: 'border-red-500/40 bg-red-500/10 text-red-400',          barColor: 'bg-red-500' },
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

function formatTradingValue(v: number): string {
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1)}조`
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억`
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만`
  return String(v)
}

type Props = { alert: VolumeAlert }

export function VolumeSurgeCard({ alert }: Props) {
  const cfg = alertConfig[alert.alertLevel]
  const scoreWidth = Math.min(alert.surgeScore, 100)

  return (
    <Card className="flex flex-col border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold">{alert.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{alert.ticker}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant="outline" className={cn('text-xs', cfg.className)}>
              {cfg.label}
            </Badge>
            {alert.isAbnormal && (
              <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400 text-xs">
                이상탐지
              </Badge>
            )}
          </div>
        </div>

        {/* surge score 바 */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">급등 점수</span>
            <span className="font-mono font-bold">{alert.surgeScore.toFixed(0)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', cfg.barColor)}
              style={{ width: `${scoreWidth}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-3">
        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">거래량 배율</p>
            <p className={cn(
              'font-mono text-lg font-black',
              alert.volumeRatio >= 4 ? 'text-red-400' :
              alert.volumeRatio >= 2 ? 'text-orange-400' : 'text-yellow-400'
            )}>
              {alert.volumeRatio.toFixed(1)}x
            </p>
          </div>
          <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">거래대금 배율</p>
            <p className={cn(
              'font-mono text-lg font-black',
              alert.tradingValueRatio >= 4 ? 'text-red-400' :
              alert.tradingValueRatio >= 2 ? 'text-orange-400' : 'text-yellow-400'
            )}>
              {alert.tradingValueRatio.toFixed(1)}x
            </p>
          </div>
        </div>

        {/* 거래량 수치 */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">현재 거래량</span>
            <span className="font-mono">{formatVolume(alert.currentVolume)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">20일 평균</span>
            <span className="font-mono text-muted-foreground">{formatVolume(alert.avgVolume)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">거래대금</span>
            <span className="font-mono">{formatTradingValue(alert.currentTradingValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">가격 변동</span>
            <span className={cn(
              'font-mono font-semibold',
              alert.priceChangeRate > 0 ? 'text-red-400' : alert.priceChangeRate < 0 ? 'text-blue-400' : 'text-muted-foreground'
            )}>
              {alert.priceChangeRate > 0 ? '+' : ''}{alert.priceChangeRate.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 장초반 수급 */}
        {alert.morningSupplyScore !== 50 && (
          <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">장초반 수급</span>
              <span className={cn(
                'font-mono font-semibold',
                alert.morningSupplyScore >= 70 ? 'text-emerald-400' :
                alert.morningSupplyScore >= 40 ? 'text-yellow-400' : 'text-muted-foreground'
              )}>
                {alert.morningSupplyScore.toFixed(0)}점
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  alert.morningSupplyScore >= 70 ? 'bg-emerald-500' :
                  alert.morningSupplyScore >= 40 ? 'bg-yellow-500' : 'bg-slate-500'
                )}
                style={{ width: `${alert.morningSupplyScore}%` }}
              />
            </div>
          </div>
        )}

        {/* 이상 거래 */}
        {alert.isAbnormal && alert.abnormalReason && (
          <div className="rounded-md border border-purple-500/30 bg-purple-500/5 px-3 py-2">
            <p className="text-xs font-medium text-purple-400">이상 거래 감지</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{alert.abnormalReason}</p>
          </div>
        )}

        {/* 신호 목록 */}
        {alert.signals.length > 0 && (
          <div className="space-y-1">
            {alert.signals.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-0.5 shrink-0 text-primary">›</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
