import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import { AccessCodeManager } from './AccessCodeManager'

export default async function AdminAccessCodesPage() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) redirect('/')

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, name: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">초대 코드 관리</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          전체 {codes.length}개 · 사용됨 {codes.filter((c) => c.usedBy).length}개 ·
          미사용 {codes.filter((c) => !c.usedBy).length}개
        </p>
      </div>
      <AccessCodeManager initialCodes={codes} />
    </div>
  )
}
