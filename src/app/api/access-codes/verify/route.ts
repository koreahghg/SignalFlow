import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  let code: string
  try {
    ;({ code } = await req.json())
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: '코드를 입력해주세요.' }, { status: 400 })
  }

  const normalized = code.trim().toUpperCase()

  const accessCode = await prisma.accessCode.findUnique({ where: { code: normalized } })

  if (!accessCode) {
    return NextResponse.json({ error: '유효하지 않은 코드입니다.' }, { status: 400 })
  }

  if (accessCode.usedBy) {
    if (accessCode.usedBy === session.user.id) {
      return NextResponse.json({ error: '이미 등록된 코드입니다.' }, { status: 400 })
    }
    return NextResponse.json({ error: '이미 사용된 코드입니다.' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.accessCode.update({
      where: { code: normalized },
      data: { usedBy: session.user.id, usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { status: 'active' },
    }),
  ])

  return NextResponse.json({ ok: true })
}
