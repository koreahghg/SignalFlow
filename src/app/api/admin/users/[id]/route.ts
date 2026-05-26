import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, suspendReason, suspendedUntil } = body

  if (action === 'suspend') {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedUntil: suspendedUntil ? new Date(suspendedUntil) : null,
        suspendReason: suspendReason ?? null,
      },
    })
    return NextResponse.json(user)
  }

  if (action === 'activate') {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: 'active',
        suspendedAt: null,
        suspendedUntil: null,
        suspendReason: null,
      },
    })
    return NextResponse.json(user)
  }

  if (action === 'setRole') {
    const { role } = body
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: '잘못된 역할입니다.' }, { status: 400 })
    }
    const user = await prisma.user.update({ where: { id }, data: { role } })
    return NextResponse.json(user)
  }

  return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 })
}
