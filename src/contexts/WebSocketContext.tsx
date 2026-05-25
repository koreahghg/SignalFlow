'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ClientMessage, WSMessage, WSStatus } from '@/types/websocket'

type Listener = (msg: WSMessage) => void

interface WSContextValue {
  status: WSStatus
  subscribe: (tickers: string[]) => void
  unsubscribe: (tickers: string[]) => void
  addListener: (fn: Listener) => () => void
}

const WebSocketContext = createContext<WSContextValue | null>(null)

function getWsUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  return api.replace(/^http/, 'ws') + '/ws/stocks'
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WSStatus>('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const listenersRef = useRef<Set<Listener>>(new Set())
  const retryRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ref-counted subscriptions: ticker → count
  // keeps subscription alive even when multiple hooks subscribe to the same ticker
  const subCountsRef = useRef<Map<string, number>>(new Map())
  // tickers that should be (re)subscribed when connection is restored
  const pendingRef = useRef<Set<string>>(new Set())

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const connect = useCallback(() => {
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws
    setStatus(retryRef.current > 0 ? 'reconnecting' : 'connecting')

    ws.onopen = () => {
      retryRef.current = 0
      setStatus('connected')

      const tickers = Array.from(pendingRef.current)
      if (tickers.length > 0) {
        ws.send(JSON.stringify({ type: 'subscribe', tickers }))
      }

      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30_000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WSMessage
        listenersRef.current.forEach((fn) => fn(msg))
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      clearInterval(heartbeatRef.current ?? undefined)
      heartbeatRef.current = null
      setStatus('disconnected')

      // Exponential backoff with jitter: 1 s → 2 → 4 → 8 → 16 → max 30 s
      const base = Math.min(1000 * 2 ** retryRef.current, 30_000)
      const delay = base + Math.random() * 1000
      retryRef.current += 1
      retryTimerRef.current = setTimeout(() => connect(), delay)
    }

    ws.onerror = () => ws.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryTimerRef.current ?? undefined)
      clearInterval(heartbeatRef.current ?? undefined)
      wsRef.current?.close()
    }
  }, [connect])

  const subscribe = useCallback(
    (tickers: string[]) => {
      const toSend: string[] = []
      tickers.forEach((t) => {
        const prev = subCountsRef.current.get(t) ?? 0
        subCountsRef.current.set(t, prev + 1)
        if (prev === 0) {
          pendingRef.current.add(t)
          toSend.push(t)
        }
      })
      if (toSend.length > 0) send({ type: 'subscribe', tickers: toSend })
    },
    [send],
  )

  const unsubscribe = useCallback(
    (tickers: string[]) => {
      const toSend: string[] = []
      tickers.forEach((t) => {
        const prev = subCountsRef.current.get(t) ?? 0
        if (prev <= 1) {
          subCountsRef.current.delete(t)
          pendingRef.current.delete(t)
          toSend.push(t)
        } else {
          subCountsRef.current.set(t, prev - 1)
        }
      })
      if (toSend.length > 0) send({ type: 'unsubscribe', tickers: toSend })
    },
    [send],
  )

  const addListener = useCallback((fn: Listener) => {
    listenersRef.current.add(fn)
    return () => listenersRef.current.delete(fn)
  }, [])

  return (
    <WebSocketContext.Provider value={{ status, subscribe, unsubscribe, addListener }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext(): WSContextValue {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocketContext must be used inside <WebSocketProvider>')
  return ctx
}
