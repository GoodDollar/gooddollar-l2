import { PageHeaderSkeleton, ChartSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function UBIImpactLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <div className="mt-6">
        <ChartSkeleton height={350} />
      </div>
    </div>
  )
}
