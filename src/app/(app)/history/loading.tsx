import { Skeleton } from '@/components/ui/skeleton'

function DaySkeletonSection() {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
          >
            <Skeleton className="h-3 w-4" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function HistoryLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <DaySkeletonSection />
      <DaySkeletonSection />
      <DaySkeletonSection />
    </div>
  )
}
