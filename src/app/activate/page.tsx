'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { KeyRound, ShieldCheck } from 'lucide-react'

export default function ActivatePage() {
  const { update } = useSession()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (code.trim().length !== 6) {
      setError('6자리 코드를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/access-codes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다.')
        return
      }
      await update()
      router.push('/')
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        {/* 아이콘 + 제목 */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">서비스 이용 코드 입력</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            서비스를 이용하려면 관리자에게<br />초대 코드를 받아 입력해주세요.
          </p>
        </div>

        {/* 코드 입력 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
                setError('')
              }}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.5em] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {loading ? '확인 중...' : '코드 등록'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          코드가 없으신가요?{' '}
          <a href="mailto:koreahghg@gmail.com" className="underline underline-offset-2 hover:text-foreground">
            관리자에게 문의
          </a>
        </p>
      </div>
    </div>
  )
}
