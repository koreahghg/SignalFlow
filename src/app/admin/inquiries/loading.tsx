import { Skeleton } from '@/components/ui/skeleton'

export default function AdminInquiriesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
