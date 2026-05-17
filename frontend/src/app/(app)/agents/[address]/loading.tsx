import { ProfileSkeleton, StatGridSkeleton, TableSkeleton } from '@/components/ui/PageSkeleton'

export default function AgentDetailLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <ProfileSkeleton />
      <StatGridSkeleton count={4} />
      <div className="mt-6">
        <TableSkeleton cols={4} rows={5} />
      </div>
    </div>
  )
}
