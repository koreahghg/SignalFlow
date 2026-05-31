'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin } from 'lucide-react'
import { toast } from 'sonner'

export function NoticeForm() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', content: '', pinned: false })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('제목을 입력해주세요.'); return }
    if (!form.content.trim()) { toast.error('내용을 입력해주세요.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? '오류가 발생했습니다.')
        return
      }

      toast.success('공지사항이 등록되었습니다.')
      router.push('/notice')
      router.refresh()
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          form.pinned
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:text-foreground'
        }`}
      >
        <Pin className={`h-3.5 w-3.5 ${form.pinned ? 'fill-primary' : ''}`} />
        {form.pinned ? '고정됨' : '고정 안함'}
      </button>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">제목</label>
        <input
          id="title"
          type="text"
          placeholder="공지사항 제목을 입력해주세요"
          maxLength={100}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className="text-sm font-medium">내용</label>
        <textarea
          id="content"
          rows={10}
          placeholder="공지 내용을 입력해주세요"
          maxLength={5000}
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
        />
        <p className="text-right text-xs text-muted-foreground">{form.content.length} / 5000</p>
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
          {loading ? '등록 중...' : '공지 등록'}
        </button>
      </div>
    </form>
  )
}
