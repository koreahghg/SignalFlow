'use client'

import { useEffect, useRef, useState } from 'react'
import { useWebSocketContext } from '@/contexts/WebSocketContext'
import type { StockPriceData, WSMessage } from '@/types/websocket'

export function useStockPrices(tickers: string[]): Record<string, StockPriceData> {
  const { subscribe, unsubscribe, addListener } = useWebSocketContext()
  const [prices, setPrices] = useState<Record<string, StockPriceData>>({})
  const tickerKey = tickers.slice().sort().join(',')
  const prevKeyRef = useRef('')

  // Manage subscriptions when tickers change
  useEffect(() => {
    const prevKey = prevKeyRef.current
    prevKeyRef.current = tickerKey

    const prevSet = new Set(prevKey ? prevKey.split(',') : [])
    const nextSet = new Set(tickerKey ? tickerKey.split(',') : [])

    const added = [...nextSet].filter((t) => !prevSet.has(t))
    const removed = [...prevSet].filter((t) => !nextSet.has(t))

    if (added.length > 0) subscribe(added)
    if (removed.length > 0) unsubscribe(removed)

    return () => {
      // Unsubscribe all on unmount
      if (tickerKey) unsubscribe(tickerKey.split(','))
    }
    // tickerKey encodes all tickers — safe as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey])

  // Listen for price updates
  useEffect(() => {
    const tickerSet = new Set(tickerKey ? tickerKey.split(',') : [])
    return addListener((msg: WSMessage) => {
      if (msg.type === 'price_update' && tickerSet.has(msg.data.ticker)) {
        setPrices((prev) => ({ ...prev, [msg.data.ticker]: msg.data }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey, addListener])

  return prices
}
