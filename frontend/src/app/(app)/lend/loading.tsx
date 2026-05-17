import { PageHeaderSkeleton, TableSkeleton, StatGridSkeleton } from '@/components/ui/PageSkeleton'

export default function LendLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <div className="mt-6">
        <TableSkeleton cols={5} rows={6} />
      </div>
    </div>
  )
}
