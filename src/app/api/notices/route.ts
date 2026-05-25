import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAIL = 'koreahghg@gmail.com'

export async function GET() {
  const notices = await prisma.notice.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(notices)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { title, content, pinned } = await req.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const notice = await prisma.notice.create({
    data: { title: title.trim(), content: content.trim(), pinned: !!pinned },
  })

  revalidatePath('/notice')
  return NextResponse.json(notice, { status: 201 })
}
