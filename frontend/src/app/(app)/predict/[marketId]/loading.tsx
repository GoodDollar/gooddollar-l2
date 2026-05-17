import { PageHeaderSkeleton, ChartSkeleton, StatGridSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'

export default function PredictMarketLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <div className="mt-6">
        <ChartSkeleton height={250} />
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={3} />
      </div>
    </div>
  )
}
