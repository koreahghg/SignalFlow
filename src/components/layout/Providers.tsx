'use client'

import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { WebSocketProvider } from '@/contexts/WebSocketContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
      <Toaster theme="dark" position="bottom-center" richColors />
    </TooltipProvider>
  )
}
