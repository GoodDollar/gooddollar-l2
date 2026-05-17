import { PageHeaderSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'

export default function AgentsLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} rows={4} />
        ))}
      </div>
    </div>
  )
}
