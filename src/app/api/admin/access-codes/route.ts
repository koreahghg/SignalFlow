import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, name: true } } },
  })

  return NextResponse.json(codes)
}

export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  let code: string
  let attempts = 0
  do {
    code = generateCode()
    attempts++
    if (attempts > 10) {
      return NextResponse.json({ error: '코드 생성 실패. 다시 시도해주세요.' }, { status: 500 })
    }
  } while (await prisma.accessCode.findUnique({ where: { code } }))

  const newCode = await prisma.accessCode.create({ data: { code } })
  return NextResponse.json(newCode, { status: 201 })
}
