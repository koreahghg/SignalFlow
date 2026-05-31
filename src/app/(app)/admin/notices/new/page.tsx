import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { NoticeForm } from './NoticeForm'

import { isAdmin } from '@/lib/admin'

export default async function AdminNoticeNewPage() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) redirect('/')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">공지사항 작성</h1>
      </div>
      <NoticeForm />
    </div>
  )
}
