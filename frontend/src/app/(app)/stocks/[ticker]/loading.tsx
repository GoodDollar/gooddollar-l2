import { PageHeaderSkeleton, ChartSkeleton, StatGridSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'

export default function StockDetailLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <div className="mt-6">
        <ChartSkeleton height={300} />
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  )
}
