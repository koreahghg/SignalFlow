import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  await prisma.$transaction([
    prisma.accessCode.deleteMany({ where: { usedBy: userId } }),
    prisma.inquiry.deleteMany({ where: { userId } }),
    prisma.trade.deleteMany({ where: { userId } }),
    prisma.watchlist.deleteMany({ where: { userId } }),
    prisma.backtest.deleteMany({ where: { userId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])

  return NextResponse.json({ ok: true })
}
