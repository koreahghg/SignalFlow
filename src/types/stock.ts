export type RiskLevel = 'low' | 'medium' | 'high'

export type StockRecommendation = {
  id: string
  date: string // YYYY-MM-DD
  ticker: string
  name: string
  entryPrice: number
  stopLossPrice: number
  target1Price: number
  target2Price: number
  forceSellTime: string // HH:mm
  reason: string
  theme: string
  volumeAnalysis: string
  newsAnalysis: string
  riskLevel: RiskLevel
}

export type DailyRecommendation = {
  date: string
  stocks: StockRecommendation[]
  marketCondition: string
}
