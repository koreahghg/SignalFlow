import { Skeleton } from '@/components/ui/skeleton'

export default function NoticeLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-5 py-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-3/4" />
            <Skeleton className="mt-2.5 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
