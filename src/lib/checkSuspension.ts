import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function checkSuspension() {
  const session = await auth()
  if (!session?.user?.id) return

  const rows = await prisma.$queryRaw<
    { status: string; suspendedUntil: Date | null; suspendReason: string | null }[]
  >`
    SELECT status, "suspendedUntil", "suspendReason"
    FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `
  const user = rows[0]
  if (!user) return

  const isSuspended =
    user.status === 'suspended' &&
    (!user.suspendedUntil || new Date(user.suspendedUntil) > new Date())

  if (isSuspended) redirect('/suspended')
}
