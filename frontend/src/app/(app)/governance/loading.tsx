import { PageHeaderSkeleton, CardSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function GovernanceLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} rows={3} />
        ))}
      </div>
    </div>
  )
}
