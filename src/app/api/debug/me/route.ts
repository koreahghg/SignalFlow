import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'not logged in' })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, status: true },
  })

  return NextResponse.json({
    sessionUserId: session.user.id,
    sessionStatus: (session.user as { status?: string }).status,
    dbUser: user,
  })
}
