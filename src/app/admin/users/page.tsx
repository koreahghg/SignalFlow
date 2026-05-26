import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { UserManagement } from './UserManagement'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect('/')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">사용자 관리</h1>
      </div>
      <UserManagement />
    </div>
  )
}
