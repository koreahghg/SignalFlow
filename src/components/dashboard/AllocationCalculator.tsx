'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn, formatKRW } from '@/lib/utils'
import type { AllocationResult } from '@/app/api/allocation/route'
import type { StockRecommendation } from '@/types/stock'

type Props = {
  stocks: StockRecommendation[]
}

export function AllocationCalculator({ stocks }: Props) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AllocationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const numericAmount = Number(amount.replace(/,/g, ''))

  async function handleCalculate() {
    if (!numericAmount || numericAmount < 10000) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: numericAmount,
          stocks: stocks.map((s) => ({
            ticker: s.ticker,
            name: s.name,
            entryPrice: s.entryPrice,
            riskLevel: s.riskLevel,
            theme: s.theme,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '계산 실패')
      }

      setResult(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '')
    setAmount(raw ? Number(raw).toLocaleString() : '')
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">AI Allocation</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">자금 배분 계산기</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">투자 금액을 입력하면 AI가 종목별 비중과 매수 수량을 계산합니다</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              placeholder="투자 금액 입력 (최소 10,000원)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">원</span>
          </div>
          <Button
            onClick={handleCalculate}
            disabled={loading || !numericAmount || numericAmount < 10000}
            className="shrink-0"
          >
            {loading ? '계산 중...' : '계산하기'}
          </Button>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-4">
            <Separator className="opacity-30" />

            <p className="text-sm leading-relaxed text-muted-foreground">{result.strategy}</p>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">종목</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">비중</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">주수</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">투자금액</th>
                  </tr>
                </thead>
                <tbody>
                  {result.allocations.map((a, i) => (
                    <tr key={a.ticker} className={cn('border-b border-border/40 last:border-0', i % 2 === 0 ? '' : 'bg-muted/10')}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{a.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{a.ticker}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono font-bold text-primary">{a.weight_pct}%</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono">{a.shares.toLocaleString()}주</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono text-sm">{formatKRW(a.invested_amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.allocations.some((a) => a.reasoning) && (
              <div className="space-y-1.5">
                {result.allocations.map((a) =>
                  a.reasoning ? (
                    <p key={a.ticker} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{a.name}</span> — {a.reasoning}
                    </p>
                  ) : null,
                )}
              </div>
            )}

            <Separator className="opacity-30" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">총 투자금액</span>
              <span className="font-mono font-bold">{formatKRW(result.total_invested)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">미투자 잔액</span>
              <span className={cn('font-mono font-bold', result.cash_remaining > 0 ? 'text-yellow-400' : 'text-muted-foreground')}>
                {formatKRW(result.cash_remaining)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
