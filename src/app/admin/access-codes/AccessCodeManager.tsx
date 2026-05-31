'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Plus } from 'lucide-react'

type Code = {
  id: string
  code: string
  usedBy: string | null
  usedAt: Date | string | null
  createdAt: Date | string
  user: { email: string; name: string | null } | null
}

function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(d))
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent/30"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? '복사됨' : '복사'}
    </button>
  )
}

export function AccessCodeManager({ initialCodes }: { initialCodes: Code[] }) {
  const router = useRouter()
  const [codes, setCodes] = useState(initialCodes)
  const [generating, setGenerating] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)

  async function generateCode() {
    setGenerating(true)
    setNewCode(null)
    try {
      const res = await fetch('/api/admin/access-codes', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setCodes([data, ...codes])
        setNewCode(data.code)
      }
    } finally {
      setGenerating(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* 생성 버튼 */}
      <div className="flex items-center gap-3">
        <button
          onClick={generateCode}
          disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          코드 생성
        </button>
        {newCode && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2">
            <span className="font-mono text-lg font-bold tracking-widest text-primary">{newCode}</span>
            <CopyButton text={newCode} />
          </div>
        )}
      </div>

      {/* 코드 목록 */}
      {codes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          생성된 코드가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span>코드</span>
            <span>사용자</span>
            <span>생성일</span>
            <span>상태</span>
          </div>
          {codes.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-widest">{c.code}</span>
                {!c.usedBy && <CopyButton text={c.code} />}
              </div>
              <span className="truncate text-sm text-muted-foreground">
                {c.user ? (
                  <span title={c.user.email}>{c.user.name ?? c.user.email}</span>
                ) : (
                  '—'
                )}
              </span>
              <span className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</span>
              <span
                className={
                  c.usedBy
                    ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400'
                    : 'rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400'
                }
              >
                {c.usedBy ? '사용됨' : '미사용'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
