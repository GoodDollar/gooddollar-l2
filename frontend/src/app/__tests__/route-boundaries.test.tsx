import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import FaucetLoading from '@/app/(app)/faucet/loading'
import InviteLoading from '@/app/(app)/invite/loading'
import TestnetGuideLoading from '@/app/(app)/testnet-guide/loading'
import AnalyticsLoading from '@/app/(app)/analytics/loading'
import ActivityLoading from '@/app/activity/loading'

import FaucetError from '@/app/(app)/faucet/error'
import InviteError from '@/app/(app)/invite/error'
import TestnetGuideError from '@/app/(app)/testnet-guide/error'
import AnalyticsError from '@/app/(app)/analytics/error'
import ActivityError from '@/app/activity/error'
import TestDashboardError from '@/app/(app)/test-dashboard/error'
import ExploreSymbolError from '@/app/(app)/explore/[symbol]/error'

describe('Route loading skeletons', () => {
  it.each([
    ['Faucet', FaucetLoading],
    ['Invite', InviteLoading],
    ['Testnet Guide', TestnetGuideLoading],
    ['Analytics', AnalyticsLoading],
    ['Activity', ActivityLoading],
  ])('%s loading renders an animated skeleton', (_name, Component) => {
    const { container } = render(<Component />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })
})

describe('Route error boundaries', () => {
  const testError = new Error('test error') as Error & { digest?: string }
  testError.digest = 'abc123'

  it.each([
    ['Faucet', FaucetError],
    ['Invite', InviteError],
    ['Testnet Guide', TestnetGuideError],
    ['Analytics', AnalyticsError],
    ['Activity', ActivityError],
    ['Test Dashboard', TestDashboardError],
    ['Explore Symbol', ExploreSymbolError],
  ])('%s error renders ErrorFallback with Try Again', (_name, Component) => {
    const reset = () => {}
    render(<Component error={testError} reset={reset} />)
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it.each([
    ['Faucet', FaucetError],
    ['Invite', InviteError],
    ['Testnet Guide', TestnetGuideError],
    ['Analytics', AnalyticsError],
    ['Activity', ActivityError],
    ['Test Dashboard', TestDashboardError],
    ['Explore Symbol', ExploreSymbolError],
  ])('%s error calls reset when Try Again is clicked', (_name, Component) => {
    let resetCalled = false
    const reset = () => { resetCalled = true }
    render(<Component error={testError} reset={reset} />)
    fireEvent.click(screen.getByText('Try Again'))
    expect(resetCalled).toBe(true)
  })

  it.each([
    ['Faucet', FaucetError],
    ['Invite', InviteError],
    ['Testnet Guide', TestnetGuideError],
    ['Analytics', AnalyticsError],
    ['Activity', ActivityError],
    ['Test Dashboard', TestDashboardError],
    ['Explore Symbol', ExploreSymbolError],
  ])('%s error shows the error digest', (_name, Component) => {
    const reset = () => {}
    render(<Component error={testError} reset={reset} />)
    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })
})
