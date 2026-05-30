import PerpsLeaderboardClient from './PerpsLeaderboardClient'
import { PerpsLeaderboardHeader } from './PerpsLeaderboardHeader'

export const dynamic = 'force-dynamic'

export default function PerpsLeaderboardPage(props: any) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <PerpsLeaderboardHeader />
      <PerpsLeaderboardClient {...props} />
    </div>
  )
}
