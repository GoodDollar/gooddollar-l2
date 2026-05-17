import { PageHeaderSkeleton, ChartSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function GovernanceAnalyticsLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton height={250} />
        <ChartSkeleton height={250} />
      </div>
    </div>
  )
}
