import { PageHeaderSkeleton, CardSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function YieldLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} rows={3} />
        ))}
      </div>
    </div>
  )
}
