import { TableSkeleton } from '@/components/ui/PageSkeleton'
import { PerpsLeaderboardHeader } from './PerpsLeaderboardHeader'

export default function PerpsLeaderboardLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <PerpsLeaderboardHeader />
      <TableSkeleton cols={5} rows={10} />
    </div>
  )
}
