'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { InquiryModel as Inquiry } from '@/generated/prisma/models/Inquiry'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function AdminInquiryList({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function handleReply(id: string) {
    const reply = replies[id]?.trim()
    if (!reply) return

    setLoading(id)
    const res = await fetch(`/api/inquiries/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    })

    setLoading(null)
    if (res.ok) {
      toast.success('답변이 저장되었습니다.')
      router.refresh()
      setExpanded(null)
    } else {
      toast.error('답변 저장에 실패했습니다.')
    }
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {inquiries.length === 0 && (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">문의가 없습니다.</p>
      )}
      {inquiries.map((inquiry) => (
        <div key={inquiry.id}>
          <button
            onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/30"
          >
            {inquiry.status === 'answered' ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {inquiry.category}
                </span>
                <span className="text-xs text-muted-foreground">{inquiry.userEmail}</span>
                {inquiry.status === 'pending' && (
                  <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                    답변대기
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium">{inquiry.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(inquiry.createdAt)}</p>
            </div>
            {expanded === inquiry.id ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>

          {expanded === inquiry.id && (
            <div className="space-y-4 border-t border-border bg-muted/10 px-5 py-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  문의 내용 ({inquiry.userName} / {inquiry.userEmail})
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{inquiry.content}</p>
              </div>

              {inquiry.reply ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold text-emerald-400">기존 답변</p>
                  <p className="whitespace-pre-wrap text-sm">{inquiry.reply}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inquiry.repliedAt ? formatDate(inquiry.repliedAt) : ''}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {inquiry.reply ? '답변 수정' : '답변 작성'}
                </p>
                <textarea
                  rows={5}
                  placeholder="답변 내용을 입력해주세요"
                  defaultValue={inquiry.reply ?? ''}
                  onChange={(e) => setReplies((r) => ({ ...r, [inquiry.id]: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => handleReply(inquiry.id)}
                  disabled={loading === inquiry.id}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading === inquiry.id ? '저장 중...' : '답변 저장 및 발송'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
