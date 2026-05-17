import { PageHeaderSkeleton, CardSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function StableLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  )
}
