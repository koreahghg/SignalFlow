'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const CATEGORIES = ['서비스 이용', '추천 종목', '계정/로그인', '결제', '버그 신고', '기타']

export default function NewInquiryPage() {
  const router = useRouter()
  const [form, setForm] = useState({ category: '', title: '', content: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.category) { toast.error('분류를 선택해주세요.'); return }
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!form.content.trim()) { toast.error('내용을 입력해주세요.'); return }

    setLoading(true)

    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? '오류가 발생했습니다.')
      setLoading(false)
      return
    }

    toast.success('문의가 접수되었습니다.')
    router.push('/inquiry')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Support</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">문의하기</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">영업일 기준 1~2일 내 답변드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 분류 */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">분류</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  form.category === cat
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            제목
          </label>
          <input
            id="title"
            type="text"
            placeholder="문의 제목을 입력해주세요"
            maxLength={100}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
        </div>

        {/* 내용 */}
        <div className="space-y-1.5">
          <label htmlFor="content" className="text-sm font-medium">
            내용
          </label>
          <textarea
            id="content"
            rows={7}
            placeholder="문의 내용을 상세히 입력해주세요"
            maxLength={2000}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <p className="text-right text-xs text-muted-foreground">{form.content.length} / 2000</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {loading ? '제출 중...' : '문의 제출'}
          </button>
        </div>
      </form>
    </div>
  )
}
