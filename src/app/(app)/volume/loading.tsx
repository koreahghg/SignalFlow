import { Skeleton } from '@/components/ui/skeleton'

export default function VolumeLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-8 w-48 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
