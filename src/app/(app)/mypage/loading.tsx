import { Skeleton } from '@/components/ui/skeleton'

export default function MyPageLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-36" />
      </div>

      {/* 프로필 카드 */}
      <div className="rounded-xl border border-border bg-card px-5 py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-7 w-8" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* 메뉴 */}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>

      {/* 로그아웃 버튼 */}
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}
