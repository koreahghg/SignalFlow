import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

type TestResult = { ok: boolean; message: string; latency: number }

async function runTest(service: string): Promise<TestResult> {
  const start = Date.now()
  const elapsed = () => Date.now() - start

  try {
    switch (service) {
      case 'fastapi': {
        const res = await fetch(`${API_BASE}/api/test/health`, { signal: AbortSignal.timeout(5000) })
        return { ok: res.ok, message: `HTTP ${res.status}`, latency: elapsed() }
      }
      case 'db': {
        await prisma.user.count()
        return { ok: true, message: 'Supabase 연결 정상', latency: elapsed() }
      }
      case 'recommendations': {
        const res = await fetch(`${API_BASE}/api/recommendations/today`, { signal: AbortSignal.timeout(10000) })
        const data = await res.json()
        const count = Array.isArray(data) ? data.length : 0
        return { ok: res.ok, message: `오늘 추천 ${count}개`, latency: elapsed() }
      }
      case 'fdr': {
        const res = await fetch(`${API_BASE}/api/stocks/005930/candles?days=5`, { signal: AbortSignal.timeout(20000) })
        const data = await res.json()
        const count = Array.isArray(data) ? data.length : 0
        return { ok: res.ok, message: `삼성전자 캔들 ${count}개`, latency: elapsed() }
      }
      case 'volume': {
        const res = await fetch(`${API_BASE}/api/volume/surge?limit=3&min_score=0`, { signal: AbortSignal.timeout(30000) })
        const data = await res.json()
        const count = Array.isArray(data) ? data.length : 0
        return { ok: res.ok, message: `거래량 상위 ${count}개`, latency: elapsed() }
      }
      case 'kis': {
        const res = await fetch(`${API_BASE}/api/kis/price/005930`, { signal: AbortSignal.timeout(10000) })
        if (res.status === 503) return { ok: false, message: 'KIS API 키 미설정', latency: elapsed() }
        return { ok: res.ok, message: `HTTP ${res.status}`, latency: elapsed() }
      }
      case 'ai': {
        const res = await fetch(`${API_BASE}/api/test/ai`, {
          headers: { 'x-internal-secret': INTERNAL_SECRET },
          signal: AbortSignal.timeout(20000),
        })
        const data = await res.json()
        return { ok: data.ok, message: `[${data.provider}] ${data.message}`, latency: data.latency_ms ?? elapsed() }
      }
      case 'discord': {
        const res = await fetch(`${API_BASE}/api/notify/discord/test`, {
          method: 'POST',
          headers: { 'x-internal-secret': INTERNAL_SECRET },
          signal: AbortSignal.timeout(10000),
        })
        return { ok: res.ok, message: res.ok ? 'Discord 전송 성공' : 'Discord 전송 실패', latency: elapsed() }
      }
      default:
        return { ok: false, message: '알 수 없는 서비스', latency: 0 }
    }
  } catch {
    return { ok: false, message: '연결 실패 (타임아웃 또는 서버 오류)', latency: elapsed() }
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let service: string
  try {
    ;({ service } = await req.json())
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 })
  }

  const result = await runTest(service)
  return NextResponse.json(result)
}
