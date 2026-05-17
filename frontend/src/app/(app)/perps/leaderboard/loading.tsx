import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/PageSkeleton'

export default function PerpsLeaderboardLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <TableSkeleton cols={5} rows={10} />
    </div>
  )
}
