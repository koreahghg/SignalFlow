import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { reply } = await req.json()

  if (!reply) return NextResponse.json({ error: '답변 내용을 입력해주세요.' }, { status: 400 })

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { reply, status: 'answered', repliedAt: new Date() },
  })

  return NextResponse.json(inquiry)
}
