import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('@/components/UBIContributionCard', () => ({
  UBIContributionCard: ({ className }: { className?: string }) => (
    <div data-testid="ubi-contribution-card" className={className}>UBI Card</div>
  ),
}))

vi.mock('@/components/PartnershipIntegrationCard', () => ({
  PartnershipIntegrationCard: ({ className }: { className?: string }) => (
    <div data-testid="partnership-card" className={className}>Partnership Card</div>
  ),
}))

import { StocksPortfolioImpactSection } from '../StocksPortfolioImpactSection'

describe('StocksPortfolioImpactSection layout balance', () => {
  it('uses full-height card sizing to keep desktop empty-state columns visually balanced', () => {
    render(
      <TestWrapper>
        <StocksPortfolioImpactSection userUBIContribution={0} />
      </TestWrapper>,
    )

    const section = screen.getByTestId('stocks-impact-section')
    expect(section.className).toContain('items-stretch')

    expect(screen.getByTestId('ubi-contribution-card').className).toContain('h-full')
    expect(screen.getByTestId('ubi-contribution-card').className).not.toContain('h-fit')
    expect(screen.getByTestId('partnership-card').className).toContain('h-full')
    expect(screen.getByTestId('partnership-card').className).not.toContain('h-fit')
  })
})
