import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { ApiTestClient } from './ApiTestClient'

export default async function ApiTestPage() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) redirect('/')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">API 테스트</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          연동된 모든 서비스 연결 상태를 확인합니다.
        </p>
      </div>
      <ApiTestClient />
    </div>
  )
}
