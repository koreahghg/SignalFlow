import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AdminInquiryList } from './AdminInquiryList'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export default async function AdminInquiriesPage() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect('/')

  const inquiries = await prisma.inquiry.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">문의 관리</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          전체 {inquiries.length}건 · 답변 대기{' '}
          {inquiries.filter((i) => i.status === 'pending').length}건
        </p>
      </div>
      <AdminInquiryList inquiries={inquiries} />
    </div>
  )
}
