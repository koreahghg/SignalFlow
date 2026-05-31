import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ChevronRight, MessageSquare, FileText, Shield } from 'lucide-react'
import { AccountActions } from './AccountActions'
import { isAdmin as checkAdmin } from '@/lib/admin'

export default async function MyPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: session.user.id },
    select: { status: true },
  })
  const inquiryCount = inquiries.length
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length

  const isAdmin = checkAdmin(session.user.email)

  const menuItems = [
    {
      icon: MessageSquare,
      label: '문의 내역',
      href: '/inquiry',
      badge: pendingCount > 0 ? `답변 대기 ${pendingCount}건` : undefined,
    },
    { icon: FileText, label: '공지사항', href: '/notice' },
    { icon: Shield, label: '서비스 이용약관', href: '/terms' },
    { icon: Shield, label: '개인정보 처리방침', href: '/privacy' },
  ]

  const signOutAction = async () => {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">마이페이지</h1>
      </div>

      {/* 프로필 카드 */}
      <div className="rounded-xl border border-border bg-card px-5 py-5">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ''}
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(session.user.name ?? '?')[0]}
            </div>
          )}
          <div>
            <p className="font-bold">{session.user.name}</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
            {isAdmin && (
              <span className="mt-1 inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                관리자
              </span>
            )}
          </div>
        </div>

        {/* 이용 통계 */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div className="text-center">
            <p className="text-xl font-bold">{inquiryCount}</p>
            <p className="text-xs text-muted-foreground">총 문의</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">답변 대기</p>
          </div>
        </div>
      </div>

      {/* 관리자 메뉴 */}
      {isAdmin && (
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
          <p className="border-b border-primary/20 px-4 py-2.5 text-xs font-semibold text-primary">
            관리자 메뉴
          </p>
          <Link
            href="/admin/users"
            className="flex items-center justify-between border-b border-primary/10 px-4 py-3.5 text-sm transition-colors hover:bg-primary/10"
          >
            <span className="font-medium">사용자 관리</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/admin/inquiries"
            className="flex items-center justify-between border-b border-primary/10 px-4 py-3.5 text-sm transition-colors hover:bg-primary/10"
          >
            <span className="font-medium">문의 관리</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/admin/access-codes"
            className="flex items-center justify-between px-4 py-3.5 text-sm transition-colors hover:bg-primary/10"
          >
            <span className="font-medium">초대 코드 관리</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      )}

      {/* 일반 메뉴 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
        {menuItems.map(({ icon: Icon, label, href, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-4 py-3.5 text-sm transition-colors hover:bg-accent/30"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {badge && (
                <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                  {badge}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* 로그아웃 / 회원탈퇴 */}
      <AccountActions signOutAction={signOutAction} />
    </div>
  )
}
