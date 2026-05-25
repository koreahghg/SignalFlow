import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/layout/Header'

const gmarketSans = localFont({
  src: [
    { path: '../../public/fonts/GmarketSansLight.woff', weight: '300', style: 'normal' },
    { path: '../../public/fonts/GmarketSansMedium.woff', weight: '500', style: 'normal' },
    { path: '../../public/fonts/GmarketSansBold.woff', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SignalFlow — 주식 단타 추천',
  description: '매일 장 시작 전 단타 추천 종목 3개를 제공합니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${gmarketSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TooltipProvider>
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  )
}
