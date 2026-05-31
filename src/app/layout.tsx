import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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
  title: 'SignalFlow',
  description: '매일 장 시작 전 단타 추천 종목 3개를 제공합니다.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const PUBLIC_PATHS = ['/login', '/activate', '/suspended', '/terms', '/privacy']

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? '/'

  if (!PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const session = await auth()
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { status: true },
      })
      if (user?.status === 'pending') redirect('/activate')
    }
  }

  return (
    <html lang="ko" className={`${gmarketSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-5xl px-4 pt-4 pb-24 sm:py-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
