'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Status = 'idle' | 'testing' | 'ok' | 'fail'
type TestResult = { ok: boolean; message: string; latency: number }

interface Service {
  id: string
  name: string
  description: string
}

const SERVICES: Service[] = [
  { id: 'fastapi',         name: 'FastAPI 서버',    description: '백엔드 서버 헬스 체크' },
  { id: 'db',              name: 'Supabase DB',    description: '데이터베이스 연결' },
  { id: 'recommendations', name: '추천 API',        description: '오늘 추천 종목 조회' },
  { id: 'fdr',             name: 'FDR 데이터',      description: 'FinanceDataReader 주가 데이터' },
  { id: 'volume',          name: '거래량 분석',      description: '거래량 서지 분석' },
  { id: 'kis',             name: 'KIS API',         description: '실시간 시세 (API 키 필요)' },
  { id: 'ai',              name: 'AI (GROQ)',       description: 'AI 분석 프로바이더' },
  { id: 'discord',         name: 'Discord',         description: '알림 웹훅 전송 테스트' },
]

interface ServiceState {
  status: Status
  message?: string
  latency?: number
}

async function callTest(service: string): Promise<TestResult> {
  const res = await fetch('/api/admin/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service }),
  })
  return res.json()
}

export function ApiTestClient() {
  const [states, setStates] = useState<Record<string, ServiceState>>(
    Object.fromEntries(SERVICES.map((s) => [s.id, { status: 'idle' }]))
  )
  const [running, setRunning] = useState(false)

  const setServiceState = (id: string, state: ServiceState) =>
    setStates((prev) => ({ ...prev, [id]: state }))

  const runSingle = async (id: string) => {
    setServiceState(id, { status: 'testing' })
    const result = await callTest(id)
    setServiceState(id, {
      status: result.ok ? 'ok' : 'fail',
      message: result.message,
      latency: result.latency,
    })
  }

  const runAll = async () => {
    setRunning(true)
    setStates(Object.fromEntries(SERVICES.map((s) => [s.id, { status: 'testing' }])))
    await Promise.all(SERVICES.map((s) => runSingle(s.id)))
    setRunning(false)
  }

  const statusBadge = (status: Status) => {
    if (status === 'idle')    return <Badge variant="outline" className="text-xs">대기</Badge>
    if (status === 'testing') return <Badge variant="outline" className="text-xs animate-pulse">테스트 중...</Badge>
    if (status === 'ok')      return <Badge className="text-xs bg-green-600 hover:bg-green-600">정상</Badge>
    return <Badge variant="destructive" className="text-xs">실패</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={runAll} disabled={running} size="sm">
          {running ? '테스트 중...' : '전체 테스트'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {SERVICES.filter((s) => states[s.id]?.status === 'ok').length}/{SERVICES.length} 정상
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICES.map((svc) => {
          const state = states[svc.id]
          return (
            <Card key={svc.id} className={state.status === 'fail' ? 'border-destructive/50' : state.status === 'ok' ? 'border-green-600/40' : ''}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{svc.name}</span>
                    {statusBadge(state.status)}
                    {state.latency !== undefined && (
                      <span className="text-xs text-muted-foreground">{state.latency}ms</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {state.message ?? svc.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs"
                  disabled={state.status === 'testing'}
                  onClick={() => runSingle(svc.id)}
                >
                  테스트
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
