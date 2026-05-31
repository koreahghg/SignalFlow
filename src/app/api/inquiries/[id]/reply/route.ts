import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  let reply: string
  try {
    ;({ reply } = await req.json())
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  if (!reply) return NextResponse.json({ error: '답변 내용을 입력해주세요.' }, { status: 400 })

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { reply, status: 'answered', repliedAt: new Date() },
  })

  return NextResponse.json(inquiry)
}
