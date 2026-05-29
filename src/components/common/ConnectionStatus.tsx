'use client'

import { useWebSocketContext } from '@/contexts/WebSocketContext'
import { cn } from '@/lib/utils'
import type { WSStatus } from '@/types/websocket'

const config: Record<WSStatus, { dot: string; label: string; text: string }> = {
  connected: {
    dot: 'bg-emerald-500',
    label: 'Live',
    text: 'text-emerald-400',
  },
  connecting: {
    dot: 'bg-yellow-500 animate-pulse',
    label: '연결 중',
    text: 'text-yellow-400',
  },
  reconnecting: {
    dot: 'bg-yellow-500 animate-pulse',
    label: '재연결 중',
    text: 'text-yellow-400',
  },
  disconnected: {
    dot: 'bg-red-500',
    label: '연결 끊김',
    text: 'text-red-400',
  },
}

export function ConnectionStatus({ className }: { className?: string }) {
  const { status } = useWebSocketContext()

  if (status === 'disconnected') return null

  const { dot, label, text } = config[status]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      <span className={cn('text-xs font-medium tabular-nums', text)}>{label}</span>
    </div>
  )
}
