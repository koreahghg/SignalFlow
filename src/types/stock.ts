export type RiskLevel = 'low' | 'medium' | 'high'

export type FactorLabel = '우수' | '양호' | '보통' | '미흡'

export type FactorScore = {
  score: number
  maxScore: number
  label: FactorLabel
  reason: string
}

export type ScoreBreakdown = {
  volume: number        // max 25
  news: number          // max 20
  volatility: number    // max 15
  theme: number         // max 20
  supplyDemand: number  // max 20
  total: number         // 0-100
  grade: string         // "S" | "A" | "B" | "C" | "D"
  // Per-factor detail (optional — populated when full breakdown is available)
  volumeFactor?: FactorScore
  newsFactor?: FactorScore
  volatilityFactor?: FactorScore
  themeFactor?: FactorScore
  supplyDemandFactor?: FactorScore
}

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
  scoreBreakdown?: ScoreBreakdown
}

export type DailyRecommendation = {
  date: string
  stocks: StockRecommendation[]
  marketCondition: string
}

// ── 백테스트 ──────────────────────────────────────────────────────────────────

export type BacktestRequest = {
  startDate: string  // YYYY-MM-DD
  endDate: string
  market: 'KOSPI' | 'KOSDAQ' | 'ALL'
}

export type PatternStats = {
  trades: number
  wins: number
  win_rate: number
  avg_return: number
}

export type RrStats = {
  avg_rr1: number
  avg_rr2: number
  pct_rr1_above_2: number
  pct_rr2_above_35: number
}

export type EquityPoint = {
  date: string
  cum_return: number
}

export type BacktestTrade = {
  date: string
  ticker: string
  name: string
  pattern: string
  score: number
  entry_price: number
  exit_price: number
  exit_reason: string
  pnl_pct: number
  risk_reward_1: number
  atr_pct: number
  volatility: string
}

export type BacktestResult = {
  total_trades: number
  win_rate: number
  avg_return: number
  total_return: number
  max_drawdown: number
  by_pattern: Record<string, PatternStats>
  rr_stats: RrStats
  exit_breakdown: Record<string, number>
  equity_curve: EquityPoint[]
  trades: BacktestTrade[]
}
