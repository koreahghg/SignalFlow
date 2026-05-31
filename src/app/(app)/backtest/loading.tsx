import { Skeleton } from '@/components/ui/skeleton'

export default function BacktestLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
