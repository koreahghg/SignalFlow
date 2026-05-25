'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react'

type Inquiry = {
  id: string
  category: string
  title: string
  content: string
  status: 'pending' | 'answered'
  reply: string | null
  repliedAt: string | null
  createdAt: string
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function InquiryPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/inquiries')
      .then((r) => r.json())
      .then(setInquiries)
      .finally(() => setLoading(false))
  }, [])

  const pending = inquiries.filter((i) => i.status === 'pending').length
  const answered = inquiries.filter((i) => i.status === 'answered').length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Support</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">문의 내역</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">총 {inquiries.length}건</p>
        </div>
        <Link
          href="/inquiry/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          문의하기
        </Link>
      </div>

      {/* 통계 */}
      {inquiries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">전체</p>
            <p className="mt-0.5 text-xl font-bold">{inquiries.length}</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
            <p className="text-xs text-yellow-400">답변 대기</p>
            <p className="mt-0.5 text-xl font-bold text-yellow-400">{pending}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs text-emerald-400">답변 완료</p>
            <p className="mt-0.5 text-xl font-bold text-emerald-400">{answered}</p>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">아직 문의 내역이 없습니다.</p>
          <Link
            href="/inquiry/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            첫 문의 남기기
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id}>
              <button
                onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/30"
              >
                {/* 상태 아이콘 */}
                {inquiry.status === 'answered' ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {inquiry.category}
                    </span>
                    {inquiry.status === 'answered' && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                        답변완료
                      </span>
                    )}
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

              {/* 펼침 상세 */}
              {expanded === inquiry.id && (
                <div className="border-t border-border bg-muted/10 px-5 py-4 space-y-4">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">문의 내용</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {inquiry.content}
                    </p>
                  </div>
                  {inquiry.reply && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
                      <p className="mb-1.5 text-xs font-semibold text-primary">답변</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {inquiry.reply}
                      </p>
                      {inquiry.repliedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(inquiry.repliedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
