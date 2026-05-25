import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Pin } from 'lucide-react'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

const getNotices = unstable_cache(
  async () => {
    try {
      return await prisma.notice.findMany({
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      })
    } catch {
      return []
    }
  },
  ['notices'],
  { revalidate: 60 }
)

export default async function NoticePage() {
  const notices = await getNotices()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Notice</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">공지사항</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">총 {notices.length}개</p>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {notices.map((notice) => (
            <div key={notice.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                {notice.pinned && (
                  <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${notice.pinned ? 'text-primary' : 'text-foreground'}`}>
                    {notice.title}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {notice.content}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/60">{formatDate(notice.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
