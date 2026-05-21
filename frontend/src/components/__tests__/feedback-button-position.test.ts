import { describe, expect, it } from 'vitest'
import { getFeedbackButtonClasses } from '../FeedbackButton'

describe('FeedbackButton stocks-safe positioning classes', () => {
  it('keeps default placement on non-stocks routes', () => {
    const classes = getFeedbackButtonClasses('/predict')
    expect(classes.button).toContain('bottom-6')
    expect(classes.button).toContain('right-6')
    expect(classes.label).toBe('hidden sm:inline')
    expect(classes.dialog).toContain('w-80')
  })

  it('uses compact stocks placement and tighter dialog width constraints', () => {
    const classes = getFeedbackButtonClasses('/stocks/AAPL')
    expect(classes.button).toContain('right-3')
    expect(classes.button).toContain('sm:right-4')
    expect(classes.button).toContain('px-3.5')
    expect(classes.label).toBe('hidden xl:inline')
    expect(classes.dialog).toContain('w-[min(20rem,calc(100vw-1.5rem))]')
  })
})
