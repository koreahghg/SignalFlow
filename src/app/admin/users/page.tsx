import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserManagement } from './UserManagement'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect('/')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspendReason: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { trades: true } },
    },
  })

  const suspendedCount = users.filter((u) => u.status === 'suspended').length

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">사용자 관리</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          전체 {users.length}명 · 정지 {suspendedCount}명
        </p>
      </div>
      <UserManagement users={users as never} />
    </div>
  )
}
