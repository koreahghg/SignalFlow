import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const notices = await prisma.notice.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(notices)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  let title: string, content: string, pinned: boolean
  try {
    ;({ title, content, pinned } = await req.json())
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const notice = await prisma.notice.create({
    data: { title: title.trim(), content: content.trim(), pinned: !!pinned },
  })

  revalidatePath('/notice')
  revalidatePath('/')
  return NextResponse.json(notice, { status: 201 })
}
