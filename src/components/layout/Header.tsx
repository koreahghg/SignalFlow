import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          SignalFlow
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            오늘 추천
          </Link>
          <Link href="/history" className="transition-colors hover:text-foreground">
            추천 내역
          </Link>
          <Link href="/stats" className="transition-colors hover:text-foreground">
            통계
          </Link>
          <Link href="/volume" className="transition-colors hover:text-foreground">
            거래량
          </Link>
        </nav>
      </div>
      <Separator />
    </header>
  )
}
