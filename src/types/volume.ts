export type AlertLevel = 'watch' | 'caution' | 'alert' | 'critical'

export interface VolumeAlert {
  ticker: string
  name: string
  alertLevel: AlertLevel
  surgeScore: number
  volumeRatio: number
  tradingValueRatio: number
  currentVolume: number
  avgVolume: number
  currentTradingValue: number
  avgTradingValue: number
  priceChangeRate: number
  isAbnormal: boolean
  abnormalReason: string
  morningSupplyScore: number
  detectedAt: string
  signals: string[]
}
