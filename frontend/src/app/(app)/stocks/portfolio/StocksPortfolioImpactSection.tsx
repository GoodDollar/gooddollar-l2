'use client'

import { UBIContributionCard } from '@/components/UBIContributionCard'
import { PartnershipIntegrationCard } from '@/components/PartnershipIntegrationCard'

export function StocksPortfolioImpactSection({ userUBIContribution }: { userUBIContribution: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6 mb-6" data-testid="stocks-impact-section">
      <UBIContributionCard
        platform="stocks"
        className="h-full"
      />
      <PartnershipIntegrationCard
        userUBIContribution={userUBIContribution}
        compact={false}
        className="h-full"
      />
    </div>
  )
}
