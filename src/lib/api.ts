import type {
  StockRecommendation,
  DailyRecommendation,
  BacktestRequest,
  BacktestResult,
} from '@/types/stock'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function getTodayRecommendations(): Promise<StockRecommendation[]> {
  const res = await fetch(`${API_BASE}/api/recommendations/today`)
  if (!res.ok) throw new Error('추천 종목 로딩 실패')
  return res.json()
}

export async function getRecommendationsByDate(date: string): Promise<StockRecommendation[]> {
  const res = await fetch(`${API_BASE}/api/recommendations?date=${date}`)
  if (!res.ok) throw new Error('추천 종목 로딩 실패')
  return res.json()
}

export async function getHistory(): Promise<DailyRecommendation[]> {
  const res = await fetch(`${API_BASE}/api/recommendations/history`)
  if (!res.ok) throw new Error('히스토리 로딩 실패')
  return res.json()
}

export async function getStockRecommendations(ticker: string): Promise<StockRecommendation[]> {
  const res = await fetch(`${API_BASE}/api/stocks/${ticker}`)
  if (!res.ok) throw new Error('종목 정보 로딩 실패')
  return res.json()
}

export async function runBacktest(req: BacktestRequest): Promise<BacktestResult> {
  const res = await fetch(`${API_BASE}/api/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: req.startDate,
      end_date: req.endDate,
      market: req.market,
    }),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '알 수 없는 오류' }))
    throw new Error(err.detail ?? '백테스트 실행 실패')
  }
  return res.json()
}
