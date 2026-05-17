import { PageHeaderSkeleton, TableSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function PredictPortfolioLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={3} />
      <div className="mt-6">
        <TableSkeleton cols={5} rows={5} />
      </div>
    </div>
  )
}
