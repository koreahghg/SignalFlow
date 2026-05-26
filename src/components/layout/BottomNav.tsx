'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Clock, BarChart2, TrendingUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/history', icon: Clock, label: '내역' },
  { href: '/volume', icon: BarChart2, label: '거래량' },
  { href: '/stats', icon: TrendingUp, label: '통계' },
  { href: '/mypage', icon: User, label: '더보기' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  // 앱 로드 시 모든 탭 라우트를 라우터 캐시에 미리 올림
  useEffect(() => {
    NAV_ITEMS.forEach(({ href }) => router.prefetch(href))
  }, [router])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm sm:hidden">
      <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-3',
                'min-h-[56px] touch-manipulation select-none',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
