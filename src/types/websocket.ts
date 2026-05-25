export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface StockPriceData {
  ticker: string
  name: string
  currentPrice: number
  change: number
  changeRate: number
  volume: number
  tradingValue: number
  highPrice: number
  lowPrice: number
  prevClose: number
  timestamp: string
}

export type WSMessage =
  | { type: 'price_update'; data: StockPriceData }
  | { type: 'subscribed'; tickers: string[] }
  | { type: 'pong' }
  | { type: 'error'; message: string }

export type ClientMessage =
  | { type: 'subscribe'; tickers: string[] }
  | { type: 'unsubscribe'; tickers: string[] }
  | { type: 'ping' }
