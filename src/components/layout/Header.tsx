import Link from 'next/link'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'
import { ConnectionStatus } from '@/components/common/ConnectionStatus'
import { auth } from '@/auth'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            SignalFlow
          </Link>
          <ConnectionStatus />
        </div>
        <div className="flex items-center gap-3">
          {/* 데스크탑 전용 링크 */}
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              오늘 추천
            </Link>
            <Link href="/history" className="transition-colors hover:text-foreground">
              추천 내역
            </Link>
            <Link href="/stats" className="transition-colors hover:text-foreground">
              통계
            </Link>
            <Link href="/backtest" className="transition-colors hover:text-foreground">
              백테스트
            </Link>
            <Link href="/volume" className="transition-colors hover:text-foreground">
              거래량
            </Link>
            <Link href="/notice" className="transition-colors hover:text-foreground">
              공지사항
            </Link>
            <Link href="/inquiry" className="transition-colors hover:text-foreground">
              문의
            </Link>
          </nav>

          {/* 아바타: 항상 표시 */}
          {session?.user?.image && (
            <Link href="/mypage" className="flex items-center sm:border-l sm:border-border sm:pl-4">
              <Image
                src={session.user.image}
                alt={session.user.name ?? ''}
                width={28}
                height={28}
                className="rounded-full transition-opacity hover:opacity-80"
              />
            </Link>
          )}
        </div>
      </div>
      <Separator />
    </header>
  )
}
