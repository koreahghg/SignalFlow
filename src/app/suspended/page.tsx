import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ShieldAlert, Bell, MessageSquare } from 'lucide-react'

export default async function SuspendedPage() {
  const session = await auth()

  let suspendedUntil: Date | null = null
  let suspendReason: string | null = null

  if (session?.user?.id) {
    const rows = await prisma.$queryRaw<
      { suspendedUntil: Date | null; suspendReason: string | null }[]
    >`
      SELECT "suspendedUntil", "suspendReason"
      FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `
    suspendedUntil = rows[0]?.suspendedUntil ?? null
    suspendReason = rows[0]?.suspendReason ?? null
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-12 text-center">
        <ShieldAlert className="mb-4 h-14 w-14 text-red-400" />
        <h1 className="text-xl font-bold text-red-400">서비스 이용이 정지되었습니다</h1>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {suspendedUntil ? (
            <p>정지 해제일: <span className="font-medium text-foreground">{new Date(suspendedUntil).toLocaleDateString('ko-KR')}</span></p>
          ) : (
            <p>계정이 영구 정지되었습니다.</p>
          )}
          {suspendReason && <p>사유: {suspendReason}</p>}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          이의가 있으시면 문의하기를 이용해주세요.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
        <Link
          href="/notice"
          className="flex items-center gap-3 px-4 py-4 text-sm transition-colors hover:bg-accent/30"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">공지사항 보기</span>
        </Link>
        <Link
          href="/inquiry/new"
          className="flex items-center gap-3 px-4 py-4 text-sm transition-colors hover:bg-accent/30"
        >
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">문의하기</span>
        </Link>
      </div>
    </div>
  )
}
