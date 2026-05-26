import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(inquiries)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { category, title, content } = await req.json()

  if (!category || !title || !content) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      userId: session.user.id,
      userEmail: session.user.email!,
      userName: session.user.name ?? '이름 없음',
      category,
      title,
      content,
    },
  })

  return NextResponse.json(inquiry, { status: 201 })
}
