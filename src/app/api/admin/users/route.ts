import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

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

  return NextResponse.json(users)
}
