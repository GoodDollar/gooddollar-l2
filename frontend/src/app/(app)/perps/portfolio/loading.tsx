import { PageHeaderSkeleton, TableSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function PerpsPortfolioLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <div className="mt-6">
        <TableSkeleton cols={6} rows={5} />
      </div>
    </div>
  )
}
