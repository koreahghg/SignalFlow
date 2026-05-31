import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const users = await prisma.$queryRaw<
    {
      id: string
      email: string
      name: string | null
      image: string | null
      role: string
      status: string
      suspendedAt: Date | null
      suspendedUntil: Date | null
      suspendReason: string | null
      lastLoginAt: Date | null
      createdAt: Date
      tradeCount: bigint
    }[]
  >`
    SELECT
      u.id, u.email, u.name, u.image, u.role, u.status,
      u."suspendedAt", u."suspendedUntil", u."suspendReason",
      u."lastLoginAt", u."createdAt",
      COUNT(t.id) AS "tradeCount"
    FROM "User" u
    LEFT JOIN "Trade" t ON t."userId" = u.id
    GROUP BY u.id
    ORDER BY u."createdAt" DESC
  `

  const result = users.map((u) => ({
    ...u,
    tradeCount: Number(u.tradeCount),
    suspendedAt: u.suspendedAt?.toISOString() ?? null,
    suspendedUntil: u.suspendedUntil?.toISOString() ?? null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }))

  return NextResponse.json(result)
}
