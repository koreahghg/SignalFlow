'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </TooltipProvider>
  )
}
