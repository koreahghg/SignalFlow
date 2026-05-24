import type { StockRecommendation, DailyRecommendation } from '@/types/stock'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

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
