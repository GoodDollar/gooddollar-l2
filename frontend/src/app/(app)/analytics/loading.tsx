import { StatGridSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/PageSkeleton'

export default function AnalyticsLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="h-7 w-56 bg-dark-50/40 rounded-lg mb-2" />
          <div className="h-4 w-96 bg-dark-50/30 rounded" />
        </div>
        <div className="h-8 w-24 bg-dark-50/30 rounded-md" />
      </div>
      <StatGridSkeleton count={4} />
      <div className="mt-6">
        <CardSkeleton rows={4} />
      </div>
      <div className="mt-6">
        <TableSkeleton cols={6} rows={5} />
      </div>
      <div className="mt-6">
        <TableSkeleton cols={6} rows={4} />
      </div>
    </div>
  )
}
