import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  let action: string, suspendReason: string | undefined, suspendedUntil: string | undefined, role: string | undefined
  try {
    ;({ action, suspendReason, suspendedUntil, role } = await req.json())
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  if (action === 'suspend') {
    const until = suspendedUntil ? new Date(suspendedUntil) : null
    await prisma.$executeRaw`
      UPDATE "User"
      SET status = 'suspended',
          "suspendedAt" = NOW(),
          "suspendedUntil" = ${until},
          "suspendReason" = ${suspendReason ?? null}
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true })
  }

  if (action === 'activate') {
    await prisma.$executeRaw`
      UPDATE "User"
      SET status = 'active',
          "suspendedAt" = NULL,
          "suspendedUntil" = NULL,
          "suspendReason" = NULL
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true })
  }

  if (action === 'setRole') {
    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: '잘못된 역할입니다.' }, { status: 400 })
    }
    await prisma.$executeRaw`UPDATE "User" SET role = ${role} WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 })
}
