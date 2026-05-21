import { TableSkeleton, PageHeaderSkeleton } from '@/components/ui/PageSkeleton'

export default function ActivityLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-pulse">
      <PageHeaderSkeleton />
      <TableSkeleton cols={4} rows={10} />
    </div>
  )
}
