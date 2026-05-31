import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
          >
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
